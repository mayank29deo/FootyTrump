import { create } from 'zustand'
import { quizClues } from '../../../shared/data/quizClues.js'
import { quizQuestions } from '../../../shared/data/quizQuestions.js'
import { checkGuess, pick, guessScore, mcqScore, initialReveals, hintOrder } from '../../../shared/engine/quizGame.js'

const BEST_KEY = 'footytrump.quizBest'
const ROUND = 8
const MCQ_TIME = 12
const MAX_HINTS = 3

const readBest = () => { try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} } }
const writeBest = (mode, score) => {
  const best = readBest()
  if (!(best[mode] >= score)) { best[mode] = score; localStorage.setItem(BEST_KEY, JSON.stringify(best)) }
  return best
}

export const useQuizStore = create((set, get) => ({
  mode: null, queue: [], idx: 0, score: 0, streak: 0, finished: false, best: readBest(),
  // guess state
  current: null, revealedIdx: [], hintOrderArr: [], hintsUsed: 0, wrongTries: 0, typed: '', solved: false,
  // mcq state
  picked: null, timeLeft: MCQ_TIME, mcqEndsAt: 0,

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

  // ── Guess the Footballer (type + letter hints) ──
  _loadGuess() {
    const c = get().queue[get().idx]
    const pre = initialReveals(c.answer)
    set({ current: c, revealedIdx: [...pre], hintOrderArr: hintOrder(c.answer, pre), hintsUsed: 0, wrongTries: 0, typed: '', solved: false })
  },
  setTyped(v) { set({ typed: v }) },
  useHint() {
    const { hintsUsed, hintOrderArr, revealedIdx, solved } = get()
    if (solved || hintsUsed >= MAX_HINTS || hintsUsed >= hintOrderArr.length) return
    set({ revealedIdx: [...revealedIdx, hintOrderArr[hintsUsed]], hintsUsed: hintsUsed + 1 })
  },
  submitGuess() {
    const { typed, current, hintsUsed, wrongTries, streak, score } = get()
    if (!typed.trim()) return
    if (checkGuess(current.answer, typed)) {
      const gained = guessScore({ hintsUsed, wrongTries, streak })
      set({ score: score + gained, streak: streak + 1, solved: true })
      setTimeout(() => get()._next(), 1500)
    } else {
      set({ wrongTries: wrongTries + 1, streak: 0, typed: '' })
    }
  },

  // ── Multiple Choice (wall-clock countdown, immune to duplicate intervals) ──
  _loadMcq() { set({ current: get().queue[get().idx], picked: null, timeLeft: MCQ_TIME, mcqEndsAt: Date.now() + MCQ_TIME * 1000 }) },
  tick() {
    const { current, finished, picked, mcqEndsAt } = get()
    if (!current || finished || picked != null) return
    const t = Math.max(0, Math.ceil((mcqEndsAt - Date.now()) / 1000))
    set({ timeLeft: t })
    if (t <= 0) get().answerMcq(-1)
  },
  answerMcq(choice) {
    if (get().picked != null) return
    const { current, mcqEndsAt, streak, score } = get()
    const remaining = Math.max(0, Math.ceil((mcqEndsAt - Date.now()) / 1000))
    const correct = choice === current.correctIndex
    set({
      picked: choice,
      timeLeft: remaining,
      score: correct ? score + mcqScore({ timeLeft: remaining, totalTime: MCQ_TIME, streak }) : score,
      streak: correct ? streak + 1 : 0,
    })
    setTimeout(() => get()._next(), 1600)
  },

  _next() {
    const idx = get().idx + 1
    if (idx >= get().queue.length) { const best = writeBest(get().mode, get().score); set({ finished: true, best }); return }
    set({ idx })
    if (get().mode === 'guess') get()._loadGuess(); else get()._loadMcq()
  },
  reset() { set({ mode: null, finished: false, current: null }) },
}))
