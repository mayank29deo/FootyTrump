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
