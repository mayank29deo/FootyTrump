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
