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
    expect(pick([1, 2, 3, 4, 5], 3, makeRng(2))).toHaveLength(3)
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
