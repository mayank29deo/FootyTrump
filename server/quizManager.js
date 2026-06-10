import { quizQuestions } from '../shared/data/quizQuestions.js'
import { quizClues } from '../shared/data/quizClues.js'
import { pick, checkGuess, initialReveals, hintOrder, guessRoomScore } from '../shared/engine/quizGame.js'
import { quizScore } from '../shared/engine/quiz.js'

export const SECONDS = { mcq: 20, guess: 30 }
export const MAX_HINTS = 3

export function startQuiz(room, rng = Math.random) {
  const mode = room.quizMode === 'guess' ? 'guess' : 'mcq'
  const bank = mode === 'guess' ? quizClues : quizQuestions
  // Shuffle the whole bank — the room clock (not a fixed count) decides how many
  // questions get asked; we just need enough to fill the chosen 4/6/8 minutes.
  const questions = pick(bank, bank.length, rng)
  room.quiz = {
    mode, questions, idx: 0,
    answers: {},
    hints: {},     // pid -> letter hints used this question
    reveal: null,  // { preRevealed:[], order:[] } for the current guess question
    scores: Object.fromEntries(room.players.map(p => [p.id, 0])),
    phase: 'question',
    pendingEnd: false,
    paused: false,   // true during the reveal buffer — freezes the room clock
    clockLeft: 0,
    rng,
  }
  prepareQuestion(room)
  return room
}

function currentQ(room) { return room.quiz.questions[room.quiz.idx] }

// reset per-question state; precompute reveal data for guess questions
function prepareQuestion(room) {
  room.quiz.answers = {}
  room.quiz.hints = {}
  if (room.quiz.mode === 'guess') {
    const ans = currentQ(room).answer
    const preRevealed = initialReveals(ans, room.quiz.rng)
    room.quiz.reveal = { preRevealed, order: hintOrder(ans, preRevealed) }
  } else {
    room.quiz.reveal = null
  }
}

export function questionPayload(room) {
  const q = currentQ(room)
  const { mode, idx, questions } = room.quiz
  const base = { idx, total: questions.length, seconds: SECONDS[mode], mode }
  if (mode === 'mcq') return { ...base, q: q.q, options: q.options, category: q.category }
  // guess: a mask exposes structure + pre-revealed letters only (hidden letters + the
  // full answer are never sent — players type, and the hint bulb reveals letters server-side)
  const ans = q.answer
  const pre = new Set(room.quiz.reveal.preRevealed)
  const mask = ans.split('').map((ch, i) => {
    if (!/[A-Za-z]/.test(ch)) return { ch, fixed: true }
    return pre.has(i) ? { ch: ch.toUpperCase(), revealed: true } : { revealed: false }
  })
  const maxHints = Math.min(MAX_HINTS, room.quiz.reveal.order.length)
  return { ...base, clues: q.clues, mask, maxHints }
}

export function recordAnswer(room, playerId, value, atMs) {
  if (room.quiz.answers[playerId]) return
  const q = currentQ(room)
  const correct = room.quiz.mode === 'mcq' ? value === q.correctIndex : checkGuess(q.answer, value)
  room.quiz.answers[playerId] = { value, correct, atMs }
}

// Reveal the next letter for a player (guess only). Returns { index, ch } or null.
export function useHint(room, playerId) {
  if (room.quiz.mode !== 'guess' || room.quiz.answers[playerId]) return null
  const used = room.quiz.hints[playerId] || 0
  if (used >= MAX_HINTS || used >= room.quiz.reveal.order.length) return null
  room.quiz.hints[playerId] = used + 1
  const index = room.quiz.reveal.order[used]
  return { index, ch: currentQ(room).answer[index].toUpperCase() }
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
  correct.forEach((pid, i) => {
    const rank = i + 1
    gained[pid] = room.quiz.mode === 'guess'
      ? guessRoomScore(rank, room.quiz.hints[pid] || 0)
      : quizScore(playerCount, rank)
  })
  for (const pid of Object.keys(gained)) room.quiz.scores[pid] += gained[pid]
  const q = currentQ(room)
  const answer = room.quiz.mode === 'mcq' ? q.options[q.correctIndex] : q.answer
  // each player's own submission (value as typed / option index, + correct flag) for the reveal screen
  const answers = Object.fromEntries(Object.entries(room.quiz.answers).map(([pid, a]) => [pid, { value: a.value, correct: a.correct }]))
  room.quiz.phase = 'reveal'
  return { gained, answer, answers, scores: room.quiz.scores }
}

export function advance(room) {
  room.quiz.idx += 1
  if (room.quiz.idx >= room.quiz.questions.length) { room.quiz.phase = 'ended'; return 'ended' }
  room.quiz.phase = 'question'
  prepareQuestion(room)
  return 'question'
}

export function leaderboard(room) {
  return room.players
    .map(p => ({ id: p.id, name: p.name, score: room.quiz.scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score)
}
