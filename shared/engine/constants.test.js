import { describe, it, expect } from 'vitest'
import { STATS, STAT_LABELS, STAT_MAX, RARITY_POINTS } from './constants.js'

describe('constants', () => {
  it('defines the six football stats in order', () => {
    expect(STATS).toEqual(['matches', 'goals', 'assists', 'tackles', 'saves', 'cleanSheets'])
  })
  it('has a label and a max for every stat', () => {
    for (const s of STATS) {
      expect(STAT_LABELS[s]).toBeTypeOf('string')
      expect(STAT_MAX[s]).toBeGreaterThan(0)
    }
  })
  it('maps every rarity to points', () => {
    expect(RARITY_POINTS).toEqual({ legendary: 100, epic: 75, rare: 50, common: 25 })
  })
})
