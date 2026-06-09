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
  const q = currentQ(room)
  const { mode, idx, questions } = room.quiz
  const base = { idx, total: questions.length, seconds: SECONDS[mode], mode }
  if (mode === 'mcq') return { ...base, q: q.q, options: q.options, category: q.category }
  // guess: tiles built server-side; the answer is NOT sent (no cheating)
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
