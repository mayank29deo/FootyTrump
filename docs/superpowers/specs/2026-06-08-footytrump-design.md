# FootyTrump — Design Spec

- **Date:** 2026-06-08
- **Status:** Approved (pending written-spec review)
- **Working title:** FootyTrump
- **Inspiration:** The author's Cricket Trump Card game (`Cricket-TrumpCard_Mobile-game/`) — same React+Vite+Socket.io+Railway lineage, re-skinned for football and extended with a quiz section.

---

## 1. Vision

A FIFA World Cup 2026–themed web game with two pillars:

1. **⚔️ Trump Card Game** — battle friends (online rooms) or a CPU (solo) on footballer stats: Matches, Goals, Assists, Tackles, Saves, Clean Sheets.
2. **🧠 Quiz** — two solo modes: *Guess the Footballer* (3 hints → letter-tile fill-in, "bingo" feel) and *Multiple Choice* fast-fire trivia.

Look & feel: green striped **pitch** background with **Royal Navy + Gold** cards. Mobile-first, highly interactive, instantly playable.

---

## 2. Scope & phasing

Build order (decided): **Trump Card game first**, then the Quiz.

- **Phase 1 — Trump Card Game.** Shared rules engine, curated roster, card UI/theme, **solo vs CPU (first playable milestone)**, then online rooms (Railway Socket.io), home shell, results, polish.
- **Phase 2 — Quiz.** Quiz shell + scoring store, Guess the Footballer (+ clue data), Multiple Choice (+ question bank), local best-score leaderboard, polish.
- **Phase 3 — Later (out of scope for now).** EPL & La Liga decks, online quiz challenge, Supabase accounts/global leaderboard, mobile/Expo port.

---

## 3. Architecture

Monorepo mirroring the cricket project, with **one improvement**: a shared, framework-agnostic **rules engine** imported by both the browser (solo) and the server (online), so offline and online play can never disagree on the rules.

```
footbal-trumpcard/
├── package.json              # root: `concurrently` dev script (server + client)
├── vercel.json               # SPA rewrite for the client build
├── shared/                   # ⭐ ONE source of truth, imported by BOTH client & server
│   ├── engine/               # pure ESM rules engine
│   │   ├── constants.js      # STATS, STAT_MAX, STAT_LABELS, RARITY_POINTS
│   │   ├── game.js           # createGame, dealHands, selectCardAndStat, selectOpponentCard, resolveRound, win checks
│   │   ├── bot.js            # botPickActive / botPickOpponent (difficulty-aware)
│   │   ├── decks.js          # DECKS map keyed by deckType (international now; epl/laliga later)
│   │   └── *.test.js         # Vitest unit tests (TDD target)
│   └── data/
│       └── players.international.js   # curated roster (~50–60 players)
├── client/                   # React 18 + Vite + Tailwind + Zustand + React Router v6
│   ├── vercel deploy target
│   └── src/{components,pages,store,lib,data,styles}
└── server/                   # Node + Express + Socket.io (ESM) — online rooms only
    ├── index.js              # socket event wiring + timers
    ├── roomManager.js        # rooms Map, code generation, wraps shared engine
    └── railway.json          # NIXPACKS, startCommand: node index.js
```

- **Solo vs CPU:** the client imports `shared/engine` + `bot.js` and runs the whole game in the browser — no server, works as a static site.
- **Online:** the Socket.io server holds room state in an in-memory `Map` and calls the *same* engine.
- **Engine style:** pure functions that take a `game` state object and return the next state (no hidden globals) — chosen for testability under TDD.

---

## 4. Trump Card game — rules

### 4.1 Card model

```js
{
  id: Number,
  name: String,
  country: String,
  countryCode: String,        // ISO-2 → flag emoji
  position: 'GK' | 'DEF' | 'MID' | 'FWD',
  era: String,                // e.g. "2005–"
  rarity: 'legendary' | 'epic' | 'rare' | 'common',
  points: Number,             // 100 / 75 / 50 / 25 by rarity
  stats: {
    matches: Number,
    goals: Number,
    assists: Number,
    tackles: Number,
    saves: Number,
    cleanSheets: Number
  }
}
```

At runtime each dealt card also carries `usedStats: []` (burned-stat tracker).

### 4.2 Stats & position-awareness

- **All six stats are higher-is-better** (simpler than cricket — no lower-is-better case).
- Every card shows all six stats, but values are position-realistic:
  - **Outfielders (DEF/MID/FWD):** `saves` and `cleanSheets` ≈ 0 (rendered greyed/dimmed).
  - **Goalkeepers (GK):** high `saves`/`cleanSheets`, low `goals`/`assists`.
- Goalkeepers are deliberately **rarer** in the deck, so playing a keeper for "Saves"/"Clean Sheets" is a power move → the core strategy layer.
- `STAT_MAX` (for bar scaling) is defined per stat for the UI.

### 4.3 Round flow (phases)

`waiting` → `active_selecting` → `opponents_selecting` → resolve → next `active_selecting` (winner leads) → … → `ended`

1. **active_selecting:** the active player picks one of their cards + a stat to attack with.
2. **opponents_selecting:** every other in-play player picks one card to play against that stat.
3. **resolve:** highest value for the chosen stat wins all played cards (+ the neutral pile, if any). Ties send played cards to the neutral pile.
4. Winner becomes the next active player. If no winner (tie), rotate to the next player.

### 4.4 Burned-stat mechanic (kept)

When a stat is used in a round, it is appended to that card's `usedStats`. A card cannot reuse a stat already in its `usedStats` — preventing one monster stat from being spammed. Burned stats are rendered dimmed and are unselectable.

### 4.5 Rarity, scoring & win conditions

- **Hand score** = sum of `points` of cards in hand.
- **Game ends** when one player holds all cards (others eliminated as their hands empty), **or** when the overall room timer expires — in which case the highest hand score wins.
- Time options: **4 / 6 / 10 minutes** (server-authoritative countdown for online; local countdown for solo).

### 4.6 Decks

- **v1 deck: `international`** — national-team career stats.
- Deck system (`DECKS` map in `shared/engine/decks.js`, keyed by `deckType`) supports adding **`epl`** and **`laliga`** decks later with no rule changes. `deckType` is chosen at room/solo creation (default `international`).

---

## 5. Solo vs CPU

- 1 human + 1–3 bots. Bots use `shared/engine/bot.js`.
- Difficulty toggle: **easy** (near-random valid pick), **medium** (greedy: best available stat / best card for the active stat), **hard** (greedy + avoids burned stats + holds keepers for Saves/Clean Sheets). v1 ships medium as default; easy/hard are thin variants.
- Bots act with a short artificial delay for readability.
- Runs entirely client-side using the shared engine + the same `autoSelect*` helpers the server uses on timeout.

---

## 6. Online multiplayer (rooms)

Re-skin of the cricket Socket.io server, deployed on **Railway** (with an optional Render fallback URL, exactly as cricket does).

### 6.1 Rooms & codes

- `generateRoomCode()` → 6-char `A–Z0–9`, collision-checked against the in-memory `rooms` Map (loops until unique).
- Rooms are **in-memory, ephemeral** (no DB) — same trade-off as cricket (server restart clears active rooms).
- 2–6 players per room.

### 6.2 Socket.io event vocabulary (mirrors cricket)

- Client→server: `create_room`, `join_room`, `start_game`, `select_card_stat`, `select_opponent_card`, `leave_room`, `rejoin_room`.
- Server→client: `room_created`, `room_joined`, `room_updated`, `game_started`, `phase_changed`, `phase_timer_tick`, `timer_tick`, `opponent_selection_update`, `round_result`, `game_ended`, `error`.
- Server owns phase timers (active/opponent selection) and the overall room timer; auto-selects on timeout via the engine.
- Per-player hands are emitted privately (`game_started` / `game_state_update`), public state via room broadcast.

### 6.3 Join / share flow

1. Host → `create_room` → server returns a unique code via `room_created`; host socket joins the room channel.
2. Host shares link `…/?room=ABC123` (WhatsApp / clipboard — `ShareModal` pattern).
3. Friend opens link → code auto-filled → `join_room` → server broadcasts `room_updated`.
4. Host starts → engine deals hands → timers begin.

### 6.4 Client connection (`client/src/lib/socket.js`)

Copied from cricket: `VITE_SERVER_URL` (Railway) primary + fallback URL, transports `['polling','websocket']`, auto-reconnect, `safeEmit`, `rejoin_room` on reconnect.

### 6.5 Deploy config

- `server/railway.json`: `NIXPACKS` builder, `startCommand: node index.js`, restart-on-failure (max 10). `PORT` from `process.env.PORT`. `/health` endpoint. Open CORS.
- Server is ESM (`"type": "module"`) so it can import `shared/engine`.

---

## 7. Player roster data (curated)

- **~50–60 post-1990 footballers** (debuted or played after 1990), authored by Claude.
- Composition: **~8–10 goalkeepers**, remainder spread across DEF/MID/FWD; multiple nations (Argentina, Brazil, France, Germany, Italy, Spain, Portugal, England, Netherlands, Uruguay, …).
- Rarity spread (approx): ~10 legendary / ~15 epic / ~18 rare / rest common.
- Stats are **approximate international (national-team) career figures**, not official — playable day one; numbers can be corrected later.
- Stored in `shared/data/players.international.js` and imported by **both** client and server (same module — no duplication).

> **Accuracy caveat:** hand-curated stats are best-effort approximations. A later pass can replace them with verified figures or a dataset import.

---

## 8. Quiz section (Phase 2)

Both modes are **solo, scored, with streaks** and a **local best-score leaderboard** (localStorage; Supabase optional later).

### 8.1 Guess the Footballer ("bingo")

- Quiz entry: `{ answerName, blankTarget: 'surname'|'full', clues: [c1, c2, c3], difficulty }` — authored alongside the roster (reuses player identities).
- Flow: show **3 hint bullets** progressively — **hint 1 free**, hints 2 & 3 each cost points to reveal. The name appears as **blank slots** (some letters may be pre-revealed by difficulty).
- **Letter tiles:** the answer's letters + decoy letters, shuffled to ~10–12 tiles. Tap a tile to fill the next blank; tap a filled slot to clear it. Submit to check.
- **Scoring:** `base − (hints used × penalty) − (wrong attempts × penalty)`, multiplied by current streak.

### 8.2 Multiple Choice

- Question bank `{ q, options:[4], correctIndex, category, difficulty }` — **~40–60 authored** trivia questions (World Cups, records, the 2022 final, legends) **+ auto-generated stat questions** from the roster ("Who has more international goals — X or Y?").
- 10 questions per round, **per-question timer** (~10s), **speed + streak bonuses**.

### 8.3 Scoring & persistence

- A Zustand `quizStore` tracks score, streak, lives/timer.
- Best scores + longest streak persisted to **localStorage**; optional Supabase sync later.

---

## 9. Identity & persistence

- **Guest-first:** localStorage UUID + display name + avatar color — no login wall (cricket pattern).
- **Optional Supabase** auth + leaderboard later, with graceful fallback (mock/local) when keys are absent.
- Env (optional): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## 10. Theme / design system

**Pitch Classic field + Royal Navy + Gold cards.**

- **Field background:** green stripes `#1f7a33` / `#1b6e2e`, subtle white pitch-line accents.
- **Cards & surfaces:** navy gradient `#1c3566 → #10203f`; **gold** `#ffd24a` / `#e7c95a` for rarity badges, accents, the hero "Goals" stat; white text; blue-dark stat tracks `#0c1830` with stat-colored fills.
- **Rarity accents:** legendary = gold, epic = purple, rare = blue, common = slate.
- **Stat colors (indicative):** matches blue, goals gold (hero), assists green, tackles purple, saves cyan, clean sheets teal.
- **Type:** sporty display face (Rajdhani/Oswald-style) for headings + clean sans for body.
- Mobile-first, responsive. The `frontend-design` skill will be used during implementation for polish.

---

## 11. Tech stack

- **Client:** React 18, Vite, Tailwind CSS, Zustand, React Router v6, `socket.io-client`, `@supabase/supabase-js` (optional), `@vercel/analytics`.
- **Server:** Node (ESM), Express, Socket.io, `uuid`, `cors`; `nodemon` (dev).
- **Shared:** pure ESM rules engine + `bot.js`.
- **Testing:** Vitest for the engine (primary TDD target).
- **Root:** `concurrently` to run server + client in dev.

---

## 12. Deployment

- **Client → Vercel.** `vercel.json` SPA rewrite (as in Stockd/cricket). Solo + quiz work fully static.
- **Server → Railway** (Socket.io), `railway.json` as above; optional Render fallback URL in the client socket lib.
- **Env:** client `VITE_SERVER_URL` → Railway service URL; optional Supabase keys.

---

## 13. Repo & project structure

- **Fresh standalone git repo** initialized in `footbal-trumpcard/` (previously nested inside an unrelated parent repo whose `origin` is `admissions-dashboard`). A new GitHub remote will be added by the author later (default push to the author's own origin, per established preference).
- `.gitignore` covers `node_modules/`, `dist/`, `.env*`, `.superpowers/`, OS/editor cruft.

---

## 14. Build phasing / milestones

**Phase 1 — Trump Card Game**
1. Repo init, monorepo scaffold (root/client/server/shared), Tailwind + theme tokens + fonts.
2. Shared rules engine + Vitest tests (TDD): deal, select, resolve, burned-stat, win/score.
3. Curated `international` roster (~50–60 players).
4. Card component + battle UI in Pitch Classic / Royal-Navy-Gold theme.
5. **Solo vs CPU** (engine + bot) — *first playable milestone*.
6. Online rooms: server (`roomManager` + Socket.io + timers), lobby, share modal, room flow.
7. Home/menu shell, results screen, sounds/animations, polish.

**Phase 2 — Quiz**
8. Quiz shell + routing + `quizStore` (score/streak) + localStorage.
9. Guess the Footballer (bingo) + authored clue data.
10. Multiple Choice + authored question bank + auto-generated stat questions.
11. Local best-score leaderboard, polish.

**Phase 3 — Later (out of scope now)**
12. EPL & La Liga decks · online quiz challenge · Supabase accounts/global leaderboard · mobile/Expo port · verified-stats data pass.

---

## 15. Out of scope (YAGNI) for v1

- Real-data/stat API integration (curated static data instead).
- Accounts / global online leaderboard (guest + local only).
- EPL / La Liga decks (architecture-ready, not built).
- Online/multiplayer quiz (solo only).
- Native mobile app.

---

## 16. Testing strategy

- **Engine = primary test target** (pure functions → fast, deterministic Vitest unit tests; TDD).
- Cover: dealing/dedup, stat selection, round resolution (single winner / tie / neutral pile), burned-stat enforcement, hand scoring, win/elimination, timer-expiry winner, bot picks.
- Component/UI tests kept light; manual play-test the battle and quiz flows.

---

## 17. Open items

- Final roster list + exact stat values (curated during Phase 1, step 3).
- Clue text for Guess the Footballer + the MCQ question bank (authored in Phase 2).
- Stat accuracy is approximate by design; verification is a Phase 3 pass.
