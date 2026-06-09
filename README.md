# FootyTrump ⚽

FIFA World Cup 2026–themed football **trump-card game + quiz**. Inspired by the author's Cricket Trump Card game.

- **⚔️ Trump Cards** — battle footballer stats (Matches, Goals, Assists, Tackles, Saves, Clean Sheets) across a 59-player post-1990 roster. Goalkeepers are rarer, so playing one for Saves / Clean Sheets is a power move.
- **👥 Online rooms** — create/join with a 6-char code + share link, 2–6 players, 4/6/8-min clock, 30s attack + 30s defend, dynamic rounds, last-round completion.
- **🧠 Quiz** — *Guess the Footballer* (3 hints → letter-tile "bingo") and *Multiple Choice*, **solo** (streaks + local best) or **multiplayer rooms** (same lobby; owner picks the mode; speed-ranked scoring 2:10/6 … 6:10/8/6/4/2/0).

Theme: green-pitch background + Royal-Navy-Gold cards.

## Run locally
```bash
npm install                 # root tooling + engine tests
npm install --prefix client
npm install --prefix server
npm run dev:all             # server (:3001) + client (Vite) together
npm test                    # 69 tests (engine, roster, quiz, room/quiz managers)
```
Open two tabs on `/online` to test multiplayer locally.

## Structure
- `shared/engine` — pure, tested rules engine + quiz logic (single source of truth)
- `shared/data` — roster, quiz clues, MCQ bank
- `server` — Express + Socket.io (trump rooms + quiz rooms), wraps `shared`
- `client` — React + Vite + Tailwind + Zustand UI

## Deploy
Monorepo note: both the client and server import from `shared/`, so deploy with the **repo root** as the checkout.

**Server → Railway** (uses the root `railway.json`):
1. New Project → Deploy from the `FootyTrump` GitHub repo. Keep **Root Directory = repo root** (do not set it to `server`).
2. Railway runs `npm install --prefix server` (build) and `node server/index.js` (start); `PORT` is injected automatically.
3. Copy the public service URL (e.g. `https://footytrump-production.up.railway.app`).

**Client → Vercel** (uses `client/vercel.json` SPA rewrite):
1. Import the repo → set **Root Directory = `client`** (framework auto-detects Vite).
2. Add env var **`VITE_SERVER_URL`** = your Railway URL.
3. Deploy.

## Milestones
- ✅ `v0.1.0-solo` — engine + solo vs CPU
- ✅ `v0.2.0-online` — online trump rooms (Railway/Socket.io)
- ✅ `v0.3.0-quiz` — solo quiz (Guess + MCQ)
- ✅ `v0.4.0-quiz-online` — multiplayer quiz rooms

Design + plans: [`docs/superpowers/`](docs/superpowers/).
