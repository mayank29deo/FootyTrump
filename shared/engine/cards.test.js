import { describe, it, expect } from 'vitest'
import { freshCard, cardPoints, calcHandScore } from './cards.js'

const card = (over = {}) => ({ id: 1, rarity: 'epic', points: 75, stats: {}, ...over })

describe('cards', () => {
  it('freshCard adds an empty usedStats and does not mutate the source', () => {
    const c = card()
    const f = freshCard(c)
    expect(f.usedStats).toEqual([])
    expect(c.usedStats).toBeUndefined()
  })
  it('cardPoints uses the card points, falling back to rarity', () => {
    expect(cardPoints(card({ points: 75 }))).toBe(75)
    expect(cardPoints(card({ points: undefined, rarity: 'legendary' }))).toBe(100)
    expect(cardPoints(card({ points: undefined, rarity: 'unknown' }))).toBe(25)
  })
  it('calcHandScore sums points across a hand', () => {
    expect(calcHandScore([card({ points: 100 }), card({ points: 50 })])).toBe(150)
    expect(calcHandScore([])).toBe(0)
  })
})
