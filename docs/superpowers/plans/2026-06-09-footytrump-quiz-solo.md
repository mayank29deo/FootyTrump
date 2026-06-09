# FootyTrump — Plan C: Quiz (Solo)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Add a playable **solo quiz** with two modes — *Guess the Footballer* (3 hints → letter-tile "bingo" fill) and *Multiple Choice* — scored with streaks and a localStorage best-score board.

**Architecture:** Pure quiz logic + content in `shared` (TDD); a Zustand `quizStore` orchestrates a solo run; React pages render the two modes in the existing pitch/navy-gold theme. The multiplayer quiz (Plan D) will reuse this content + logic over the room/socket layer.

**Depends on:** Plan A theme/components, `shared/engine/quiz.js` (quizScore already built). Spec §8.

## File structure
```
shared/data/quizClues.js        # Guess-the-Footballer entries (+ .test.js)
shared/data/quizQuestions.js    # MCQ bank (+ .test.js)
shared/engine/quizGame.js       # pure helpers: tiles, check, pick, scoring (+ .test.js)
client/src/store/quizStore.js   # Zustand solo run + localStorage best
client/src/pages/QuizHome.jsx   # pick a mode
client/src/pages/GuessFootballer.jsx
client/src/pages/QuizMcq.jsx
client/src/pages/QuizResults.jsx
```

---

### Task 1: quizGame engine helpers (TDD)

**Files:** `shared/engine/quizGame.js`, `shared/engine/quizGame.test.js`.

- [ ] **Step 1: Failing test**

```js
import { describe, it, expect } from 'vitest'
import { normalize, checkGuess, buildLetterTiles, pick, guessScore, mcqScore } from './quizGame.js'
import { makeRng } from './random.js'

describe('quizGame', () => {
  it('normalize strips case/spaces/punctuation', () => {
    expect(normalize('De Bruyne!')).toBe('DEBRUYNE')
  })
  it('checkGuess is case/space-insensitive', () => {
    expect(checkGuess('Messi', 'messi')).toBe(true)
    expect(checkGuess('Messi', 'mesi')).toBe(false)
  })
  it('buildLetterTiles contains every answer letter and is padded + shuffled deterministically', () => {
    const tiles = buildLetterTiles('MESSI', makeRng(1), 12)
    expect(tiles.length).toBeGreaterThanOrEqual(12)
    for (const ch of 'MESSI') {
      const need = 'MESSI'.split('').filter(c => c === ch).length
      expect(tiles.filter(t => t === ch).length).toBeGreaterThanOrEqual(need)
    }
    expect(buildLetterTiles('MESSI', makeRng(1), 12)).toEqual(tiles) // reproducible
  })
  it('pick returns n distinct items', () => {
    expect(pick([1,2,3,4,5], 3, makeRng(2))).toHaveLength(3)
  })
  it('guessScore drops with hints + wrong tries, scaled by streak, never below 0', () => {
    expect(guessScore({ hintsUsed: 0, wrongTries: 0, streak: 0 })).toBe(300)
    expect(guessScore({ hintsUsed: 2, wrongTries: 1, streak: 0 })).toBe(300 - 160 - 40)
    expect(guessScore({ hintsUsed: 0, wrongTries: 0, streak: 5 })).toBe(450) // x1.5
    expect(guessScore({ hintsUsed: 9, wrongTries: 9, streak: 0 })).toBe(0)
  })
  it('mcqScore rewards speed + streak', () => {
    expect(mcqScore({ timeLeft: 10, totalTime: 10, streak: 0 })).toBe(200) // 100 base + 100 speed
    expect(mcqScore({ timeLeft: 0, totalTime: 10, streak: 0 })).toBe(100)
    expect(mcqScore({ timeLeft: 10, totalTime: 10, streak: 2 })).toBe(240) // +2*20
  })
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```js
// shared/engine/quizGame.js
import { shuffle } from './random.js'

export const GUESS_BASE = 300, HINT_PENALTY = 80, WRONG_PENALTY = 40
export const MCQ_BASE = 100, MCQ_SPEED = 100, MCQ_STREAK = 20

export const normalize = (s) => (s || '').toUpperCase().replace(/[^A-Z]/g, '')
export const checkGuess = (answer, guess) => normalize(answer) === normalize(guess)

export function buildLetterTiles(answer, rng = Math.random, minTiles = 12) {
  const letters = normalize(answer).split('')
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const tiles = [...letters]
  while (tiles.length < Math.max(minTiles, letters.length)) tiles.push(ALPHA[Math.floor(rng() * 26)])
  return shuffle(tiles, rng)
}

export function pick(arr, n, rng = Math.random) {
  return shuffle(arr, rng).slice(0, n)
}

const streakMult = (streak) => 1 + Math.min(streak, 5) * 0.1

export function guessScore({ hintsUsed = 0, wrongTries = 0, streak = 0 }) {
  const raw = GUESS_BASE - hintsUsed * HINT_PENALTY - wrongTries * WRONG_PENALTY
  return Math.max(0, Math.round(Math.max(0, raw) * streakMult(streak)))
}

export function mcqScore({ timeLeft = 0, totalTime = 10, streak = 0 }) {
  const speed = Math.round(MCQ_SPEED * Math.max(0, timeLeft) / totalTime)
  return MCQ_BASE + speed + streak * MCQ_STREAK
}
```

- [ ] **Step 4: Run → PASS. Step 5: Commit** `feat(engine): quiz solo helpers (tiles, check, scoring)`

---

### Task 2: Quiz content — clues + MCQ bank (validated)

**Files:** `shared/data/quizClues.js` (+ test), `shared/data/quizQuestions.js` (+ test).

- [ ] **Step 1: Validation tests**

```js
// shared/data/quizClues.test.js
import { describe, it, expect } from 'vitest'
import { quizClues } from './quizClues.js'
describe('quizClues', () => {
  it('has >= 18 entries, each with a surname answer + exactly 3 clues', () => {
    expect(quizClues.length).toBeGreaterThanOrEqual(18)
    const ids = new Set()
    for (const e of quizClues) {
      expect(e.answer).toMatch(/[A-Za-z]/)
      expect(e.clues).toHaveLength(3)
      e.clues.forEach(c => expect(c.length).toBeGreaterThan(8))
      ids.add(e.id)
    }
    expect(ids.size).toBe(quizClues.length)
  })
})
```
```js
// shared/data/quizQuestions.test.js
import { describe, it, expect } from 'vitest'
import { quizQuestions } from './quizQuestions.js'
describe('quizQuestions', () => {
  it('has >= 30 MCQs, each 4 options with a valid correctIndex', () => {
    expect(quizQuestions.length).toBeGreaterThanOrEqual(30)
    for (const q of quizQuestions) {
      expect(q.options).toHaveLength(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
      expect(q.q.length).toBeGreaterThan(8)
    }
  })
})
```

- [ ] **Step 2: Author the data until tests pass.** `quizClues`: `{ id, answer, clues:[3] }` (answer = the surname to guess). `quizQuestions`: `{ id, q, options:[4], correctIndex, category }`. Mix World Cup facts, records, the 2022 final, and roster-based facts.

- [ ] **Step 3: Run → PASS. Commit** `feat(data): quiz clues + MCQ bank`

---

### Task 3: quizStore (Zustand, solo)

**Files:** `client/src/store/quizStore.js`.

Holds a solo run for either mode; persists best scores to localStorage. Full code:

```js
import { create } from 'zustand'
import { quizClues } from '../../../shared/data/quizClues.js'
import { quizQuestions } from '../../../shared/data/quizQuestions.js'
import { buildLetterTiles, checkGuess, pick, guessScore, mcqScore } from '../../../shared/engine/quizGame.js'

const BEST_KEY = 'footytrump.quizBest'
const ROUND = 8
const MCQ_TIME = 12
const readBest = () => { try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} } }
const writeBest = (mode, score) => {
  const best = readBest(); if (!(best[mode] >= score)) { best[mode] = score; localStorage.setItem(BEST_KEY, JSON.stringify(best)) }
  return best
}

export const useQuizStore = create((set, get) => ({
  mode: null, queue: [], idx: 0, score: 0, streak: 0, finished: false, best: readBest(),
  // guess state
  current: null, tiles: [], filled: [], hintsUsed: 1, wrongTries: 0, revealed: false,
  // mcq state
  picked: null, mcqDeadline: 0, timeLeft: MCQ_TIME,

  startGuess() {
    const queue = pick(quizClues, Math.min(ROUND, quizClues.length))
    set({ mode: 'guess', queue, idx: 0, score: 0, streak: 0, finished: false })
    get()._loadGuess()
  },
  startMcq() {
    const queue = pick(quizQuestions, Math.min(ROUND, quizQuestions.length))
    set({ mode: 'mcq', queue, idx: 0, score: 0, streak: 0, finished: false })
    get()._loadMcq()
  },

  _loadGuess() {
    const c = get().queue[get().idx]
    set({ current: c, tiles: buildLetterTiles(c.answer), filled: [], hintsUsed: 1, wrongTries: 0, revealed: false })
  },
  tapTile(i) {
    const { filled, tiles, current } = get()
    if (filled.length >= current.answer.replace(/[^A-Za-z]/g, '').length) return
    set({ filled: [...filled, { i, ch: tiles[i] }] })
  },
  backspace() { set({ filled: get().filled.slice(0, -1) }) },
  useHint() { if (get().hintsUsed < 3) set({ hintsUsed: get().hintsUsed + 1 }) },
  submitGuess() {
    const { filled, current, hintsUsed, wrongTries, streak, score } = get()
    const guess = filled.map(f => f.ch).join('')
    if (checkGuess(current.answer, guess)) {
      const gained = guessScore({ hintsUsed: hintsUsed - 1, wrongTries, streak })
      set({ score: score + gained, streak: streak + 1, revealed: true })
      setTimeout(() => get()._next(), 1400)
    } else {
      set({ wrongTries: wrongTries + 1, streak: 0, filled: [] })
    }
  },

  _loadMcq() { set({ current: get().queue[get().idx], picked: null, timeLeft: MCQ_TIME }) },
  tick() {
    const t = get().timeLeft - 1
    if (t <= 0 && get().picked == null) { set({ timeLeft: 0 }); get().answerMcq(-1) }
    else set({ timeLeft: Math.max(0, t) })
  },
  answerMcq(choice) {
    if (get().picked != null) return
    const { current, timeLeft, streak, score } = get()
    const correct = choice === current.correctIndex
    set({ picked: choice, score: correct ? score + mcqScore({ timeLeft, totalTime: MCQ_TIME, streak }) : score, streak: correct ? streak + 1 : 0 })
    setTimeout(() => get()._next(), 1500)
  },

  _next() {
    const idx = get().idx + 1
    if (idx >= get().queue.length) { const best = writeBest(get().mode, get().score); set({ finished: true, best }); return }
    set({ idx })
    get().mode === 'guess' ? get()._loadGuess() : get()._loadMcq()
  },
  reset() { set({ mode: null, finished: false }) },
}))
```

- [ ] **Commit** `feat(client): quizStore solo orchestration`

---

### Task 4: Pages — QuizHome, GuessFootballer, QuizMcq, QuizResults + wiring

**Files:** the 4 pages; modify `App.jsx`, `Home.jsx`.

- [ ] **QuizHome.jsx** — two big buttons (Guess the Footballer / Multiple Choice) that call `startGuess`/`startMcq` then nav to the mode; show best scores.
- [ ] **GuessFootballer.jsx** — render `current.clues` (only first `hintsUsed` shown; a locked row with a "Reveal hint (−)" button), blanks (count = answer letters), tappable `tiles`, backspace, Submit; show ✓ on `revealed`; streak/score header.
- [ ] **QuizMcq.jsx** — `current.q`, 4 option buttons (highlight correct/wrong after `picked`), a `useEffect` interval calling `tick()` each second, score/streak/timeLeft header.
- [ ] **QuizResults.jsx** — final score + best for the mode + Play again / Home.
- [ ] **Router:** add `/quiz`, `/quiz/guess`, `/quiz/mcq`, `/quiz/results`. **Home:** replace the "Quiz (coming soon)" span with `<Link to="/quiz">🧠 Quiz</Link>`.
- [ ] **Commit** `feat(client): quiz pages (guess + mcq) + routing`

---

### Task 5: Verify + finish
- [ ] `npm test` green (engine + data). `npm run --prefix client build` succeeds.
- [ ] Browser smoke test: Home → Quiz → Guess (reveal a hint, tap tiles, submit) and MCQ (answer, watch timer + streak) → Results.
- [ ] Merge to main, tag `v0.3.0-quiz`, push.

## Self-review
- Spec §8.1 guess (hints/tiles/score) → Tasks 1,3,4. §8.2 MCQ (bank + timer + streak) → Tasks 2,3,4. §8.3 localStorage best → Task 3. quizScore for multiplayer already in `shared/engine/quiz.js` (Plan D will consume). No placeholders; content gated by validation tests. Names consistent: `startGuess/startMcq/tapTile/submitGuess/answerMcq/tick` used across store + pages.
