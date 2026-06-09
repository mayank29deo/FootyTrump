import { describe, it, expect } from 'vitest'
import { selectCardAndStat } from './game.js'

function baseGame() {
  return {
    players: [
      { id: 'a', name: 'A', isActive: true, hand: [
        { id: 1, stats: { goals: 10 }, usedStats: [] },
        { id: 2, stats: { goals: 5 }, usedStats: ['goals'] },
      ] },
      { id: 'b', name: 'B', isActive: true, hand: [{ id: 9, stats: { goals: 3 }, usedStats: [] }] },
    ],
    phase: 'active_selecting', activePlayerIndex: 0,
    activeCardId: null, activeStat: null, opponentSelections: {}, neutralPile: [],
  }
}

describe('selectCardAndStat', () => {
  it('moves to opponents_selecting on a valid pick', () => {
    const { game, error } = selectCardAndStat(baseGame(), 'a', 1, 'goals')
    expect(error).toBeUndefined()
    expect(game.phase).toBe('opponents_selecting')
    expect(game.activeCardId).toBe(1)
    expect(game.activeStat).toBe('goals')
  })
  it('rejects when it is not the player\'s turn', () => {
    expect(selectCardAndStat(baseGame(), 'b', 9, 'goals').error).toMatch(/turn/i)
  })
  it('rejects an unknown stat', () => {
    expect(selectCardAndStat(baseGame(), 'a', 1, 'nope').error).toMatch(/stat/i)
  })
  it('rejects a stat already burned on that card', () => {
    expect(selectCardAndStat(baseGame(), 'a', 2, 'goals').error).toMatch(/used/i)
  })
  it('does not mutate the input game', () => {
    const g = baseGame()
    selectCardAndStat(g, 'a', 1, 'goals')
    expect(g.phase).toBe('active_selecting')
  })
})
