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
