import { describe, it, expect } from 'vitest'
import { playersInternational } from './players.international.js'
import { STATS } from '../engine/constants.js'

const RARITIES = ['legendary', 'epic', 'rare', 'common']
const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

describe('international roster', () => {
  it('has at least 50 players', () => {
    expect(playersInternational.length).toBeGreaterThanOrEqual(50)
  })
  it('has unique numeric ids', () => {
    const ids = playersInternational.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every(id => Number.isInteger(id))).toBe(true)
  })
  it('every player has the required fields and all six stats', () => {
    for (const p of playersInternational) {
      expect(p.name).toBeTypeOf('string')
      expect(p.country).toBeTypeOf('string')
      expect(p.countryCode).toMatch(/^[A-Z]{2}$/)
      expect(POSITIONS).toContain(p.position)
      expect(RARITIES).toContain(p.rarity)
      for (const stat of STATS) expect(p.stats[stat]).toBeTypeOf('number')
    }
  })
  it('includes at least 8 goalkeepers', () => {
    expect(playersInternational.filter(p => p.position === 'GK').length).toBeGreaterThanOrEqual(8)
  })
  it('goalkeepers have meaningful saves; outfielders have ~0 saves', () => {
    for (const p of playersInternational) {
      if (p.position === 'GK') expect(p.stats.saves).toBeGreaterThan(50)
      else expect(p.stats.saves).toBeLessThanOrEqual(5)
    }
  })
})
