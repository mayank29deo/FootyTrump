import { describe, it, expect } from 'vitest'
import { resolveRound } from './game.js'

function game() {
  return {
    players: [
      { id: 'a', isActive: true, score: 0, hand: [{ id: 1, points: 100, stats: { goals: 10 }, usedStats: [] }] },
      { id: 'b', isActive: true, score: 0, hand: [{ id: 2, points: 25, stats: { goals: 4 }, usedStats: [] }] },
    ],
    phase: 'opponents_selecting', activePlayerIndex: 0,
    activeCardId: 1, activeStat: 'goals',
    opponentSelections: { b: { cardId: 2 } }, neutralPile: [], currentRound: 0,
  }
}

describe('resolveRound — single winner', () => {
  it('awards both played cards to the higher stat value', () => {
    const { game: g, roundResult, gameEnded } = resolveRound(game())
    const a = g.players.find(p => p.id === 'a')
    const b = g.players.find(p => p.id === 'b')
    expect(roundResult.winnerId).toBe('a')
    expect(roundResult.isTie).toBe(false)
    expect(a.hand.map(c => c.id).sort()).toEqual([1, 2])
    expect(b.hand).toHaveLength(0)
    expect(gameEnded).toBe(true) // b is out of cards
  })
  it('burns the contested stat on the won cards', () => {
    const { game: g } = resolveRound(game())
    const a = g.players.find(p => p.id === 'a')
    expect(a.hand.every(c => c.usedStats.includes('goals'))).toBe(true)
  })
  it('hands the neutral pile to the winner (reset fresh)', () => {
    const g0 = game()
    g0.neutralPile = [{ id: 99, points: 50, stats: { goals: 0 }, usedStats: ['goals'] }]
    const { game: g } = resolveRound(g0)
    const a = g.players.find(p => p.id === 'a')
    const neutral = a.hand.find(c => c.id === 99)
    expect(neutral).toBeTruthy()
    expect(neutral.usedStats).toEqual([]) // freshCard reset
    expect(g.neutralPile).toHaveLength(0)
  })
})
