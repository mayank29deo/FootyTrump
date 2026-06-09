# FootyTrump — Plan D: Multiplayer Quiz Rooms

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Let a room host run a **multiplayer quiz** (Guess the Footballer *or* Multiple Choice) for 2–6 friends in the same room system as the trump game, with everyone answering the same question and **speed-ranked scoring** (spec §8.4).

**Architecture:** Reuse the room lifecycle + Socket.io server. Rooms gain a `gameType` ('trump' | 'quiz') and `quizMode` ('guess' | 'mcq'). A new `server/quizManager.js` (TDD) holds quiz state + speed-rank scoring using the existing `quizScore` + `quizGame` helpers and quiz content. The client reuses the Lobby (adds a game-type selector) and adds one `OnlineQuiz` page; `onlineStore` gains quiz event handlers.

**Depends on:** Plan B (rooms/sockets/lobby), Plan C content (`quizClues`, `quizQuestions`) + helpers (`quizGame`, `quiz.quizScore`). Spec §8.

## Server quiz flow
host start → `quiz_started` + question 1 → per-question timer (MCQ 15s / Guess 35s) → players `submit_answer` (server stamps receipt time) → all answered or time up → score by speed → `question_result` (correct answer + per-player gained + leaderboard) → reveal pause → next question or `quiz_ended` (final standings).

## File structure
```
server/quizManager.js (+ .test.js)   # quiz state, recordAnswer, scoreQuestion, advance
server/roomManager.js                # + gameType/quizMode on createRoom
server/index.js                      # + quiz socket events & question timer
client/src/store/onlineStore.js      # + quiz handlers/actions
client/src/pages/Lobby.jsx           # + game-type selector (host)
client/src/pages/OnlineQuiz.jsx      # new — renders mcq/guess over sockets
client/src/App.jsx                   # + /online/quiz route
```

---

### Task 1: quizManager (TDD)

**Files:** `server/quizManager.js`, `server/quizManager.test.js`.

- [ ] **Step 1: Failing test**

```js
import { describe, it, expect } from 'vitest'
import * as qm from './quizManager.js'
import { makeRng } from '../shared/engine/random.js'

function room(players, mode = 'mcq') {
  const r = { players: players.map(id => ({ id, name: id })), quizMode: mode, quiz: null }
  qm.startQuiz(r, makeRng(1))
  return r
}

describe('quizManager', () => {
  it('startQuiz picks questions, zeroes scores, phase=question', () => {
    const r = room(['a', 'b'])
    expect(r.quiz.questions.length).toBeGreaterThan(0)
    expect(r.quiz.scores).toEqual({ a: 0, b: 0 })
    expect(r.quiz.phase).toBe('question')
  })
  it('questionPayload (mcq) exposes options but NOT the correct answer', () => {
    const r = room(['a', 'b'])
    const p = qm.questionPayload(r)
    expect(p.options).toHaveLength(4)
    expect(p.correctIndex).toBeUndefined()
    expect(p.answer).toBeUndefined()
  })
  it('scoreQuestion ranks correct answers by speed (10 then 6 for 2 players)', () => {
    const r = room(['a', 'b'])
    const correct = r.quiz.questions[0].correctIndex
    qm.recordAnswer(r, 'a', correct, 1000) // faster, correct
    qm.recordAnswer(r, 'b', correct, 2000) // slower, correct
    const res = qm.scoreQuestion(r)
    expect(res.gained.a).toBe(10)
    expect(res.gained.b).toBe(6)
    expect(r.quiz.scores).toEqual({ a: 10, b: 6 })
  })
  it('wrong / no answer scores 0', () => {
    const r = room(['a', 'b'])
    const wrong = (r.quiz.questions[0].correctIndex + 1) % 4
    qm.recordAnswer(r, 'a', wrong, 1000)
    const res = qm.scoreQuestion(r)
    expect(res.gained.a).toBe(0)
    expect(res.gained.b).toBe(0)
  })
  it('advance moves to next question or ends', () => {
    const r = room(['a', 'b'])
    for (let i = 0; i < r.quiz.questions.length; i++) qm.advance(r)
    expect(r.quiz.phase).toBe('ended')
  })
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```js
// server/quizManager.js
import { quizQuestions } from '../shared/data/quizQuestions.js'
import { quizClues } from '../shared/data/quizClues.js'
import { pick, buildLetterTiles, checkGuess } from '../shared/engine/quizGame.js'
import { quizScore } from '../shared/engine/quiz.js'

export const QUIZ_ROUND = 6
export const SECONDS = { mcq: 15, guess: 35 }

export function startQuiz(room, rng = Math.random) {
  const mode = room.quizMode === 'guess' ? 'guess' : 'mcq'
  const bank = mode === 'guess' ? quizClues : quizQuestions
  const questions = pick(bank, Math.min(QUIZ_ROUND, bank.length), rng)
  room.quiz = {
    mode, questions, idx: 0,
    answers: {},
    scores: Object.fromEntries(room.players.map(p => [p.id, 0])),
    phase: 'question',
    rng,
  }
  return room
}

function currentQ(room) { return room.quiz.questions[room.quiz.idx] }

export function questionPayload(room) {
  const q = currentQ(room), { mode, idx, questions } = room.quiz
  const base = { idx, total: questions.length, seconds: SECONDS[mode], mode }
  if (mode === 'mcq') return { ...base, q: q.q, options: q.options, category: q.category }
  // guess: tiles built server-side; answer NOT sent
  return { ...base, clues: q.clues, tiles: buildLetterTiles(q.answer, room.quiz.rng), blankCount: q.answer.replace(/[^A-Za-z]/g, '').length }
}

export function recordAnswer(room, playerId, value, atMs) {
  if (room.quiz.answers[playerId]) return
  const q = currentQ(room)
  const correct = room.quiz.mode === 'mcq' ? value === q.correctIndex : checkGuess(q.answer, value)
  room.quiz.answers[playerId] = { value, correct, atMs }
}

export function everyoneAnswered(room) {
  return room.players.every(p => room.quiz.answers[p.id])
}

export function scoreQuestion(room) {
  const playerCount = room.players.length
  const correct = Object.entries(room.quiz.answers)
    .filter(([, a]) => a.correct)
    .sort((a, b) => a[1].atMs - b[1].atMs)
    .map(([pid]) => pid)
  const gained = Object.fromEntries(room.players.map(p => [p.id, 0]))
  correct.forEach((pid, i) => { gained[pid] = quizScore(playerCount, i + 1) })
  for (const pid of Object.keys(gained)) room.quiz.scores[pid] += gained[pid]
  const q = currentQ(room)
  const answer = room.quiz.mode === 'mcq' ? q.options[q.correctIndex] : q.answer
  room.quiz.phase = 'reveal'
  return { gained, answer, scores: room.quiz.scores }
}

export function advance(room) {
  room.quiz.idx += 1
  room.quiz.answers = {}
  room.quiz.phase = room.quiz.idx >= room.quiz.questions.length ? 'ended' : 'question'
  return room.quiz.phase
}

export function leaderboard(room) {
  return room.players
    .map(p => ({ id: p.id, name: p.name, score: room.quiz.scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score)
}
```

- [ ] **Step 4: Run → PASS. Commit** `feat(server): quizManager — questions + speed-rank scoring (TDD)`

---

### Task 2: roomManager — gameType/quizMode

**Files:** `server/roomManager.js` (modify `createRoom`).

- [ ] Add params to `createRoom(host, timeOption, deckType, gameType = 'trump', quizMode = 'mcq')`; store `room.gameType = gameType === 'quiz' ? 'quiz' : 'trump'`, `room.quizMode = quizMode`. Add a test asserting defaults + quiz selection. Commit `feat(server): room gameType/quizMode`.

---

### Task 3: index.js — quiz socket events + timer

**Files:** `server/index.js` (extend).

- [ ] **Add quiz imports + state**

```js
import * as qm from './quizManager.js'
const quizTimers = new Map() // code -> {tick, expire}
const QUIZ_REVEAL_MS = 3500
const clearQuiz = (code) => { const t = quizTimers.get(code); if (t) { clearInterval(t.tick); clearTimeout(t.expire); quizTimers.delete(code) } }
```

- [ ] **`create_room`**: pass `gameType, quizMode` through to `rm.createRoom`. Add them to the `lobby()` payload.

- [ ] **`start_game`**: branch on `room.gameType`:

```js
if (room.gameType === 'quiz') {
  qm.startQuiz(room)
  io.to(code).emit('quiz_started', { mode: room.quiz.mode, players: room.players.map(p => ({ id: p.id, name: p.name })) })
  sendQuestion(code)
  return
}
// else existing trump start ...
```

- [ ] **Add quiz helpers + `submit_answer` handler**

```js
function sendQuestion(code) {
  clearQuiz(code)
  const room = rm.getRoom(code); if (!room?.quiz || room.quiz.phase !== 'question') return
  const payload = qm.questionPayload(room)
  io.to(code).emit('quiz_question', payload)
  let left = payload.seconds
  const tick = setInterval(() => { left -= 1; io.to(code).emit('quiz_tick', { left }) }, 1000)
  const expire = setTimeout(() => finishQuestion(code), payload.seconds * 1000)
  quizTimers.set(code, { tick, expire })
}
function finishQuestion(code) {
  clearQuiz(code)
  const room = rm.getRoom(code); if (!room?.quiz) return
  const result = qm.scoreQuestion(room)
  io.to(code).emit('quiz_result', { ...result, leaderboard: qm.leaderboard(room), correctAnswer: result.answer })
  setTimeout(() => {
    const phase = qm.advance(room)
    if (phase === 'ended') io.to(code).emit('quiz_ended', { leaderboard: qm.leaderboard(room) })
    else sendQuestion(code)
  }, QUIZ_REVEAL_MS)
}
// inside io.on('connection'):
socket.on('submit_answer', ({ code, playerId, value }) => {
  const room = rm.getRoom(code); if (!room?.quiz || room.quiz.phase !== 'question') return
  qm.recordAnswer(room, playerId, value, Date.now())
  io.to(code).emit('answer_received', { playerId })
  if (qm.everyoneAnswered(room)) finishQuestion(code)
})
```

- [ ] **Boot check** (`node server/index.js` + `/health`). Commit `feat(server): quiz socket events + per-question timer`.

---

### Task 4: Client — onlineStore quiz, Lobby selector, OnlineQuiz page

**Files:** `client/src/store/onlineStore.js`, `client/src/pages/Lobby.jsx`, `client/src/pages/OnlineQuiz.jsx`, `client/src/App.jsx`.

- [ ] **onlineStore**: add state `gameType, quizMode, quiz: { mode, question, tick, result, leaderboard, ended, answered }`; in `bind()` add listeners: `quiz_started`, `quiz_question` (set question, answered=false), `quiz_tick`, `answer_received`, `quiz_result`, `quiz_ended`. Add actions `createRoom(player, timeOption, deckType, gameType, quizMode)` (pass through) and `submitAnswer(value)` (emit `submit_answer`, set answered=true). On `room_created`/`room_joined`/`room_updated`, capture `room.gameType`/`room.quizMode`.

- [ ] **Lobby**: before creating, host picks a **game type**: Trump Cards / Quiz: Guess / Quiz: MCQ (three buttons). Pass `gameType` ('trump'|'quiz') + `quizMode` to `createRoom`. Show the chosen mode in the room header. On `quiz_started`, navigate to `/online/quiz`; trump still goes to `/online/game`. (Use a store flag: navigate when `quiz.question` or `state` appears.)

- [ ] **OnlineQuiz page**: render from `onlineStore.quiz`:
  - header: Q idx/total · ⏱ tick · live leaderboard (names + scores).
  - **mcq**: question + 4 option buttons → `submitAnswer(i)`; after answered, disable; on `result`, highlight correct + show per-player gained.
  - **guess**: clues + blanks (blankCount) + letter `tiles` (tap to fill, backspace) + Submit → `submitAnswer(assembledString)`; on `result`, show `correctAnswer`.
  - on `quiz_ended`, show final leaderboard + Home.

- [ ] **App.jsx**: add `<Route path="/online/quiz" element={<OnlineQuiz />} />`.

- [ ] Commit `feat(client): multiplayer quiz — lobby selector + OnlineQuiz`.

---

### Task 5: Verify + finish
- [ ] `npm test` green. `npm run --prefix client build` ok.
- [ ] **Socket e2e** (throwaway): two clients create a quiz(mcq) room, join, start; both receive `quiz_question`; both `submit_answer`; expect `quiz_result` with gained 10/6 and a leaderboard; play through to `quiz_ended`.
- [ ] Browser: Lobby → pick Quiz: MCQ → create → (2nd tab join) → start → answer → see result + leaderboard.
- [ ] Merge to main, tag `v0.4.0-quiz-online`, push.

## Self-review
- Spec §8 multiplayer: room owner picks mode (Lobby) ✓ · same question to all + speed scoring via `quizScore` (quizManager.scoreQuestion) ✓ · 2:10/6 … 6:10/8/6/4/2/0 (quizScore table) ✓ · both guess + mcq ✓. No answer leaked pre-reveal (questionPayload omits correctIndex/answer; guess tiles sent without the word). Event names consistent server↔store: `quiz_started/quiz_question/quiz_tick/answer_received/quiz_result/quiz_ended` + `submit_answer`.
