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

// indices of letter characters in the answer (skips spaces/punctuation)
export function letterIndices(answer) {
  const out = []
  for (let i = 0; i < answer.length; i++) if (/[A-Za-z]/.test(answer[i])) out.push(i)
  return out
}

// ~30% of the letters (at least 1) revealed from the start, e.g. RONALDO -> _ _ N _ _ D _
export function initialReveals(answer, rng = Math.random) {
  const idx = letterIndices(answer)
  const count = Math.max(1, Math.floor(idx.length * 0.3))
  return shuffle(idx, rng).slice(0, count).sort((a, b) => a - b)
}

// the remaining hidden letter positions, left-to-right — the order the hint bulb fills them
export function hintOrder(answer, preRevealed) {
  const set = new Set(preRevealed)
  return letterIndices(answer).filter(i => !set.has(i))
}

// Multiplayer guess scoring: base by speed rank (10,8,6,4,2,0) minus hints used.
export function guessRoomScore(rank, hints = 0) {
  if (!rank || rank < 1) return 0
  const base = Math.max(0, 10 - 2 * (rank - 1))
  return Math.max(0, base - hints)
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
