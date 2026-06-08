# FootyTrump — Plan A: Core Engine + Solo vs CPU

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable, single-player FootyTrump trump-card game (human vs CPU) on a fully tested shared rules engine, themed green-pitch + Royal-Navy-Gold.

**Architecture:** A pure ESM rules engine in `shared/engine/` (TDD with Vitest) is the single source of truth for all game logic. The React client (Vite + Tailwind + Zustand) imports the engine + a bot module to run a complete game in the browser — no server. This same engine is later wrapped by a Socket.io server (Plan B) for online play.

**Tech Stack:** Node ESM, Vitest, React 18, Vite, Tailwind CSS, Zustand, React Router v6.

**Scope of this plan:** engine, curated roster data, card UI, solo-vs-CPU game, home/menu shell, results screen. **Out of scope (later plans):** online rooms/server (Plan B), quiz (Plan C). Spec: `docs/superpowers/specs/2026-06-08-footytrump-design.md`.

## Conventions

- All `shared/` and `server/` code is **ESM** (`import`/`export`, `.js`). `package.json` files set `"type": "module"`.
- Tests use **Vitest**, colocated as `*.test.js` next to the module.
- Commit after every task with a `feat:`/`test:`/`chore:` message.
- Run commands from the repo root `c:/Users/test/OneDrive/Desktop/footbal-trumpcard` unless noted.

## File structure (created across this plan)

```
package.json                 # root: workspaces-free; scripts: dev, test; devDep vitest, concurrently
vitest.config.js             # root vitest config (tests in shared/)
shared/
  engine/
    constants.js             # STATS, STAT_LABELS, STAT_MAX, RARITY_POINTS
    random.js                # makeRng(seed), shuffle(arr, rng)
    cards.js                 # freshCard, cardPoints, calcHandScore
    game.js                  # cardsPerPlayer, dealHands, createGame, selectCardAndStat, selectOpponentCard, resolveRound, endByTimer
    bot.js                   # botPickActive, botPickOpponent
    decks.js                 # DECKS map, getDeck
    *.test.js                # Vitest unit tests
  data/
    players.international.js  # curated roster (~54 players)
    players.international.test.js
client/
  index.html
  package.json               # vite app
  vite.config.js
  tailwind.config.js
  postcss.config.js
  src/
    main.jsx
    App.jsx                  # router
    index.css                # tailwind + fonts + theme base
    lib/identity.js          # guest UUID + name in localStorage
    data/                    # (re-export of shared deck for the client if needed)
    store/soloStore.js       # Zustand: orchestrates a solo game
    components/
      ui/Button.jsx
      ui/Modal.jsx
      game/PlayerCard.jsx    # the trump card
      game/CardBack.jsx
      game/StatBar.jsx
      game/OpponentStrip.jsx
      game/RoundResultOverlay.jsx
      game/GameTimer.jsx
    pages/
      Home.jsx
      SoloSetup.jsx          # choose bots/difficulty
      SoloGame.jsx           # the battle screen (playable milestone)
      Results.jsx
```

---

### Task 1: Root scaffold (workspace, scripts, Vitest)

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "footytrump",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "client": "npm --prefix client run dev",
    "dev": "npm run client"
  },
  "devDependencies": {
    "concurrently": "^9.1.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['shared/**/*.test.js'],
    environment: 'node',
  },
})
```

- [ ] **Step 3: Install**

Run: `npm install`
Expected: creates `node_modules/`, `package-lock.json`, no errors.

- [ ] **Step 4: Verify Vitest runs (no tests yet)**

Run: `npm test`
Expected: Vitest reports "No test files found" (exit non-zero is OK at this point) — confirms Vitest is installed.

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.js package-lock.json
git commit -m "chore: root scaffold with vitest"
```

---

### Task 2: Engine constants

**Files:**
- Create: `shared/engine/constants.js`
- Test: `shared/engine/constants.test.js`

- [ ] **Step 1: Write the failing test**

```js
// shared/engine/constants.test.js
import { describe, it, expect } from 'vitest'
import { STATS, STAT_LABELS, STAT_MAX, RARITY_POINTS } from './constants.js'

describe('constants', () => {
  it('defines the six football stats in order', () => {
    expect(STATS).toEqual(['matches', 'goals', 'assists', 'tackles', 'saves', 'cleanSheets'])
  })
  it('has a label and a max for every stat', () => {
    for (const s of STATS) {
      expect(STAT_LABELS[s]).toBeTypeOf('string')
      expect(STAT_MAX[s]).toBeGreaterThan(0)
    }
  })
  it('maps every rarity to points', () => {
    expect(RARITY_POINTS).toEqual({ legendary: 100, epic: 75, rare: 50, common: 25 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/engine/constants.test.js`
Expected: FAIL — cannot resolve `./constants.js`.

- [ ] **Step 3: Write the implementation**

```js
// shared/engine/constants.js
export const STATS = ['matches', 'goals', 'assists', 'tackles', 'saves', 'cleanSheets']

export const STAT_LABELS = {
  matches: 'MATCHES',
  goals: 'GOALS',
  assists: 'ASSISTS',
  tackles: 'TACKLES',
  saves: 'SAVES',
  cleanSheets: 'CLEAN SHEETS',
}

// Upper bounds used only for scaling the UI stat bars (0–100%).
export const STAT_MAX = {
  matches: 200,
  goals: 130,
  assists: 70,
  tackles: 250,
  saves: 350,
  cleanSheets: 90,
}

export const RARITY_POINTS = { legendary: 100, epic: 75, rare: 50, common: 25 }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/engine/constants.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/engine/constants.js shared/engine/constants.test.js
git commit -m "feat(engine): stat + rarity constants"
```

---

### Task 3: Seedable RNG + shuffle

**Files:**
- Create: `shared/engine/random.js`
- Test: `shared/engine/random.test.js`

- [ ] **Step 1: Write the failing test**

```js
// shared/engine/random.test.js
import { describe, it, expect } from 'vitest'
import { makeRng, shuffle } from './random.js'

describe('random', () => {
  it('makeRng is deterministic for a given seed', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    const seqA = [a(), a(), a()]
    const seqB = [b(), b(), b()]
    expect(seqA).toEqual(seqB)
    for (const n of seqA) { expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThan(1) }
  })
  it('shuffle returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5]
    const out = shuffle(input, makeRng(7))
    expect(out).toHaveLength(5)
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
    expect(input).toEqual([1, 2, 3, 4, 5]) // unchanged
  })
  it('shuffle with the same seed is reproducible', () => {
    expect(shuffle([1,2,3,4,5], makeRng(7))).toEqual(shuffle([1,2,3,4,5], makeRng(7)))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/engine/random.test.js`
Expected: FAIL — cannot resolve `./random.js`.

- [ ] **Step 3: Write the implementation**

```js
// shared/engine/random.js
// Mulberry32: a tiny, fast, seedable PRNG so games/tests are reproducible.
export function makeRng(seed = 1) {
  let a = seed >>> 0
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle(array, rng = Math.random) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/engine/random.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/engine/random.js shared/engine/random.test.js
git commit -m "feat(engine): seedable rng + shuffle"
```

---

### Task 4: Card helpers (freshCard, points, hand score)

**Files:**
- Create: `shared/engine/cards.js`
- Test: `shared/engine/cards.test.js`

- [ ] **Step 1: Write the failing test**

```js
// shared/engine/cards.test.js
import { describe, it, expect } from 'vitest'
import { freshCard, cardPoints, calcHandScore } from './cards.js'

const card = (over = {}) => ({ id: 1, rarity: 'epic', points: 75, stats: {}, ...over })

describe('cards', () => {
  it('freshCard adds an empty usedStats and does not mutate the source', () => {
    const c = card()
    const f = freshCard(c)
    expect(f.usedStats).toEqual([])
    expect(c.usedStats).toBeUndefined()
  })
  it('cardPoints uses the card points, falling back to rarity', () => {
    expect(cardPoints(card({ points: 75 }))).toBe(75)
    expect(cardPoints(card({ points: undefined, rarity: 'legendary' }))).toBe(100)
    expect(cardPoints(card({ points: undefined, rarity: 'unknown' }))).toBe(25)
  })
  it('calcHandScore sums points across a hand', () => {
    expect(calcHandScore([card({ points: 100 }), card({ points: 50 })])).toBe(150)
    expect(calcHandScore([])).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/engine/cards.test.js`
Expected: FAIL — cannot resolve `./cards.js`.

- [ ] **Step 3: Write the implementation**

```js
// shared/engine/cards.js
import { RARITY_POINTS } from './constants.js'

export function freshCard(card) {
  return { ...card, usedStats: [] }
}

export function cardPoints(card) {
  return card.points ?? RARITY_POINTS[card.rarity] ?? 25
}

export function calcHandScore(hand) {
  return hand.reduce((sum, c) => sum + cardPoints(c), 0)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/engine/cards.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/engine/cards.js shared/engine/cards.test.js
git commit -m "feat(engine): card point + hand-score helpers"
```

---

### Task 5: Dealing hands

**Files:**
- Create: `shared/engine/game.js`
- Test: `shared/engine/deal.test.js`

- [ ] **Step 1: Write the failing test**

```js
// shared/engine/deal.test.js
import { describe, it, expect } from 'vitest'
import { cardsPerPlayer, dealHands } from './game.js'
import { makeRng } from './random.js'

// minimal fake deck of N cards
const deck = (n) => Array.from({ length: n }, (_, i) => ({
  id: i + 1, name: `P${i + 1}`, rarity: 'common', points: 25,
  stats: { matches: i, goals: i, assists: i, tackles: i, saves: i, cleanSheets: i },
}))

describe('dealHands', () => {
  it('cardsPerPlayer: 24 for 2 players, 14 for >2, capped by deck size', () => {
    expect(cardsPerPlayer(54, 2)).toBe(24)
    expect(cardsPerPlayer(54, 3)).toBe(14)
    expect(cardsPerPlayer(54, 6)).toBe(9) // floor(54/6)=9 < 14
  })
  it('deals equal hands and puts the remainder in the neutral pile', () => {
    const { hands, neutralPile } = dealHands(deck(54), 2, makeRng(1))
    expect(hands).toHaveLength(2)
    expect(hands[0]).toHaveLength(24)
    expect(hands[1]).toHaveLength(24)
    expect(neutralPile).toHaveLength(54 - 48)
  })
  it('every dealt card is fresh (usedStats: [])', () => {
    const { hands } = dealHands(deck(54), 3, makeRng(1))
    expect(hands[0][0].usedStats).toEqual([])
  })
  it('no card id appears in two hands', () => {
    const { hands } = dealHands(deck(54), 3, makeRng(2))
    const ids = hands.flat().map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/engine/deal.test.js`
Expected: FAIL — `game.js` has no exports yet.

- [ ] **Step 3: Write the implementation (start `game.js`)**

```js
// shared/engine/game.js
import { STATS } from './constants.js'
import { shuffle } from './random.js'
import { freshCard, calcHandScore } from './cards.js'

const clone = (game) => structuredClone(game)

export function cardsPerPlayer(deckSize, playerCount) {
  const target = playerCount <= 2 ? 24 : 14
  return Math.max(4, Math.min(target, Math.floor(deckSize / playerCount)))
}

export function dealHands(deck, playerCount, rng = Math.random) {
  const seen = new Set()
  const unique = shuffle(deck, rng).filter(c => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
  const per = cardsPerPlayer(unique.length, playerCount)
  const hands = []
  for (let i = 0; i < playerCount; i++) {
    hands.push(unique.slice(i * per, (i + 1) * per).map(freshCard))
  }
  const neutralPile = unique.slice(playerCount * per).map(freshCard)
  return { hands, neutralPile, per }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/engine/deal.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/engine/game.js shared/engine/deal.test.js
git commit -m "feat(engine): deal hands with neutral pile"
```

---

### Task 6: Create game

**Files:**
- Modify: `shared/engine/game.js`
- Test: `shared/engine/createGame.test.js`

- [ ] **Step 1: Write the failing test**

```js
// shared/engine/createGame.test.js
import { describe, it, expect } from 'vitest'
import { createGame } from './game.js'
import { makeRng } from './random.js'

const deck = (n) => Array.from({ length: n }, (_, i) => ({
  id: i + 1, name: `P${i + 1}`, rarity: 'common', points: 25,
  stats: { matches: i, goals: i, assists: i, tackles: i, saves: i, cleanSheets: i },
}))

describe('createGame', () => {
  it('initialises players, hands, scores and phase', () => {
    const g = createGame({
      players: [{ id: 'a', name: 'Ana' }, { id: 'b', name: 'Ben' }],
      deck: deck(54), rng: makeRng(1),
    })
    expect(g.phase).toBe('active_selecting')
    expect(g.players).toHaveLength(2)
    expect(g.players[0].hand.length).toBeGreaterThan(0)
    expect(g.players[0].score).toBe(g.players[0].hand.length * 25)
    expect(g.activePlayerIndex).toBe(0)
    expect(g.currentRound).toBe(0)
    expect(g.winnerId).toBeNull()
    expect(g.deckType).toBe('international')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/engine/createGame.test.js`
Expected: FAIL — `createGame` not exported.

- [ ] **Step 3: Add `createGame` to `game.js`**

```js
// shared/engine/game.js  (append)
export function createGame({ players, deck, deckType = 'international', rng = Math.random }) {
  const { hands, neutralPile } = dealHands(deck, players.length, rng)
  const gamePlayers = players.map((p, i) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar ?? null,
    isBot: !!p.isBot,
    hand: hands[i],
    score: calcHandScore(hands[i]),
    isActive: true,
  }))
  return {
    players: gamePlayers,
    deckType,
    phase: 'active_selecting',
    currentRound: 0,
    activePlayerIndex: 0,
    activeCardId: null,
    activeStat: null,
    opponentSelections: {},
    neutralPile,
    winnerId: null,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/engine/createGame.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/engine/game.js shared/engine/createGame.test.js
git commit -m "feat(engine): create game state"
```

---

### Task 7: Active player selects card + stat (with burned-stat & turn rules)

**Files:**
- Modify: `shared/engine/game.js`
- Test: `shared/engine/selectActive.test.js`

- [ ] **Step 1: Write the failing test**

```js
// shared/engine/selectActive.test.js
import { describe, it, expect } from 'vitest'
import { selectCardAndStat } from './game.js'

function baseGame() {
  return {
    players: [
      { id: 'a', name: 'A', isActive: true, hand: [
        { id: 1, stats: { goals: 10 }, usedStats: [] },
        { id: 2, stats: { goals: 5 }, usedStats: ['goals'] },
      ] },
      { id: 'b', name: 'B', isActive: true, hand: [{ id: 9, stats: { goals: 3 }, usedStats: [] }] },
    ],
    phase: 'active_selecting', activePlayerIndex: 0,
    activeCardId: null, activeStat: null, opponentSelections: {}, neutralPile: [],
  }
}

describe('selectCardAndStat', () => {
  it('moves to opponents_selecting on a valid pick', () => {
    const { game, error } = selectCardAndStat(baseGame(), 'a', 1, 'goals')
    expect(error).toBeUndefined()
    expect(game.phase).toBe('opponents_selecting')
    expect(game.activeCardId).toBe(1)
    expect(game.activeStat).toBe('goals')
  })
  it('rejects when it is not the player\'s turn', () => {
    expect(selectCardAndStat(baseGame(), 'b', 9, 'goals').error).toMatch(/turn/i)
  })
  it('rejects an unknown stat', () => {
    expect(selectCardAndStat(baseGame(), 'a', 1, 'nope').error).toMatch(/stat/i)
  })
  it('rejects a stat already burned on that card', () => {
    expect(selectCardAndStat(baseGame(), 'a', 2, 'goals').error).toMatch(/used/i)
  })
  it('does not mutate the input game', () => {
    const g = baseGame()
    selectCardAndStat(g, 'a', 1, 'goals')
    expect(g.phase).toBe('active_selecting')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/engine/selectActive.test.js`
Expected: FAIL — `selectCardAndStat` not exported.

- [ ] **Step 3: Add `selectCardAndStat` to `game.js`**

```js
// shared/engine/game.js  (append)
export function selectCardAndStat(game, playerId, cardId, stat) {
  if (game.phase !== 'active_selecting') return { error: 'Not in card-selection phase' }
  const active = game.players[game.activePlayerIndex]
  if (!active || active.id !== playerId) return { error: 'Not your turn' }
  if (!STATS.includes(stat)) return { error: 'Invalid stat' }
  const card = active.hand.find(c => c.id === cardId)
  if (!card) return { error: 'Card not in your hand' }
  if (card.usedStats?.includes(stat)) return { error: `${stat} already used on this card` }

  const next = clone(game)
  next.activeCardId = cardId
  next.activeStat = stat
  next.opponentSelections = {}
  next.phase = 'opponents_selecting'
  return { game: next }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/engine/selectActive.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/engine/game.js shared/engine/selectActive.test.js
git commit -m "feat(engine): active card+stat selection with burned-stat rule"
```

---

### Task 8: Opponents select cards

**Files:**
- Modify: `shared/engine/game.js`
- Test: `shared/engine/selectOpponent.test.js`

- [ ] **Step 1: Write the failing test**

```js
// shared/engine/selectOpponent.test.js
import { describe, it, expect } from 'vitest'
import { selectOpponentCard } from './game.js'

function game() {
  return {
    players: [
      { id: 'a', isActive: true, hand: [{ id: 1, stats: { goals: 10 }, usedStats: [] }] },
      { id: 'b', isActive: true, hand: [{ id: 2, stats: { goals: 4 }, usedStats: [] }] },
      { id: 'c', isActive: true, hand: [{ id: 3, stats: { goals: 7 }, usedStats: [] }] },
    ],
    phase: 'opponents_selecting', activePlayerIndex: 0,
    activeCardId: 1, activeStat: 'goals', opponentSelections: {}, neutralPile: [],
  }
}

describe('selectOpponentCard', () => {
  it('records a selection and reports allSelected=false until everyone picks', () => {
    const r1 = selectOpponentCard(game(), 'b', 2)
    expect(r1.error).toBeUndefined()
    expect(r1.allSelected).toBe(false)
    expect(r1.game.opponentSelections.b).toEqual({ cardId: 2 })
  })
  it('reports allSelected=true once all opponents have chosen', () => {
    let g = game()
    g = selectOpponentCard(g, 'b', 2).game
    const r = selectOpponentCard(g, 'c', 3)
    expect(r.allSelected).toBe(true)
  })
  it('blocks the active player from selecting', () => {
    expect(selectOpponentCard(game(), 'a', 1).error).toMatch(/active/i)
  })
  it('blocks double selection', () => {
    let g = selectOpponentCard(game(), 'b', 2).game
    expect(selectOpponentCard(g, 'b', 2).error).toMatch(/already/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/engine/selectOpponent.test.js`
Expected: FAIL — `selectOpponentCard` not exported.

- [ ] **Step 3: Add `selectOpponentCard` to `game.js`**

```js
// shared/engine/game.js  (append)
export function selectOpponentCard(game, playerId, cardId) {
  if (game.phase !== 'opponents_selecting') return { error: 'Not in opponent-selection phase' }
  const active = game.players[game.activePlayerIndex]
  if (active.id === playerId) return { error: 'Active player cannot select an opponent card' }
  const player = game.players.find(p => p.id === playerId && p.isActive && p.hand.length > 0)
  if (!player) return { error: 'Player not in play' }
  if (game.opponentSelections[playerId]) return { error: 'Already selected this round' }
  const card = player.hand.find(c => c.id === cardId)
  if (!card) return { error: 'Card not in your hand' }

  const next = clone(game)
  next.opponentSelections[playerId] = { cardId }
  const opponents = next.players.filter(p => p.isActive && p.hand.length > 0 && p.id !== active.id)
  const allSelected = opponents.every(p => next.opponentSelections[p.id])
  return { game: next, allSelected }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/engine/selectOpponent.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/engine/game.js shared/engine/selectOpponent.test.js
git commit -m "feat(engine): opponent card selection"
```

---

### Task 9: Resolve round — single winner

**Files:**
- Modify: `shared/engine/game.js`
- Test: `shared/engine/resolveWinner.test.js`

- [ ] **Step 1: Write the failing test**

```js
// shared/engine/resolveWinner.test.js
import { describe, it, expect } from 'vitest'
import { resolveRound } from './game.js'

function game() {
  return {
    players: [
      { id: 'a', isActive: true, score: 0, hand: [{ id: 1, points: 100, stats: { goals: 10 }, usedStats: [] }] },
      { id: 'b', isActive: true, score: 0, hand: [{ id: 2, points: 25, stats: { goals: 4 }, usedStats: [] }] },
    ],
    phase: 'opponents_selecting', activePlayerIndex: 0,
    activeCardId: 1, activeStat: 'goals',
    opponentSelections: { b: { cardId: 2 } }, neutralPile: [], currentRound: 0,
  }
}

describe('resolveRound — single winner', () => {
  it('awards both played cards to the higher stat value', () => {
    const { game: g, roundResult, gameEnded } = resolveRound(game())
    const a = g.players.find(p => p.id === 'a')
    const b = g.players.find(p => p.id === 'b')
    expect(roundResult.winnerId).toBe('a')
    expect(roundResult.isTie).toBe(false)
    expect(a.hand.map(c => c.id).sort()).toEqual([1, 2])
    expect(b.hand).toHaveLength(0)
    expect(gameEnded).toBe(true) // b is out of cards
  })
  it('burns the contested stat on the won cards', () => {
    const { game: g } = resolveRound(game())
    const a = g.players.find(p => p.id === 'a')
    expect(a.hand.every(c => c.usedStats.includes('goals'))).toBe(true)
  })
  it('hands the neutral pile to the winner (reset fresh)', () => {
    const g0 = game()
    g0.neutralPile = [{ id: 99, points: 50, stats: { goals: 0 }, usedStats: ['goals'] }]
    const { game: g } = resolveRound(g0)
    const a = g.players.find(p => p.id === 'a')
    const neutral = a.hand.find(c => c.id === 99)
    expect(neutral).toBeTruthy()
    expect(neutral.usedStats).toEqual([]) // freshCard reset
    expect(g.neutralPile).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/engine/resolveWinner.test.js`
Expected: FAIL — `resolveRound` not exported.

- [ ] **Step 3: Add `resolveRound` + private helpers to `game.js`**

```js
// shared/engine/game.js  (append)
function topByScore(players) {
  let best = null, max = -1
  for (const p of players) if (p.score > max) { max = p.score; best = p.id }
  return best
}

function nextActiveIndex(game) {
  let idx = (game.activePlayerIndex + 1) % game.players.length
  let attempts = 0
  while ((!game.players[idx].isActive || game.players[idx].hand.length === 0) && attempts < game.players.length) {
    idx = (idx + 1) % game.players.length
    attempts++
  }
  return idx
}

export function resolveRound(game) {
  const next = clone(game)
  const active = next.players[next.activePlayerIndex]
  const stat = next.activeStat
  const activeCard = active.hand.find(c => c.id === next.activeCardId)
  if (!activeCard || !stat) return { error: 'No active card/stat' }

  const played = {} // pid -> { card, value }
  played[active.id] = { card: activeCard, value: activeCard.stats[stat] ?? 0 }
  for (const [pid, sel] of Object.entries(next.opponentSelections)) {
    const p = next.players.find(x => x.id === pid)
    const card = p?.hand.find(c => c.id === sel.cardId)
    if (card) played[pid] = { card, value: card.stats[stat] ?? 0 }
  }

  // remove played cards from their owners' hands
  for (const [pid, { card }] of Object.entries(played)) {
    const p = next.players.find(x => x.id === pid)
    p.hand = p.hand.filter(c => c.id !== card.id)
  }

  const target = Math.max(...Object.values(played).map(x => x.value))
  const winners = Object.entries(played).filter(([, x]) => x.value === target).map(([pid]) => pid)
  const playedCards = Object.values(played).map(x => x.card)
  const burn = (c) => ({ ...c, usedStats: c.usedStats?.includes(stat) ? c.usedStats : [...(c.usedStats || []), stat] })

  let winnerId = null
  if (winners.length === 1) {
    winnerId = winners[0]
    const winner = next.players.find(p => p.id === winnerId)
    winner.hand.push(...playedCards.map(burn))
    if (next.neutralPile.length) {
      winner.hand.push(...next.neutralPile.map(freshCard))
      next.neutralPile = []
    }
  } else {
    next.neutralPile.push(...playedCards.map(burn))
  }

  for (const p of next.players) {
    p.score = calcHandScore(p.hand)
    if (p.hand.length === 0) p.isActive = false
  }

  next.currentRound += 1
  const stillIn = next.players.filter(p => p.isActive && p.hand.length > 0)

  let gameEnded = false
  if (stillIn.length <= 1) {
    gameEnded = true
    next.phase = 'ended'
    next.winnerId = stillIn[0]?.id ?? topByScore(next.players)
  } else {
    next.activePlayerIndex = winnerId
      ? next.players.findIndex(p => p.id === winnerId)
      : nextActiveIndex(next)
    next.phase = 'active_selecting'
  }
  next.activeCardId = null
  next.activeStat = null
  next.opponentSelections = {}

  return {
    game: next,
    roundResult: {
      stat,
      winnerId,
      isTie: winners.length > 1,
      cards: Object.fromEntries(Object.entries(played).map(([pid, x]) => [pid, { card: x.card, value: x.value }])),
      currentRound: next.currentRound,
    },
    gameEnded,
    winnerId: next.winnerId,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/engine/resolveWinner.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/engine/game.js shared/engine/resolveWinner.test.js
git commit -m "feat(engine): resolve round (single winner, burn, neutral pile)"
```

---

### Task 10: Resolve round — tie, rotation, and timer end

**Files:**
- Modify: `shared/engine/game.js` (add `endByTimer`)
- Test: `shared/engine/resolveTie.test.js`

- [ ] **Step 1: Write the failing test**

```js
// shared/engine/resolveTie.test.js
import { describe, it, expect } from 'vitest'
import { resolveRound, endByTimer } from './game.js'

function threeWayGame() {
  return {
    players: [
      { id: 'a', isActive: true, score: 0, hand: [{ id: 1, points: 50, stats: { goals: 8 }, usedStats: [] }, { id: 4, points: 50, stats: { goals: 1 }, usedStats: [] }] },
      { id: 'b', isActive: true, score: 0, hand: [{ id: 2, points: 25, stats: { goals: 8 }, usedStats: [] }, { id: 5, points: 25, stats: { goals: 1 }, usedStats: [] }] },
      { id: 'c', isActive: true, score: 0, hand: [{ id: 3, points: 25, stats: { goals: 3 }, usedStats: [] }, { id: 6, points: 25, stats: { goals: 1 }, usedStats: [] }] },
    ],
    phase: 'opponents_selecting', activePlayerIndex: 0,
    activeCardId: 1, activeStat: 'goals',
    opponentSelections: { b: { cardId: 2 }, c: { cardId: 3 } }, neutralPile: [], currentRound: 0,
  }
}

describe('resolveRound — tie', () => {
  it('sends played cards to the neutral pile and rotates to the next player', () => {
    const { game: g, roundResult, gameEnded } = resolveRound(threeWayGame())
    expect(roundResult.isTie).toBe(true)
    expect(roundResult.winnerId).toBeNull()
    expect(g.neutralPile.map(c => c.id).sort()).toEqual([1, 2, 3])
    expect(g.neutralPile.every(c => c.usedStats.includes('goals'))).toBe(true)
    expect(gameEnded).toBe(false)
    expect(g.activePlayerIndex).toBe(1) // rotated from a -> b
  })
})

describe('endByTimer', () => {
  it('ends the game and picks the highest hand score', () => {
    const g = {
      players: [
        { id: 'a', score: 300, hand: [], isActive: true },
        { id: 'b', score: 500, hand: [], isActive: true },
      ],
      phase: 'active_selecting',
    }
    const { game: ended, winnerId } = endByTimer(g)
    expect(ended.phase).toBe('ended')
    expect(winnerId).toBe('b')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/engine/resolveTie.test.js`
Expected: FAIL — `endByTimer` not exported (and tie expectations unmet if logic differs).

- [ ] **Step 3: Add `endByTimer` to `game.js`**

```js
// shared/engine/game.js  (append)
export function endByTimer(game) {
  const next = clone(game)
  next.phase = 'ended'
  next.winnerId = topByScore(next.players)
  return { game: next, winnerId: next.winnerId }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/engine/resolveTie.test.js`
Expected: PASS (2 tests). Then run the full engine suite: `npm test` → all green.

- [ ] **Step 5: Commit**

```bash
git add shared/engine/game.js shared/engine/resolveTie.test.js
git commit -m "feat(engine): tie handling, rotation, timer-expiry winner"
```

---

### Task 11: Bot strategy

**Files:**
- Create: `shared/engine/bot.js`
- Test: `shared/engine/bot.test.js`

- [ ] **Step 1: Write the failing test**

```js
// shared/engine/bot.test.js
import { describe, it, expect } from 'vitest'
import { botPickActive, botPickOpponent } from './bot.js'
import { makeRng } from './random.js'

function game() {
  return {
    activePlayerIndex: 0,
    players: [
      { id: 'bot', isActive: true, hand: [
        { id: 1, stats: { matches: 100, goals: 5, assists: 2, tackles: 1, saves: 0, cleanSheets: 0 }, usedStats: [] },
        { id: 2, stats: { matches: 50, goals: 40, assists: 2, tackles: 1, saves: 0, cleanSheets: 0 }, usedStats: [] },
      ] },
      { id: 'human', isActive: true, hand: [
        { id: 9, stats: { goals: 12 }, usedStats: [] },
        { id: 10, stats: { goals: 30 }, usedStats: [] },
      ] },
    ],
  }
}

describe('bot', () => {
  it('medium picks the highest available stat value across its hand', () => {
    // matches 100 (card1) is the biggest raw value -> bot attacks with matches/card1
    const pick = botPickActive(game(), 'bot', 'medium')
    expect(pick).toEqual({ cardId: 1, stat: 'matches' })
  })
  it('skips burned stats when picking active', () => {
    const g = game()
    g.players[0].hand[0].usedStats = ['matches'] // burn the big one
    const pick = botPickActive(g, 'bot', 'medium')
    expect(pick).toEqual({ cardId: 2, stat: 'goals' }) // next best value 40
  })
  it('opponent picks its best card for the contested stat', () => {
    expect(botPickOpponent(game(), 'human', 'goals')).toEqual({ cardId: 10 })
  })
  it('easy returns a valid (cardId, stat) pair', () => {
    const pick = botPickActive(game(), 'bot', 'easy', makeRng(3))
    expect([1, 2]).toContain(pick.cardId)
    expect(Object.keys(pick)).toContain('stat')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/engine/bot.test.js`
Expected: FAIL — `bot.js` missing.

- [ ] **Step 3: Write `bot.js`**

```js
// shared/engine/bot.js
import { STATS } from './constants.js'

function validCombos(player) {
  const out = []
  for (const card of player.hand) {
    for (const stat of STATS) {
      if (card.usedStats?.includes(stat)) continue
      out.push({ cardId: card.id, stat, value: card.stats[stat] ?? 0 })
    }
  }
  return out
}

export function botPickActive(game, playerId, difficulty = 'medium', rng = Math.random) {
  const player = game.players.find(p => p.id === playerId)
  const combos = validCombos(player)
  if (combos.length === 0) {
    const card = player.hand[0]
    return { cardId: card.id, stat: STATS[0] }
  }
  if (difficulty === 'easy') {
    const pick = combos[Math.floor(rng() * combos.length)]
    return { cardId: pick.cardId, stat: pick.stat }
  }
  // medium / hard: greedy max raw value
  const best = combos.reduce((a, b) => (b.value > a.value ? b : a))
  return { cardId: best.cardId, stat: best.stat }
}

export function botPickOpponent(game, playerId, stat) {
  const player = game.players.find(p => p.id === playerId)
  let best = null
  for (const card of player.hand) {
    const value = card.stats[stat] ?? 0
    if (!best || value > best.value) best = { cardId: card.id, value }
  }
  return { cardId: best.cardId }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/engine/bot.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/engine/bot.js shared/engine/bot.test.js
git commit -m "feat(engine): bot pick strategy"
```

---

### Task 12: Decks registry + curated roster data

**Files:**
- Create: `shared/data/players.international.js`
- Create: `shared/engine/decks.js`
- Test: `shared/data/players.international.test.js`

- [ ] **Step 1: Write the failing validation test (defines "done" for the roster)**

```js
// shared/data/players.international.test.js
import { describe, it, expect } from 'vitest'
import { playersInternational } from './players.international.js'
import { STATS } from '../engine/constants.js'

const RARITIES = ['legendary', 'epic', 'rare', 'common']
const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

describe('international roster', () => {
  it('has at least 50 players', () => {
    expect(playersInternational.length).toBeGreaterThanOrEqual(50)
  })
  it('has unique numeric ids', () => {
    const ids = playersInternational.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every(id => Number.isInteger(id))).toBe(true)
  })
  it('every player has the required fields and all six stats', () => {
    for (const p of playersInternational) {
      expect(p.name).toBeTypeOf('string')
      expect(p.country).toBeTypeOf('string')
      expect(p.countryCode).toMatch(/^[A-Z]{2}$/)
      expect(POSITIONS).toContain(p.position)
      expect(RARITIES).toContain(p.rarity)
      for (const s of STATS) expect(p.stats[s]).toBeTypeOf('number')
    }
  })
  it('includes at least 8 goalkeepers', () => {
    expect(playersInternational.filter(p => p.position === 'GK').length).toBeGreaterThanOrEqual(8)
  })
  it('goalkeepers have meaningful saves; outfielders have ~0 saves', () => {
    for (const p of playersInternational) {
      if (p.position === 'GK') expect(p.stats.saves).toBeGreaterThan(50)
      else expect(p.stats.saves).toBeLessThanOrEqual(5)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/data/players.international.test.js`
Expected: FAIL — file missing / fewer than 50 players.

- [ ] **Step 3: Create the roster, seeded with this pattern, then extend to ≥50**

Create `shared/data/players.international.js`. The shape and ~16 seed entries below are the canonical pattern — **continue adding players from the checklist comment until the test passes (≥50 total, ≥8 GK)**, using best-effort approximate international (national-team) career stats. Outfielders: `saves: 0, cleanSheets: 0`. Goalkeepers: low goals/assists/tackles, high saves/cleanSheets.

```js
// shared/data/players.international.js
// Approximate international (national-team) career stats for post-1990 footballers.
// Stats are best-effort approximations, not official figures — correctable later.
export const playersInternational = [
  // ── Forwards ─────────────────────────────────────────────
  { id: 1,  name: 'Lionel Messi',     country: 'Argentina', countryCode: 'AR', position: 'FWD', era: '2005–', rarity: 'legendary', points: 100, stats: { matches: 187, goals: 112, assists: 58, tackles: 22, saves: 0, cleanSheets: 0 } },
  { id: 2,  name: 'Cristiano Ronaldo', country: 'Portugal', countryCode: 'PT', position: 'FWD', era: '2003–', rarity: 'legendary', points: 100, stats: { matches: 217, goals: 135, assists: 45, tackles: 18, saves: 0, cleanSheets: 0 } },
  { id: 3,  name: 'Ronaldo Nazário',  country: 'Brazil',    countryCode: 'BR', position: 'FWD', era: '1994–2011', rarity: 'legendary', points: 100, stats: { matches: 98,  goals: 62, assists: 22, tackles: 8,  saves: 0, cleanSheets: 0 } },
  { id: 4,  name: 'Thierry Henry',    country: 'France',    countryCode: 'FR', position: 'FWD', era: '1997–2010', rarity: 'epic', points: 75, stats: { matches: 123, goals: 51, assists: 30, tackles: 18, saves: 0, cleanSheets: 0 } },
  { id: 5,  name: 'Kylian Mbappé',    country: 'France',    countryCode: 'FR', position: 'FWD', era: '2017–', rarity: 'epic', points: 75, stats: { matches: 89, goals: 50, assists: 30, tackles: 12, saves: 0, cleanSheets: 0 } },
  { id: 6,  name: 'Diego Maradona',   country: 'Argentina', countryCode: 'AR', position: 'FWD', era: '1977–1994', rarity: 'legendary', points: 100, stats: { matches: 91, goals: 34, assists: 30, tackles: 25, saves: 0, cleanSheets: 0 } },

  // ── Midfielders ──────────────────────────────────────────
  { id: 7,  name: 'Zinedine Zidane',  country: 'France',    countryCode: 'FR', position: 'MID', era: '1994–2006', rarity: 'legendary', points: 100, stats: { matches: 108, goals: 31, assists: 35, tackles: 60, saves: 0, cleanSheets: 0 } },
  { id: 8,  name: 'Ronaldinho',       country: 'Brazil',    countryCode: 'BR', position: 'MID', era: '1999–2013', rarity: 'epic', points: 75, stats: { matches: 97, goals: 33, assists: 35, tackles: 30, saves: 0, cleanSheets: 0 } },
  { id: 9,  name: 'Andrea Pirlo',     country: 'Italy',     countryCode: 'IT', position: 'MID', era: '2002–2015', rarity: 'epic', points: 75, stats: { matches: 116, goals: 13, assists: 30, tackles: 90, saves: 0, cleanSheets: 0 } },
  { id: 10, name: 'Steven Gerrard',   country: 'England',   countryCode: 'GB', position: 'MID', era: '2000–2014', rarity: 'epic', points: 75, stats: { matches: 114, goals: 21, assists: 25, tackles: 140, saves: 0, cleanSheets: 0 } },
  { id: 11, name: 'Luka Modrić',      country: 'Croatia',   countryCode: 'HR', position: 'MID', era: '2006–', rarity: 'epic', points: 75, stats: { matches: 180, goals: 25, assists: 28, tackles: 150, saves: 0, cleanSheets: 0 } },

  // ── Defenders ────────────────────────────────────────────
  { id: 12, name: 'Paolo Maldini',    country: 'Italy',     countryCode: 'IT', position: 'DEF', era: '1988–2002', rarity: 'legendary', points: 100, stats: { matches: 126, goals: 7, assists: 12, tackles: 220, saves: 0, cleanSheets: 30 } },
  { id: 13, name: 'Sergio Ramos',     country: 'Spain',     countryCode: 'ES', position: 'DEF', era: '2005–2021', rarity: 'epic', points: 75, stats: { matches: 180, goals: 23, assists: 12, tackles: 230, saves: 0, cleanSheets: 60 } },
  { id: 14, name: 'Cafu',             country: 'Brazil',    countryCode: 'BR', position: 'DEF', era: '1990–2006', rarity: 'epic', points: 75, stats: { matches: 142, goals: 5, assists: 25, tackles: 200, saves: 0, cleanSheets: 40 } },

  // ── Goalkeepers (≥8 required) ────────────────────────────
  { id: 15, name: 'Gianluigi Buffon', country: 'Italy',     countryCode: 'IT', position: 'GK',  era: '1997–2018', rarity: 'legendary', points: 100, stats: { matches: 176, goals: 0, assists: 0, tackles: 4, saves: 320, cleanSheets: 77 } },
  { id: 16, name: 'Iker Casillas',    country: 'Spain',     countryCode: 'ES', position: 'GK',  era: '2000–2016', rarity: 'legendary', points: 100, stats: { matches: 167, goals: 0, assists: 0, tackles: 3, saves: 300, cleanSheets: 100 } },
  { id: 17, name: 'Manuel Neuer',     country: 'Germany',   countryCode: 'DE', position: 'GK',  era: '2009–', rarity: 'epic', points: 75, stats: { matches: 124, goals: 0, assists: 0, tackles: 6, saves: 230, cleanSheets: 50 } },

  // ── CHECKLIST: add the following to reach ≥50 (≥8 GK total) ──
  // Keep the same shape + approximate international stats.
  // FWD: Romário(BR), Gabriel Batistuta(AR), David Villa(ES), Robert Lewandowski(PL),
  //      Zlatan Ibrahimović(SE), Samuel Eto'o(CM), Didier Drogba(CI), George Weah(LR),
  //      Hristo Stoichkov(BG), Wayne Rooney(GB), Raúl(ES), Neymar(BR), Sergio Agüero(AR)
  // MID: Frank Lampard(GB), Xavi(ES), Andrés Iniesta(ES), Kaká(BR), Paul Pogba(FR),
  //      Michael Ballack(DE), Pavel Nedvěd(CZ), Roberto Baggio(IT), Mesut Özil(DE)
  // DEF: Fabio Cannavaro(IT), Carles Puyol(ES), Roberto Carlos(BR), Lilian Thuram(FR),
  //      Franco Baresi(IT), Virgil van Dijk(NL), Philipp Lahm(DE), Giorgio Chiellini(IT)
  // GK : Oliver Kahn(DE), Petr Čech(CZ), Edwin van der Sar(NL), Gianluigi Donnarumma(IT),
  //      Hugo Lloris(FR), Thibaut Courtois(BE)
]
```

- [ ] **Step 4: Create `shared/engine/decks.js`**

```js
// shared/engine/decks.js
import { playersInternational } from '../data/players.international.js'

export const DECKS = { international: playersInternational }

export function getDeck(deckType = 'international') {
  return DECKS[deckType] ?? playersInternational
}
```

- [ ] **Step 5: Run the test, complete the roster until green, then commit**

Run: `npx vitest run shared/data/players.international.test.js`
Expected after completing the checklist: PASS (5 tests). Then `npm test` → entire engine + data suite green.

```bash
git add shared/data/players.international.js shared/data/players.international.test.js shared/engine/decks.js
git commit -m "feat(data): curated international roster + deck registry"
```

---

### Task 13: Client app scaffold (Vite + Tailwind + theme + fonts)

**Files:**
- Create: `client/package.json`, `client/vite.config.js`, `client/index.html`, `client/postcss.config.js`, `client/tailwind.config.js`
- Create: `client/src/main.jsx`, `client/src/App.jsx`, `client/src/index.css`

- [ ] **Step 1: Create the Vite client package files**

`client/package.json`:
```json
{
  "name": "footytrump-client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "vite": "^6.0.3"
  }
}
```

`client/vite.config.js` (allows importing from `../shared`):
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
})
```

`client/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <title>FootyTrump ⚽</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`client/postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

- [ ] **Step 2: Create `client/tailwind.config.js` with the theme tokens**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: { light: '#1f7a33', DEFAULT: '#1b6e2e', dark: '#10491f' },
        navy: { light: '#1c3566', DEFAULT: '#142a52', dark: '#10203f', deep: '#0c1830' },
        gold: { light: '#ffe9a8', DEFAULT: '#ffd24a', dark: '#c79a2e', trim: '#e7c95a' },
        rarity: { legendary: '#ffd24a', epic: '#a855f7', rare: '#3b82f6', common: '#94a3b8' },
        stat: { matches: '#5b9bff', goals: '#ffd24a', assists: '#34d399', tackles: '#a78bfa', saves: '#22d3ee', cleanSheets: '#2dd4bf' },
      },
      fontFamily: {
        display: ['Rajdhani', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Create `client/src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

body { @apply font-body text-white; }

/* Green striped pitch background used by game screens */
.pitch-bg {
  background: repeating-linear-gradient(90deg, #1f7a33 0 34px, #1b6e2e 34px 68px);
}
.navy-card {
  background: linear-gradient(165deg, #1c3566 0%, #10203f 100%);
  border: 2px solid #e7c95a;
}
```

- [ ] **Step 4: Create `client/src/main.jsx` and a placeholder `App.jsx`**

`client/src/main.jsx`:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter><App /></BrowserRouter>
  </React.StrictMode>,
)
```

`client/src/App.jsx` (placeholder, replaced in Task 18):
```jsx
export default function App() {
  return <div className="pitch-bg min-h-screen grid place-items-center"><h1 className="font-display text-4xl">FootyTrump ⚽</h1></div>
}
```

- [ ] **Step 5: Install, run, verify, commit**

Run: `npm install --prefix client`
Run: `npm run --prefix client dev` → open the printed URL.
Expected: a green-striped page with "FootyTrump ⚽". Stop the dev server.

```bash
git add client/package.json client/package-lock.json client/vite.config.js client/index.html client/postcss.config.js client/tailwind.config.js client/src/main.jsx client/src/App.jsx client/src/index.css
git commit -m "feat(client): vite + tailwind scaffold with theme tokens"
```

---

### Task 14: StatBar + PlayerCard + CardBack components

**Files:**
- Create: `client/src/components/game/StatBar.jsx`
- Create: `client/src/components/game/PlayerCard.jsx`
- Create: `client/src/components/game/CardBack.jsx`

- [ ] **Step 1: Create `StatBar.jsx`**

```jsx
import { STAT_LABELS, STAT_MAX } from '../../../../shared/engine/constants.js'

const FLAG = {} // optional ISO->emoji map; countryCode shown as text fallback

export default function StatBar({ statKey, value, color, selectable, selected, burned, onPick }) {
  const pct = Math.min((value / (STAT_MAX[statKey] || 100)) * 100, 100)
  return (
    <button
      type="button"
      disabled={!selectable || burned}
      onClick={() => selectable && !burned && onPick?.(statKey)}
      className={`w-full text-left rounded-md px-2 py-1 transition
        ${selected ? 'bg-gold/20 border border-gold' : 'border border-transparent'}
        ${selectable && !burned ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
        ${burned ? 'opacity-40' : ''}`}
    >
      <div className="flex justify-between text-[10px] text-slate-300">
        <span>{STAT_LABELS[statKey]}{burned ? ' ·used' : ''}</span>
        <span className="font-display font-bold text-white">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-navy-deep mt-1">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: selected ? '#ffd24a' : color }} />
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Create `PlayerCard.jsx`**

```jsx
import StatBar from './StatBar.jsx'
import { STATS } from '../../../../shared/engine/constants.js'

const RARITY = {
  legendary: { label: 'LEGENDARY', stars: '★★★★★', color: '#ffd24a' },
  epic: { label: 'EPIC', stars: '★★★★☆', color: '#a855f7' },
  rare: { label: 'RARE', stars: '★★★☆☆', color: '#3b82f6' },
  common: { label: 'COMMON', stars: '★★☆☆☆', color: '#94a3b8' },
}
const STAT_COLOR = { matches: '#5b9bff', goals: '#ffd24a', assists: '#34d399', tackles: '#a78bfa', saves: '#22d3ee', cleanSheets: '#2dd4bf' }

export default function PlayerCard({ card, selectable = false, selectedStat = null, isWinner = false, onPickStat }) {
  if (!card) return null
  const r = RARITY[card.rarity] || RARITY.common
  const initials = card.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  return (
    <div className={`navy-card rounded-2xl p-3.5 w-[230px] shadow-xl ${isWinner ? 'ring-4 ring-gold scale-105' : ''}`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full" style={{ background: r.color, color: '#10203f' }}>{r.label}</span>
        <span className="text-[11px]" style={{ color: r.color }}>{r.stars}</span>
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <div className="w-10 h-10 rounded-lg grid place-items-center font-display font-bold text-gold-light bg-navy-light">{initials}</div>
        <div className="min-w-0">
          <div className="font-display font-bold text-white text-sm truncate">{card.name}</div>
          <div className="text-[10px] text-slate-300 truncate">{card.country} · {card.position}</div>
        </div>
      </div>
      <div className="h-px bg-gold/30 my-2.5" />
      <div className="flex flex-col gap-1.5">
        {STATS.map(s => (
          <StatBar key={s} statKey={s} value={card.stats[s]} color={STAT_COLOR[s]}
            selectable={selectable} selected={selectedStat === s}
            burned={card.usedStats?.includes(s)} onPick={onPickStat} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `CardBack.jsx`**

```jsx
export default function CardBack({ compact = false }) {
  return (
    <div className={`rounded-xl grid place-items-center bg-gradient-to-br from-pitch to-pitch-dark border-2 border-gold-trim ${compact ? 'w-[74px] h-[104px]' : 'w-[140px] h-[196px]'}`}>
      <div className="text-center text-gold-light">
        <div className="text-3xl">⚽</div>
        <div className="text-[8px] font-display font-bold tracking-[0.2em] mt-1">TRUMP</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify visually via a temporary route**

Temporarily set `client/src/App.jsx` to render a `PlayerCard` with a sample card (Messi object from Task 12) on a `.pitch-bg` container. Run `npm run --prefix client dev`, confirm the navy/gold card with six stat bars renders over green, Saves/Clean Sheets show 0 and dimmer. Revert `App.jsx` afterward (Task 18 replaces it).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/game/StatBar.jsx client/src/components/game/PlayerCard.jsx client/src/components/game/CardBack.jsx
git commit -m "feat(client): PlayerCard, StatBar, CardBack components"
```

---

### Task 15: Guest identity + shared UI primitives

**Files:**
- Create: `client/src/lib/identity.js`
- Create: `client/src/components/ui/Button.jsx`
- Create: `client/src/components/ui/Modal.jsx`

- [ ] **Step 1: Create `identity.js`**

```js
// client/src/lib/identity.js — guest identity in localStorage (no login wall)
const KEY = 'footytrump.identity'
const COLORS = ['#1d4ed8', '#7c3aed', '#b45309', '#065f46', '#9f1239', '#0e7490']

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return 'g-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function getIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.id) return saved
  } catch { /* ignore */ }
  const created = { id: uuid(), name: 'Player', color: COLORS[Math.floor(Math.random() * COLORS.length)] }
  localStorage.setItem(KEY, JSON.stringify(created))
  return created
}

export function setName(name) {
  const id = getIdentity()
  const updated = { ...id, name: name.trim().slice(0, 20) || 'Player' }
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}
```

- [ ] **Step 2: Create `Button.jsx`**

```jsx
export default function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-gold text-navy-deep hover:brightness-105',
    secondary: 'bg-pitch text-white hover:brightness-110',
    ghost: 'bg-white/10 text-white hover:bg-white/20',
  }
  return <button className={`font-display font-bold tracking-wide px-5 py-2.5 rounded-xl transition disabled:opacity-50 ${styles[variant]} ${className}`} {...props} />
}
```

- [ ] **Step 3: Create `Modal.jsx`**

```jsx
export default function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="navy-card rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
        {title && <h2 className="font-display font-bold text-xl mb-3 text-gold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify import (lint-level)**

Run: `npm run --prefix client build`
Expected: build succeeds (these modules compile). 

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/identity.js client/src/components/ui/Button.jsx client/src/components/ui/Modal.jsx
git commit -m "feat(client): guest identity + Button/Modal primitives"
```

---

### Task 16: Solo store (orchestrates a full game vs CPU)

**Files:**
- Create: `client/src/store/soloStore.js`

This store sequences the engine + bot with short delays so bot turns are readable. The human is always player index 0; bots fill the rest.

- [ ] **Step 1: Create `soloStore.js`**

```js
// client/src/store/soloStore.js
import { create } from 'zustand'
import { createGame, selectCardAndStat, selectOpponentCard, resolveRound } from '../../../shared/engine/game.js'
import { botPickActive, botPickOpponent } from '../../../shared/engine/bot.js'
import { getDeck } from '../../../shared/engine/decks.js'

const BOT_DELAY = 900
const REVEAL_MS = 2600
const wait = (ms) => new Promise(r => setTimeout(r, ms))

export const useSoloStore = create((set, get) => ({
  game: null,
  myId: 'me',
  difficulty: 'medium',
  selectedStat: null,
  roundResult: null,
  busy: false,
  finished: false,

  start({ humanName = 'You', botCount = 1, difficulty = 'medium', deckType = 'international' }) {
    const players = [{ id: 'me', name: humanName, isBot: false }]
    for (let i = 0; i < botCount; i++) players.push({ id: `bot${i + 1}`, name: `CPU ${i + 1}`, isBot: true })
    const game = createGame({ players, deck: getDeck(deckType), deckType })
    set({ game, difficulty, selectedStat: null, roundResult: null, finished: false, busy: false })
    get()._maybeBotActive()
  },

  // human (active) picks a stat on a chosen card
  pickActiveStat(cardId, stat) {
    const { game } = get()
    if (!game || game.phase !== 'active_selecting') return
    const res = selectCardAndStat(game, 'me', cardId, stat)
    if (res.error) return
    set({ game: res.game, selectedStat: stat })
    get()._runOpponents()
  },

  // human (as an opponent) picks a card to defend with
  pickOpponentCard(cardId) {
    const { game } = get()
    if (!game || game.phase !== 'opponents_selecting') return
    const res = selectOpponentCard(game, 'me', cardId)
    if (res.error) return
    set({ game: res.game })
    if (res.allSelected) get()._resolve()
    else get()._runOpponents()
  },

  // ── internal orchestration ──────────────────────────────
  async _maybeBotActive() {
    const { game, difficulty } = get()
    if (!game || game.phase !== 'active_selecting') return
    const active = game.players[game.activePlayerIndex]
    if (!active.isBot) return // wait for human
    set({ busy: true })
    await wait(BOT_DELAY)
    const pick = botPickActive(get().game, active.id, difficulty)
    const res = selectCardAndStat(get().game, active.id, pick.cardId, pick.stat)
    set({ game: res.game, selectedStat: pick.stat, busy: false })
    get()._runOpponents()
  },

  async _runOpponents() {
    const { game } = get()
    if (!game || game.phase !== 'opponents_selecting') return
    const active = game.players[game.activePlayerIndex]
    const pending = game.players.filter(p => p.isActive && p.hand.length > 0 && p.id !== active.id && !game.opponentSelections[p.id])
    const humanPending = pending.find(p => p.id === 'me')
    if (humanPending) return // wait for human to defend
    set({ busy: true })
    for (const bot of pending) {
      await wait(BOT_DELAY)
      const pick = botPickOpponent(get().game, bot.id, get().game.activeStat)
      const res = selectOpponentCard(get().game, bot.id, pick.cardId)
      set({ game: res.game })
      if (res.allSelected) { set({ busy: false }); return get()._resolve() }
    }
    set({ busy: false })
  },

  async _resolve() {
    const res = resolveRound(get().game)
    set({ roundResult: res.roundResult, game: res.game, busy: true })
    await wait(REVEAL_MS)
    set({ roundResult: null, selectedStat: null, busy: false })
    if (res.gameEnded) { set({ finished: true }); return }
    get()._maybeBotActive()
  },
}))
```

- [ ] **Step 2: Sanity build**

Run: `npm run --prefix client build`
Expected: build succeeds (imports resolve through `vite` `fs.allow: ['..']`).

- [ ] **Step 3: Commit**

```bash
git add client/src/store/soloStore.js
git commit -m "feat(client): solo store orchestrating engine + bot"
```

---

### Task 17: Battle sub-components (OpponentStrip, RoundResultOverlay)

**Files:**
- Create: `client/src/components/game/OpponentStrip.jsx`
- Create: `client/src/components/game/RoundResultOverlay.jsx`

- [ ] **Step 1: Create `OpponentStrip.jsx`**

```jsx
import CardBack from './CardBack.jsx'

export default function OpponentStrip({ players, activeId, myId }) {
  const opponents = players.filter(p => p.id !== myId)
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {opponents.map(p => (
        <div key={p.id} className={`text-center ${!p.isActive || p.hand.length === 0 ? 'opacity-40' : ''}`}>
          <CardBack compact />
          <div className={`mt-1 text-[11px] font-display ${p.id === activeId ? 'text-gold font-bold' : 'text-white'}`}>{p.name}</div>
          <div className="text-[10px] text-slate-200">{p.hand.length} cards</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `RoundResultOverlay.jsx`**

```jsx
import { STAT_LABELS } from '../../../../shared/engine/constants.js'

export default function RoundResultOverlay({ result, players }) {
  if (!result) return null
  const name = (id) => players.find(p => p.id === id)?.name ?? '—'
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50">
      <div className="navy-card rounded-2xl px-8 py-6 text-center">
        <div className="text-xs text-gold tracking-widest">{STAT_LABELS[result.stat]}</div>
        <div className="font-display text-2xl font-bold mt-2">
          {result.isTie ? 'TIE — cards to the pile' : `${name(result.winnerId)} wins the round!`}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build sanity**

Run: `npm run --prefix client build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/game/OpponentStrip.jsx client/src/components/game/RoundResultOverlay.jsx
git commit -m "feat(client): opponent strip + round result overlay"
```

---

### Task 18: SoloGame page + router (PLAYABLE MILESTONE)

**Files:**
- Create: `client/src/pages/SoloGame.jsx`
- Create: `client/src/pages/Home.jsx`
- Create: `client/src/pages/SoloSetup.jsx`
- Create: `client/src/pages/Results.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Create `SoloGame.jsx`**

```jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSoloStore } from '../store/soloStore.js'
import PlayerCard from '../components/game/PlayerCard.jsx'
import OpponentStrip from '../components/game/OpponentStrip.jsx'
import RoundResultOverlay from '../components/game/RoundResultOverlay.jsx'

export default function SoloGame() {
  const nav = useNavigate()
  const { game, myId, selectedStat, roundResult, finished, pickActiveStat, pickOpponentCard } = useSoloStore()

  useEffect(() => { if (!game) nav('/solo/setup') }, [game, nav])
  useEffect(() => { if (finished) nav('/results') }, [finished, nav])
  if (!game) return null

  const me = game.players.find(p => p.id === myId)
  const active = game.players[game.activePlayerIndex]
  const iAmActive = active?.id === myId
  const iMustDefend = game.phase === 'opponents_selecting' && !game.opponentSelections[myId] && me?.hand.length > 0

  const turnText = game.phase === 'active_selecting'
    ? (iAmActive ? 'Your turn — tap a stat to attack' : `${active.name} is choosing…`)
    : (iMustDefend ? 'Pick a card to defend' : 'Waiting for opponents…')

  return (
    <div className="pitch-bg min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center text-sm">
          <span className="font-display">Round {game.currentRound + 1}</span>
          <span className="text-gold font-display font-bold">{turnText}</span>
        </div>

        <div className="mt-4"><OpponentStrip players={game.players} activeId={active?.id} myId={myId} /></div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-4 justify-start">
          {me?.hand.map(card => (
            <div key={card.id} className="shrink-0">
              <PlayerCard
                card={card}
                selectable={iAmActive && game.phase === 'active_selecting'}
                selectedStat={iAmActive && game.activeCardId === card.id ? game.activeStat : null}
                onPickStat={(stat) => pickActiveStat(card.id, stat)}
              />
              {iMustDefend && (
                <button onClick={() => pickOpponentCard(card.id)} className="mt-2 w-full text-xs font-display font-bold bg-gold text-navy-deep rounded-lg py-1.5">Play this card</button>
              )}
            </div>
          ))}
        </div>
      </div>
      <RoundResultOverlay result={roundResult} players={game.players} />
    </div>
  )
}
```

- [ ] **Step 2: Create `Home.jsx`**

```jsx
import { Link } from 'react-router-dom'
import { getIdentity } from '../lib/identity.js'

export default function Home() {
  const me = getIdentity()
  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6 text-center">
      <div>
        <div className="text-6xl">⚽</div>
        <h1 className="font-display text-5xl font-bold mt-2">FootyTrump</h1>
        <p className="text-slate-100 mt-1">FIFA World Cup 2026 · Trump Cards</p>
        <div className="mt-8 flex flex-col gap-3 w-64 mx-auto">
          <Link to="/solo/setup" className="navy-card rounded-xl py-3 font-display font-bold">⚔️ Play vs CPU</Link>
          <span className="bg-white/10 rounded-xl py-3 font-display text-slate-300">👥 Online (coming soon)</span>
          <span className="bg-white/10 rounded-xl py-3 font-display text-slate-300">🧠 Quiz (coming soon)</span>
        </div>
        <p className="text-xs text-slate-200 mt-6">Playing as {me.name}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `SoloSetup.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSoloStore } from '../store/soloStore.js'
import { getIdentity, setName } from '../lib/identity.js'
import Button from '../components/ui/Button.jsx'

export default function SoloSetup() {
  const nav = useNavigate()
  const start = useSoloStore(s => s.start)
  const [name, setNameInput] = useState(getIdentity().name)
  const [botCount, setBotCount] = useState(1)
  const [difficulty, setDifficulty] = useState('medium')

  function play() {
    const me = setName(name)
    start({ humanName: me.name, botCount, difficulty })
    nav('/solo')
  }

  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6">
      <div className="navy-card rounded-2xl p-6 w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-gold mb-4">Solo vs CPU</h1>
        <label className="text-sm">Your name
          <input value={name} onChange={e => setNameInput(e.target.value)} className="w-full mt-1 rounded-lg bg-navy-deep px-3 py-2 text-white" />
        </label>
        <div className="mt-4 text-sm">CPU opponents
          <div className="flex gap-2 mt-1">{[1, 2, 3].map(n => (
            <button key={n} onClick={() => setBotCount(n)} className={`flex-1 rounded-lg py-2 font-display ${botCount === n ? 'bg-gold text-navy-deep' : 'bg-navy-deep'}`}>{n}</button>
          ))}</div>
        </div>
        <div className="mt-4 text-sm">Difficulty
          <div className="flex gap-2 mt-1">{['easy', 'medium', 'hard'].map(d => (
            <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 rounded-lg py-2 font-display capitalize ${difficulty === d ? 'bg-gold text-navy-deep' : 'bg-navy-deep'}`}>{d}</button>
          ))}</div>
        </div>
        <Button onClick={play} className="w-full mt-6">Kick off ⚽</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `Results.jsx` and wire the router in `App.jsx`**

`client/src/pages/Results.jsx`:
```jsx
import { Link } from 'react-router-dom'
import { useSoloStore } from '../store/soloStore.js'

export default function Results() {
  const game = useSoloStore(s => s.game)
  if (!game) return <div className="pitch-bg min-h-screen grid place-items-center"><Link className="navy-card rounded-xl px-6 py-3" to="/">Home</Link></div>
  const winner = game.players.find(p => p.id === game.winnerId)
  const ranked = [...game.players].sort((a, b) => b.score - a.score)
  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6 text-center">
      <div className="navy-card rounded-2xl p-6 w-full max-w-sm">
        <div className="text-5xl">🏆</div>
        <h1 className="font-display text-3xl font-bold text-gold mt-2">{winner ? `${winner.name} wins!` : 'Game over'}</h1>
        <ul className="mt-4 text-left">
          {ranked.map(p => (
            <li key={p.id} className="flex justify-between border-b border-white/10 py-1.5">
              <span>{p.name}</span><span className="font-display font-bold">{p.score} pts · {p.hand.length} cards</span>
            </li>
          ))}
        </ul>
        <Link to="/solo/setup" className="block mt-6 bg-gold text-navy-deep font-display font-bold rounded-xl py-3">Play again</Link>
        <Link to="/" className="block mt-2 text-slate-200 text-sm">Home</Link>
      </div>
    </div>
  )
}
```

`client/src/App.jsx`:
```jsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import SoloSetup from './pages/SoloSetup.jsx'
import SoloGame from './pages/SoloGame.jsx'
import Results from './pages/Results.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/solo/setup" element={<SoloSetup />} />
      <Route path="/solo" element={<SoloGame />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  )
}
```

- [ ] **Step 5: Playtest the full loop, then commit**

Run: `npm run --prefix client dev` → open the URL.
Manual verification checklist:
1. Home → "Play vs CPU" → setup → choose 1–3 CPUs + difficulty → "Kick off".
2. When it's your turn, tapping a stat attacks; bots respond after a short delay; the round-result overlay shows the winner.
3. When a bot is active and picks a stat, you get a "Play this card" button to defend with each of your cards.
4. Cards transfer to the winner; burned stats show dimmed with "·used".
5. Game ends when one player holds all cards → Results screen shows ranking → "Play again" works.

```bash
git add client/src/pages/ client/src/App.jsx
git commit -m "feat(client): solo game, home, setup, results — playable vs CPU"
```

---

### Task 19: README + first playable tag

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

````markdown
# FootyTrump ⚽

FIFA World Cup 2026–themed football **trump-card game** (+ quiz, coming later).
Inspired by the author's Cricket Trump Card game.

## Run locally
```bash
npm install                 # root (engine tests + tooling)
npm install --prefix client # client deps
npm run dev                 # starts the Vite client
npm test                    # runs the engine + data test suite
```

## Structure
- `shared/engine` — pure, tested rules engine (single source of truth)
- `shared/data` — curated player roster
- `client` — React + Vite + Tailwind UI (solo vs CPU)

## Status
- ✅ Plan A: engine + solo vs CPU (this build)
- ⏳ Plan B: online rooms (Railway + Socket.io)
- ⏳ Plan C: quiz (Guess the Footballer + Multiple Choice)
````

- [ ] **Step 2: Run the whole test suite**

Run: `npm test`
Expected: all engine + data tests pass.

- [ ] **Step 3: Commit + tag the playable milestone**

```bash
git add README.md
git commit -m "docs: README + run instructions"
git tag v0.1.0-solo
```

---

## Self-Review (completed during planning)

**1. Spec coverage (Plan-A scope):** shared engine (Tasks 2–11) ✓ · position-aware stats & burned-stat mechanic (Tasks 7, 9, 14) ✓ · rarity points & timer-expiry winner (Tasks 4, 10) ✓ · decks registry + curated roster ≥50 incl. ≥8 GK (Task 12) ✓ · Royal-Navy-Gold-on-pitch theme (Tasks 13–14) ✓ · solo vs CPU with difficulty (Tasks 16, 18) ✓ · guest identity (Task 15) ✓ · home/setup/results shell (Task 18) ✓. **Deferred by design:** online rooms/server → Plan B; quiz → Plan C; Supabase/leaderboard → later.

**2. Placeholder scan:** the only "extend later" is the roster checklist in Task 12, which is gated by a concrete validation test (≥50 players, ≥8 GK, required fields) — "done" is test-green, not vague. No other placeholders.

**3. Type/name consistency:** engine API used identically across tasks and the client — `createGame({players,deck,deckType,rng})`, `selectCardAndStat(game,playerId,cardId,stat)`, `selectOpponentCard(game,playerId,cardId)`, `resolveRound(game)` returning `{game, roundResult, gameEnded, winnerId}`, `endByTimer(game)`, `botPickActive(game,playerId,difficulty,rng)`, `botPickOpponent(game,playerId,stat)`, `getDeck(deckType)`. Store calls (`start/pickActiveStat/pickOpponentCard`) match `SoloGame.jsx`/`SoloSetup.jsx` usage. Stat keys (`matches,goals,assists,tackles,saves,cleanSheets`) and color/label maps consistent across `constants.js`, `tailwind.config.js`, `StatBar.jsx`, `PlayerCard.jsx`.
