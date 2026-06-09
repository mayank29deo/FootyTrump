import { describe, it, expect } from 'vitest'
import { quizQuestions } from './quizQuestions.js'

describe('quizQuestions', () => {
  it('has >= 30 MCQs, each 4 options with a valid correctIndex', () => {
    expect(quizQuestions.length).toBeGreaterThanOrEqual(30)
    const ids = new Set()
    for (const q of quizQuestions) {
      expect(q.options).toHaveLength(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
      expect(q.q.length).toBeGreaterThan(8)
      ids.add(q.id)
    }
    expect(ids.size).toBe(quizQuestions.length)
  })
})
