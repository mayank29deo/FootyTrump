# FootyTrump — Plan B: Online Multiplayer Rooms

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let 2–6 friends play FootyTrump over the internet in shared rooms (create/join with a code + share link), reusing the existing tested engine, with a 4/6/8-minute room clock and 30s+30s per-turn timers.

**Architecture:** A Node ESM + Express + Socket.io server holds room state in memory and calls the **same `shared/engine`** the solo client uses. A `roomManager` wraps the engine with room lifecycle + timing; `index.js` wires Socket.io events and the server-authoritative timers. The React client gets a socket layer, an `onlineStore`, a Lobby, and an OnlineGame page that **reuses the Plan A battle components**.

**Tech Stack:** Node ESM, Express, Socket.io, cors, uuid (server); socket.io-client, Zustand (client). Deploy: Railway (server) + Vercel (client).

**Depends on:** Plan A (engine, roster, PlayerCard/OpponentStrip/RoundResultOverlay, theme). Spec: `docs/superpowers/specs/2026-06-08-footytrump-design.md` §4.6, §6.

## Timing rules (from spec §4.6)
- Room clock: **4 / 6 / 8 min** (host picks). `timer_tick` drives the countdown; `last_round_warning` at 15s.
- **Active phase 30s** (pick card+stat) → **Opponent phase 30s** (respond). Auto-pick via engine bot on timeout.
- **Dynamic rounds:** no fixed count — play until clock expires or one player holds all cards.
- **Last-round completion:** clock hitting 0 mid-round sets `pendingEnd`; the round resolves fully, then the game ends.

## File structure
```
server/
  package.json            # ESM; express, socket.io, cors, uuid; nodemon (dev)
  railway.json            # NIXPACKS, node index.js
  roomManager.js          # rooms Map + engine integration + timing constants
  roomManager.test.js     # Vitest (lifecycle + integration)
  index.js                # Socket.io events + phase/room timers
shared/engine/
  quiz.js                 # quizScore(playerCount, rank) — used by Plan C, added here (shared)
  quiz.test.js
client/src/
  lib/socket.js           # socket.io-client singleton (primary + fallback URL)
  store/onlineStore.js    # Zustand: room + game state from socket events
  components/game/GameTimer.jsx
  components/lobby/ShareModal.jsx
  pages/Lobby.jsx         # create/join, player list, time/deck config, start
  pages/OnlineGame.jsx    # battle screen wired to onlineStore
vitest.config.js          # include server/**/*.test.js too
```

---

### Task 1: quizScore helper (shared, TDD)

Small pure helper for Plan C's room scoring; lives in the shared engine so server + client share it.

**Files:** Create `shared/engine/quiz.js`, `shared/engine/quiz.test.js`. Modify `vitest.config.js`.

- [ ] **Step 1: Failing test**

```js
// shared/engine/quiz.test.js
import { describe, it, expect } from 'vitest'
import { quizScore, QUIZ_POINTS } from './quiz.js'

describe('quizScore', () => {
  it('matches the spec table per player count', () => {
    expect(QUIZ_POINTS[2]).toEqual([10, 6])
    expect(QUIZ_POINTS[6]).toEqual([10, 8, 6, 4, 2, 0])
  })
  it('awards points by correct-answer speed rank (1-based)', () => {
    expect(quizScore(6, 1)).toBe(10)
    expect(quizScore(6, 3)).toBe(6)
    expect(quizScore(2, 2)).toBe(6)
  })
  it('wrong/timeout (rank null) and out-of-range score 0', () => {
    expect(quizScore(4, null)).toBe(0)
    expect(quizScore(4, 99)).toBe(0)
  })
  it('clamps unknown player counts to the nearest defined table', () => {
    expect(quizScore(7, 1)).toBe(10) // clamps to 6-table
    expect(quizScore(1, 1)).toBe(10) // clamps to 2-table
  })
})
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run shared/engine/quiz.test.js`).

- [ ] **Step 3: Implement**

```js
// shared/engine/quiz.js
// Speed-ranked multiplayer quiz scoring (spec §8.4). Fastest correct = 10; wrong/timeout = 0.
export const QUIZ_POINTS = {
  2: [10, 6],
  3: [10, 7, 4],
  4: [10, 8, 5, 2],
  5: [10, 8, 6, 3, 1],
  6: [10, 8, 6, 4, 2, 0],
}

// rank is 1-based position among CORRECT answers ordered fastest→slowest; null = wrong/timeout.
export function quizScore(playerCount, rank) {
  const n = Math.max(2, Math.min(6, playerCount))
  const table = QUIZ_POINTS[n]
  if (!rank || rank < 1 || rank > table.length) return 0
  return table[rank - 1]
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Extend `vitest.config.js` include to cover the server tests too**

```js
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { include: ['shared/**/*.test.js', 'server/**/*.test.js'], environment: 'node' },
})
```

- [ ] **Step 6: Commit** — `git commit -m "feat(engine): quizScore speed-ranked helper + widen vitest include"`

---

### Task 2: Server scaffold

**Files:** Create `server/package.json`, `server/railway.json`.

- [ ] **Step 1: `server/package.json`**

```json
{
  "name": "footytrump-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "index.js",
  "scripts": { "start": "node index.js", "dev": "nodemon index.js" },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "socket.io": "^4.8.1",
    "uuid": "^11.0.3"
  },
  "devDependencies": { "nodemon": "^3.1.9" }
}
```

- [ ] **Step 2: `server/railway.json`**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": { "startCommand": "node index.js", "restartPolicyType": "ON_FAILURE", "restartPolicyMaxRetries": 10 }
}
```

- [ ] **Step 3: Install** — `npm install --prefix server` → no errors.

- [ ] **Step 4: Commit** — `git commit -m "chore(server): scaffold ESM express+socket.io"`

---

### Task 3: roomManager — lifecycle (TDD)

**Files:** Create `server/roomManager.js`, `server/roomManager.test.js`.

- [ ] **Step 1: Failing test**

```js
// server/roomManager.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import * as rm from './roomManager.js'

const host = { id: 'h', name: 'Host', socketId: 's1' }

describe('roomManager lifecycle', () => {
  beforeEach(() => rm._reset())

  it('creates a room with a 6-char code and the host as first player', () => {
    const room = rm.createRoom(host, 6, 'international')
    expect(room.code).toMatch(/^[A-Z0-9]{6}$/)
    expect(room.players).toHaveLength(1)
    expect(room.hostId).toBe('h')
    expect(room.timeOption).toBe(6)
    expect(room.phase).toBe('waiting')
  })
  it('defaults an invalid time option to 6', () => {
    expect(rm.createRoom(host, 99).timeOption).toBe(6)
  })
  it('joins a second player; blocks a 7th and blocks join after start', () => {
    const room = rm.createRoom(host, 4)
    expect(rm.joinRoom(room.code, { id: 'p2', name: 'B', socketId: 's2' }).room.players).toHaveLength(2)
    for (let i = 3; i <= 6; i++) rm.joinRoom(room.code, { id: 'p' + i, name: 'P' + i, socketId: 's' + i })
    expect(rm.joinRoom(room.code, { id: 'p7', name: 'P7', socketId: 's7' }).error).toMatch(/full/i)
  })
  it('lets an existing player rejoin with a new socketId', () => {
    const room = rm.createRoom(host, 4)
    const r = rm.joinRoom(room.code, { id: 'h', name: 'Host', socketId: 'sNEW' })
    expect(r.rejoining).toBe(true)
    expect(rm.getRoom(room.code).players[0].socketId).toBe('sNEW')
  })
  it('returns an error for unknown rooms', () => {
    expect(rm.joinRoom('ZZZZZZ', host).error).toMatch(/not found/i)
  })
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement lifecycle**

```js
// server/roomManager.js
import { createGame, selectCardAndStat, selectOpponentCard, resolveRound, endByTimer } from '../shared/engine/game.js'
import { botPickActive, botPickOpponent } from '../shared/engine/bot.js'
import { getDeck } from '../shared/engine/decks.js'

export const ACTIVE_SECONDS = 30
export const OPPONENT_SECONDS = 30
const VALID_TIMES = [4, 6, 8]

const rooms = new Map()
export function _reset() { rooms.clear() }          // test helper
export function getRoom(code) { return rooms.get(code) || null }

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code
  do { code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') }
  while (rooms.has(code))
  return code
}

export function createRoom(host, timeOption, deckType = 'international') {
  const code = generateRoomCode()
  const room = {
    code,
    hostId: host.id,
    players: [{ id: host.id, name: host.name, avatar: host.avatar ?? null, socketId: host.socketId, connected: true }],
    timeOption: VALID_TIMES.includes(timeOption) ? timeOption : 6,
    deckType,
    phase: 'waiting',
    game: null,
    pendingEnd: false,
    createdAt: Date.now(),
  }
  rooms.set(code, room)
  return room
}

export function joinRoom(code, player) {
  const room = rooms.get(code)
  if (!room) return { error: 'Room not found' }
  const existing = room.players.find(p => p.id === player.id)
  if (existing) { existing.socketId = player.socketId; existing.connected = true; return { room, rejoining: true } }
  if (room.phase !== 'waiting') return { error: 'Game already in progress' }
  if (room.players.length >= 6) return { error: 'Room is full' }
  room.players.push({ id: player.id, name: player.name, avatar: player.avatar ?? null, socketId: player.socketId, connected: true })
  return { room }
}

export function leaveRoom(code, playerId) {
  const room = rooms.get(code)
  if (!room) return null
  room.players = room.players.filter(p => p.id !== playerId)
  if (room.players.length === 0) { rooms.delete(code); return { deleted: true } }
  if (room.hostId === playerId) room.hostId = room.players[0].id
  return { room }
}

export function updateSocket(code, playerId, socketId) {
  const room = rooms.get(code)
  const p = room?.players.find(x => x.id === playerId)
  if (p) { p.socketId = socketId; p.connected = true }
  return room
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** — `git commit -m "feat(server): roomManager lifecycle (create/join/leave) + tests"`

---

### Task 4: roomManager — engine integration (TDD)

**Files:** Modify `server/roomManager.js`, add cases to `server/roomManager.test.js`.

- [ ] **Step 1: Failing test (append)**

```js
// server/roomManager.test.js (append)
import { ACTIVE_SECONDS, OPPONENT_SECONDS } from './roomManager.js'

describe('roomManager game integration', () => {
  beforeEach(() => rm._reset())
  function started() {
    const room = rm.createRoom({ id: 'a', name: 'A', socketId: 's1' }, 4)
    rm.joinRoom(room.code, { id: 'b', name: 'B', socketId: 's2' })
    rm.startGame(room.code)
    return room.code
  }
  it('exposes 30s phase constants', () => {
    expect(ACTIVE_SECONDS).toBe(30)
    expect(OPPONENT_SECONDS).toBe(30)
  })
  it('startGame deals hands and enters active_selecting', () => {
    const code = started()
    const room = rm.getRoom(code)
    expect(room.phase).toBe('active_selecting')
    expect(room.game.players[0].hand.length).toBeGreaterThan(0)
  })
  it('autoActive + autoOpponents resolve a round end-to-end', () => {
    const code = started()
    rm.autoActive(code)
    expect(rm.getRoom(code).phase).toBe('opponents_selecting')
    const res = rm.autoOpponentsAndResolve(code)
    expect(res.roundResult).toBeTruthy()
    expect(['active_selecting', 'ended']).toContain(rm.getRoom(code).phase)
  })
  it('timerExpiry ends the game with the top scorer', () => {
    const code = started()
    const { winnerId } = rm.timerExpiry(code)
    expect(rm.getRoom(code).phase).toBe('ended')
    expect(winnerId).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement integration (append to roomManager.js)**

```js
// server/roomManager.js (append)
export function startGame(code) {
  const room = rooms.get(code)
  if (!room) return { error: 'Room not found' }
  if (room.players.length < 2) return { error: 'Need at least 2 players' }
  room.game = createGame({
    players: room.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
    deck: getDeck(room.deckType),
    deckType: room.deckType,
  })
  room.phase = 'active_selecting'
  room.pendingEnd = false
  return { room }
}

export function selectCardStat(code, playerId, cardId, stat) {
  const room = rooms.get(code)
  if (!room?.game) return { error: 'No game' }
  const res = selectCardAndStat(room.game, playerId, cardId, stat)
  if (res.error) return res
  room.game = res.game; room.phase = res.game.phase
  return { room }
}

export function selectOpponent(code, playerId, cardId) {
  const room = rooms.get(code)
  if (!room?.game) return { error: 'No game' }
  const res = selectOpponentCard(room.game, playerId, cardId)
  if (res.error) return res
  room.game = res.game
  return { room, allSelected: res.allSelected }
}

export function resolve(code) {
  const room = rooms.get(code)
  const res = resolveRound(room.game)
  if (res.error) return res
  room.game = res.game; room.phase = res.game.phase
  return { room, roundResult: res.roundResult, gameEnded: res.gameEnded, winnerId: res.winnerId }
}

export function autoActive(code) {
  const room = rooms.get(code)
  const activeId = room.game.players[room.game.activePlayerIndex].id
  const pick = botPickActive(room.game, activeId, 'medium')
  return selectCardStat(code, activeId, pick.cardId, pick.stat)
}

export function autoOpponentsAndResolve(code) {
  const room = rooms.get(code)
  const active = room.game.players[room.game.activePlayerIndex]
  const pending = room.game.players.filter(p => p.isActive && p.hand.length > 0 && p.id !== active.id && !room.game.opponentSelections[p.id])
  for (const opp of pending) {
    const pick = botPickOpponent(room.game, opp.id, room.game.activeStat)
    const res = selectOpponentCard(room.game, opp.id, pick.cardId)
    room.game = res.game
  }
  return resolve(code)
}

export function timerExpiry(code) {
  const room = rooms.get(code)
  if (!room?.game) return { error: 'No game' }
  const res = endByTimer(room.game)
  room.game = res.game; room.phase = 'ended'
  return { room, winnerId: res.winnerId }
}

// Public room snapshot (no private hands). Per-player hands are sent separately.
export function publicState(room) {
  const g = room.game
  return {
    code: room.code, hostId: room.hostId, timeOption: room.timeOption, deckType: room.deckType, phase: room.phase,
    players: room.players.map(p => {
      const gp = g?.players.find(x => x.id === p.id)
      return { id: p.id, name: p.name, avatar: p.avatar, connected: p.connected, cardCount: gp?.hand.length ?? 0, score: gp?.score ?? 0, isActive: gp?.isActive ?? true }
    }),
    currentRound: g?.currentRound ?? 0,
    activePlayerId: g ? g.players[g.activePlayerIndex]?.id : null,
    activeStat: g?.activeStat ?? null,
    activeCard: g?.activeStat ? g.players[g.activePlayerIndex]?.hand.find(c => c.id === g.activeCardId) ?? null : null,
    neutralPileCount: g?.neutralPile.length ?? 0,
    winnerId: g?.winnerId ?? null,
  }
}
```

- [ ] **Step 4: Run → PASS.** Then full suite `npm test` green.

- [ ] **Step 5: Commit** — `git commit -m "feat(server): roomManager engine integration + public state"`

---

### Task 5: index.js — Socket.io events + timers

**Files:** Create `server/index.js`.

Adapts the cricket server's timer pattern to this engine. Active phase 30s → opponent phase 30s → resolve → reveal pause → next; overall room clock with `pendingEnd` last-round completion.

- [ ] **Step 1: Write `server/index.js`** (full code)

```js
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import * as rm from './roomManager.js'

const app = express()
app.use(cors({ origin: '*' }))
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const server = createServer(app)
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] }, pingInterval: 5000, pingTimeout: 10000 })

const phaseTimers = new Map() // code -> {tick, expire}
const roomClocks = new Map()  // code -> interval
const REVEAL_MS = 2600

const clearPhase = (code) => { const t = phaseTimers.get(code); if (t) { clearInterval(t.tick); clearTimeout(t.expire); phaseTimers.delete(code) } }

function emitState(code) {
  const room = rm.getRoom(code); if (!room) return
  io.to(code).emit('game_state', rm.publicState(room))
  room.players.forEach(p => {
    const gp = room.game?.players.find(x => x.id === p.id)
    if (gp) io.to(p.socketId).emit('your_hand', { hand: gp.hand })
  })
}

function startActivePhase(code) {
  clearPhase(code)
  const room = rm.getRoom(code); if (!room || room.phase !== 'active_selecting') return
  io.to(code).emit('phase_changed', { phase: 'active_selecting', activePlayerId: room.game.players[room.game.activePlayerIndex].id, seconds: rm.ACTIVE_SECONDS })
  let left = rm.ACTIVE_SECONDS
  const tick = setInterval(() => { left -= 1; io.to(code).emit('phase_tick', { phase: 'active_selecting', left }) }, 1000)
  const expire = setTimeout(() => { clearInterval(tick); phaseTimers.delete(code); rm.autoActive(code); enterOpponentPhase(code) }, rm.ACTIVE_SECONDS * 1000)
  phaseTimers.set(code, { tick, expire })
}

function enterOpponentPhase(code) {
  clearPhase(code)
  const room = rm.getRoom(code); if (!room || room.phase !== 'opponents_selecting') return
  emitState(code)
  io.to(code).emit('phase_changed', { phase: 'opponents_selecting', activePlayerId: room.game.players[room.game.activePlayerIndex].id, activeStat: room.game.activeStat, seconds: rm.OPPONENT_SECONDS })
  let left = rm.OPPONENT_SECONDS
  const tick = setInterval(() => { left -= 1; io.to(code).emit('phase_tick', { phase: 'opponents_selecting', left }) }, 1000)
  const expire = setTimeout(() => { clearInterval(tick); phaseTimers.delete(code); finishRound(code, rm.autoOpponentsAndResolve(code)) }, rm.OPPONENT_SECONDS * 1000)
  phaseTimers.set(code, { tick, expire })
}

function finishRound(code, result) {
  if (!result || result.error) return
  clearPhase(code)
  io.to(code).emit('round_result', result.roundResult)
  emitState(code)
  const room = rm.getRoom(code)
  const ended = result.gameEnded || room.pendingEnd
  if (ended) {
    stopClock(code)
    const finalWinner = room.pendingEnd && !result.gameEnded ? rm.timerExpiry(code).winnerId : result.winnerId
    setTimeout(() => io.to(code).emit('game_ended', { winnerId: finalWinner, state: rm.publicState(room) }), REVEAL_MS)
  } else {
    setTimeout(() => { emitState(code); startActivePhase(code) }, REVEAL_MS)
  }
}

function startClock(code) {
  const room = rm.getRoom(code); if (!room) return
  let left = room.timeOption * 60
  const interval = setInterval(() => {
    left -= 1
    const r = rm.getRoom(code)
    if (!r || r.phase === 'ended') { clearInterval(interval); roomClocks.delete(code); return }
    io.to(code).emit('timer_tick', { left })
    if (left === 15) io.to(code).emit('last_round_warning')
    if (left <= 0) {
      clearInterval(interval); roomClocks.delete(code)
      const mid = r.phase === 'active_selecting' || r.phase === 'opponents_selecting'
      if (mid) { r.pendingEnd = true; io.to(code).emit('timer_tick', { left: 0 }) } // let the round finish
      else { const { winnerId } = rm.timerExpiry(code); io.to(code).emit('game_ended', { winnerId, state: rm.publicState(r) }) }
    }
  }, 1000)
  roomClocks.set(code, interval)
}
const stopClock = (code) => { const i = roomClocks.get(code); if (i) { clearInterval(i); roomClocks.delete(code) } }

const lobby = (room) => ({ code: room.code, hostId: room.hostId, timeOption: room.timeOption, deckType: room.deckType, phase: room.phase, players: room.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, connected: p.connected })) })

io.on('connection', (socket) => {
  socket.on('create_room', ({ player, timeOption, deckType }) => {
    const room = rm.createRoom({ ...player, socketId: socket.id }, timeOption, deckType)
    socket.join(room.code)
    socket.emit('room_created', { code: room.code, room: lobby(room), myId: player.id })
  })

  socket.on('join_room', ({ code, player }) => {
    const res = rm.joinRoom(code, { ...player, socketId: socket.id })
    if (res.error) return socket.emit('error_msg', { message: res.error })
    socket.join(code)
    const room = rm.getRoom(code)
    socket.emit('room_joined', { room: lobby(room), myId: player.id })
    io.to(code).emit('room_updated', { room: lobby(room) })
    if (res.rejoining && room.phase !== 'waiting') { emitState(code) }
  })

  socket.on('start_game', ({ code, playerId }) => {
    const room = rm.getRoom(code)
    if (!room || room.hostId !== playerId) return socket.emit('error_msg', { message: 'Only host can start' })
    const res = rm.startGame(code)
    if (res.error) return socket.emit('error_msg', { message: res.error })
    io.to(code).emit('game_started', rm.publicState(rm.getRoom(code)))
    emitState(code)
    startClock(code)
    startActivePhase(code)
  })

  socket.on('select_card_stat', ({ code, playerId, cardId, stat }) => {
    const res = rm.selectCardStat(code, playerId, cardId, stat)
    if (res.error) return socket.emit('error_msg', { message: res.error })
    enterOpponentPhase(code)
  })

  socket.on('select_opponent_card', ({ code, playerId, cardId }) => {
    const res = rm.selectOpponent(code, playerId, cardId)
    if (res.error) return socket.emit('error_msg', { message: res.error })
    io.to(code).emit('opponent_selected', { playerId })
    if (res.allSelected) finishRound(code, rm.resolve(code))
  })

  socket.on('leave_room', ({ code, playerId }) => {
    rm.leaveRoom(code, playerId); socket.leave(code)
    const room = rm.getRoom(code)
    if (room) io.to(code).emit('room_updated', { room: lobby(room) })
  })

  socket.on('rejoin_room', ({ code, playerId }) => {
    const room = rm.updateSocket(code, playerId, socket.id)
    if (!room) return
    socket.join(code)
    socket.emit('room_updated', { room: lobby(room) })
    if (room.phase !== 'waiting') emitState(code)
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log(`FootyTrump server on ${PORT}`))
```

- [ ] **Step 2: Boot check** — `node server/index.js` prints "FootyTrump server on 3001"; `curl http://localhost:3001/health` → `{"status":"ok"}`. Stop it.

- [ ] **Step 3: Commit** — `git commit -m "feat(server): socket.io events + 30s phase timers + room clock + last-round"`

---

### Task 6: Client socket layer + onlineStore

**Files:** Create `client/src/lib/socket.js`, `client/src/store/onlineStore.js`. Create `client/.env.example`.

- [ ] **Step 1: `client/src/lib/socket.js`**

```js
import { io } from 'socket.io-client'

const PRIMARY = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
let socket = null
export function getSocket() {
  if (!socket) socket = io(PRIMARY, { autoConnect: true, transports: ['polling', 'websocket'], reconnection: true, reconnectionAttempts: 10 })
  return socket
}
export function emit(event, data) {
  const s = getSocket()
  if (s.connected) s.emit(event, data)
  else s.once('connect', () => s.emit(event, data))
}
```

`client/.env.example`:
```
VITE_SERVER_URL=https://your-railway-service.up.railway.app
```

- [ ] **Step 2: `client/src/store/onlineStore.js`** (full code)

```js
import { create } from 'zustand'
import { getSocket, emit } from '../lib/socket.js'

export const useOnlineStore = create((set, get) => ({
  connected: false, code: null, myId: null, lobby: null, state: null, myHand: [],
  phase: null, phaseLeft: null, clockLeft: null, roundResult: null, error: null, finished: false, winnerId: null,
  bound: false,

  bind() {
    if (get().bound) return
    const s = getSocket()
    s.on('connect', () => set({ connected: true }))
    s.on('disconnect', () => set({ connected: false }))
    s.on('error_msg', ({ message }) => set({ error: message }))
    s.on('room_created', ({ code, room, myId }) => set({ code, myId, lobby: room }))
    s.on('room_joined', ({ room, myId }) => set({ code: room.code, myId, lobby: room }))
    s.on('room_updated', ({ room }) => set({ lobby: room }))
    s.on('game_started', (state) => set({ state, phase: state.phase, finished: false, roundResult: null }))
    s.on('game_state', (state) => set({ state }))
    s.on('your_hand', ({ hand }) => set({ myHand: hand }))
    s.on('phase_changed', ({ phase, seconds }) => set({ phase, phaseLeft: seconds }))
    s.on('phase_tick', ({ left }) => set({ phaseLeft: left }))
    s.on('timer_tick', ({ left }) => set({ clockLeft: left }))
    s.on('round_result', (rr) => set({ roundResult: rr }))
    s.on('game_ended', ({ winnerId, state }) => set({ finished: true, winnerId, state, roundResult: null }))
    set({ bound: true })
  },

  createRoom(player, timeOption, deckType) { get().bind(); emit('create_room', { player, timeOption, deckType }) },
  joinRoom(code, player) { get().bind(); emit('join_room', { code, player }) },
  startGame() { emit('start_game', { code: get().code, playerId: get().myId }) },
  pickActive(cardId, stat) { emit('select_card_stat', { code: get().code, playerId: get().myId, cardId, stat }) },
  pickDefend(cardId) { emit('select_opponent_card', { code: get().code, playerId: get().myId, cardId }) },
  leave() { emit('leave_room', { code: get().code, playerId: get().myId }) },
  clearError() { set({ error: null }) },
}))
```

- [ ] **Step 3: Install socket.io-client** — `npm install --prefix client socket.io-client@^4.8.1`.

- [ ] **Step 4: Commit** — `git commit -m "feat(client): socket layer + onlineStore"`

---

### Task 7: GameTimer + ShareModal + Lobby

**Files:** Create `client/src/components/game/GameTimer.jsx`, `client/src/components/lobby/ShareModal.jsx`, `client/src/pages/Lobby.jsx`.

- [ ] **Step 1: `GameTimer.jsx`**

```jsx
export default function GameTimer({ label, seconds }) {
  if (seconds == null) return null
  const m = Math.floor(seconds / 60), s = seconds % 60
  const low = seconds <= 10
  return (
    <span className={`font-display font-bold ${low ? 'text-red-400 animate-pulse' : 'text-white'}`}>
      {label} {m}:{String(s).padStart(2, '0')}
    </span>
  )
}
```

- [ ] **Step 2: `ShareModal.jsx`**

```jsx
import Modal from '../ui/Modal.jsx'

export default function ShareModal({ open, onClose, code }) {
  const url = `${window.location.origin}/online?room=${code}`
  const wa = `https://wa.me/?text=${encodeURIComponent(`Join my FootyTrump room ${code}: ${url}`)}`
  return (
    <Modal open={open} onClose={onClose} title="Invite friends">
      <div className="text-center">
        <div className="font-display text-3xl tracking-[0.3em] text-gold">{code}</div>
        <input readOnly value={url} className="w-full mt-3 rounded-lg bg-navy-deep px-3 py-2 text-sm" onFocus={e => e.target.select()} />
        <div className="flex gap-2 mt-3">
          <button onClick={() => navigator.clipboard?.writeText(url)} className="flex-1 bg-white/10 rounded-lg py-2 font-display">Copy link</button>
          <a href={wa} target="_blank" rel="noreferrer" className="flex-1 bg-pitch rounded-lg py-2 font-display text-center">WhatsApp</a>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 3: `Lobby.jsx`** (create/join, config, player list, start)

```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useOnlineStore } from '../store/onlineStore.js'
import { getIdentity, setName } from '../lib/identity.js'
import ShareModal from '../components/lobby/ShareModal.jsx'
import Button from '../components/ui/Button.jsx'

export default function Lobby() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const store = useOnlineStore()
  const [name, setNm] = useState(getIdentity().name)
  const [timeOption, setTime] = useState(6)
  const [joinCode, setJoinCode] = useState(params.get('room') || '')
  const [share, setShare] = useState(false)

  useEffect(() => { store.bind() }, [])
  useEffect(() => { if (store.state && !store.finished) nav('/online/game') }, [store.state, store.finished, nav])

  const me = () => { const id = setName(name); return { id: id.id, name: id.name, avatar: id.color } }
  const create = () => store.createRoom(me(), timeOption, 'international')
  const join = () => joinCode.trim() && store.joinRoom(joinCode.trim().toUpperCase(), me())

  const inRoom = !!store.lobby
  const isHost = store.lobby && store.myId === store.lobby.hostId

  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6">
      <div className="navy-card rounded-2xl p-6 w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-gold mb-3">Play Online</h1>
        {store.error && <div className="text-red-300 text-sm mb-2">{store.error} <button className="underline" onClick={store.clearError}>dismiss</button></div>}

        {!inRoom && (
          <>
            <label className="text-sm">Your name
              <input value={name} onChange={e => setNm(e.target.value)} className="w-full mt-1 rounded-lg bg-navy-deep px-3 py-2" />
            </label>
            <div className="mt-4 text-sm">Room time
              <div className="flex gap-2 mt-1">{[4, 6, 8].map(t => (
                <button key={t} onClick={() => setTime(t)} className={`flex-1 rounded-lg py-2 font-display ${timeOption === t ? 'bg-gold text-navy-deep' : 'bg-navy-deep'}`}>{t} min</button>
              ))}</div>
            </div>
            <Button onClick={create} className="w-full mt-4">Create room</Button>
            <div className="text-center text-slate-300 my-3 text-sm">or join with a code</div>
            <div className="flex gap-2">
              <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="ABC123" className="flex-1 rounded-lg bg-navy-deep px-3 py-2 uppercase" />
              <Button variant="secondary" onClick={join}>Join</Button>
            </div>
          </>
        )}

        {inRoom && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-200">Room <b className="text-gold tracking-widest">{store.lobby.code}</b> · {store.lobby.timeOption} min</span>
              <button onClick={() => setShare(true)} className="text-sm bg-white/10 rounded-lg px-3 py-1 font-display">Invite</button>
            </div>
            <ul className="mt-3">
              {store.lobby.players.map(p => (
                <li key={p.id} className="flex justify-between py-1.5 border-b border-white/10">
                  <span>{p.name}{p.id === store.lobby.hostId ? ' 👑' : ''}{p.id === store.myId ? ' (you)' : ''}</span>
                </li>
              ))}
            </ul>
            {isHost
              ? <Button onClick={store.startGame} disabled={store.lobby.players.length < 2} className="w-full mt-4">{store.lobby.players.length < 2 ? 'Waiting for players…' : 'Start game ⚽'}</Button>
              : <p className="text-center text-slate-300 mt-4 text-sm">Waiting for the host to start…</p>}
          </>
        )}
        <ShareModal open={share} onClose={() => setShare(false)} code={store.lobby?.code} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit** — `git commit -m "feat(client): GameTimer, ShareModal, Lobby"`

---

### Task 8: OnlineGame page + router/home wiring + e2e

**Files:** Create `client/src/pages/OnlineGame.jsx`. Modify `client/src/App.jsx`, `client/src/pages/Home.jsx`, `client/src/pages/Results.jsx`.

- [ ] **Step 1: `OnlineGame.jsx`** (reuses Plan A battle components)

```jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineStore } from '../store/onlineStore.js'
import PlayerCard from '../components/game/PlayerCard.jsx'
import OpponentStrip from '../components/game/OpponentStrip.jsx'
import RoundResultOverlay from '../components/game/RoundResultOverlay.jsx'
import GameTimer from '../components/game/GameTimer.jsx'
import { STAT_LABELS } from '../../../shared/engine/constants.js'

export default function OnlineGame() {
  const nav = useNavigate()
  const s = useOnlineStore()
  useEffect(() => { if (!s.state) nav('/online') }, [s.state, nav])
  useEffect(() => { if (s.finished) nav('/results') }, [s.finished, nav])
  if (!s.state) return null

  const st = s.state
  const iAmActive = st.activePlayerId === s.myId
  const defending = st.phase === 'opponents_selecting'
  const myPlayer = st.players.find(p => p.id === s.myId)
  // opponent strip wants {id,name,isActive,hand:[]} — adapt from public players (cardCount only)
  const stripPlayers = st.players.map(p => ({ id: p.id, name: p.name, isActive: p.isActive, hand: { length: p.cardCount } }))
  const attackStat = st.activeStat
  const iMustDefend = defending && !iAmActive && myPlayer?.cardCount > 0

  return (
    <div className="pitch-bg min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center text-sm">
          <span className="font-display">Round {st.currentRound + 1}</span>
          <div className="flex gap-3">
            <GameTimer label="⏱" seconds={s.clockLeft} />
            <GameTimer label="turn" seconds={s.phaseLeft} />
          </div>
        </div>
        <div className="mt-4"><OpponentStrip players={stripPlayers} activeId={st.activePlayerId} myId={s.myId} /></div>

        {defending && st.activeCard && (
          <div className="mt-5 flex flex-col items-center">
            <div className="navy-card rounded-xl px-4 py-2 mb-3 text-center">
              <span className="text-gold font-display font-bold">{iAmActive ? 'You attack' : 'Opponent attacks'} with {STAT_LABELS[attackStat]}</span>
              <span className="ml-2 text-white font-display font-bold text-lg">{st.activeCard.stats[attackStat]}</span>
            </div>
            <PlayerCard card={st.activeCard} selectedStat={attackStat} />
          </div>
        )}

        <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
          {s.myHand.map(card => (
            <div key={card.id} className="shrink-0">
              <PlayerCard card={card}
                selectable={iAmActive && st.phase === 'active_selecting'}
                selectedStat={defending && iMustDefend ? attackStat : null}
                onPickStat={(stat) => s.pickActive(card.id, stat)} />
              {iMustDefend && <button onClick={() => s.pickDefend(card.id)} className="mt-2 w-full text-xs font-display font-bold bg-gold text-navy-deep rounded-lg py-1.5">Play ({card.stats[attackStat]})</button>}
            </div>
          ))}
        </div>
      </div>
      <RoundResultOverlay result={s.roundResult} players={st.players} />
    </div>
  )
}
```

- [ ] **Step 2: Router + Home + Results wiring**

In `App.jsx` add:
```jsx
import Lobby from './pages/Lobby.jsx'
import OnlineGame from './pages/OnlineGame.jsx'
// <Route path="/online" element={<Lobby />} />
// <Route path="/online/game" element={<OnlineGame />} />
```
In `Home.jsx` replace the disabled "Online (coming soon)" span with `<Link to="/online" className="navy-card rounded-xl py-3 font-display font-bold">👥 Play Online</Link>`.
In `Results.jsx` make it read from whichever store finished: if `useOnlineStore.getState().finished`, show online standings (`state.players` sorted by score, `winnerId`); else solo. (Add a small branch; keep "Home" link.)

- [ ] **Step 3: e2e smoke test (two browser tabs)**

Run root dev with both server + client:
- `npm --prefix server run dev` (terminal 1) and `npm run --prefix client dev` (terminal 2), or add a root `dev:all` script with `concurrently`.
- Tab 1: Home → Play Online → Create room (6 min). Note code.
- Tab 2: open `/online?room=CODE` → Join.
- Tab 1 (host): Start. Verify: both see the board; the active player sees selectable stats; the timer counts down (turn + room clock); attacker's card shows for defenders; round resolves; play continues; the room clock ending finishes the current round then shows Results.

- [ ] **Step 4: Add root `dev:all` script** in root `package.json`:
```json
"dev:all": "concurrently -n server,client \"npm --prefix server run dev\" \"npm --prefix client run dev\""
```

- [ ] **Step 5: Commit** — `git commit -m "feat(client): online game page + router/home wiring; root dev:all"`

---

## Self-review
- **Spec coverage:** rooms/codes/share (Tasks 3,7) · 2–6 players (Task 3) · 4/6/8 clock (Tasks 3,5) · 30s+30s phases + auto-pick (Task 5) · dynamic rounds (emergent — Task 5 loop) · last-round completion via pendingEnd (Task 5) · reuse engine (Tasks 3-4) · Railway config (Task 2) · quizScore for Plan C (Task 1). 
- **Placeholders:** none — all code provided; Results edit is described with the exact branch.
- **Type consistency:** server emits `game_state`/`your_hand`/`phase_changed`/`phase_tick`/`timer_tick`/`round_result`/`game_ended`; onlineStore listens to exactly these; `publicState` fields (`activeCard`,`activeStat`,`activePlayerId`,`players[].cardCount`) match OnlineGame usage. `roundResult.cards` shape matches RoundResultOverlay (from engine).
