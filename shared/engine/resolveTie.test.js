import { describe, it, expect } from 'vitest'
import { resolveRound, endByTimer } from './game.js'

function threeWayGame() {
  return {
    players: [
      { id: 'a', isActive: true, score: 0, hand: [{ id: 1, points: 50, stats: { goals: 8 }, usedStats: [] }, { id: 4, points: 50, stats: { goals: 1 }, usedStats: [] }] },
      { id: 'b', isActive: true, score: 0, hand: [{ id: 2, points: 25, stats: { goals: 8 }, usedStats: [] }, { id: 5, points: 25, stats: { goals: 1 }, usedStats: [] }] },
      { id: 'c', isActive: true, score: 0, hand: [{ id: 3, points: 25, stats: { goals: 3 }, usedStats: [] }, { id: 6, points: 25, stats: { goals: 1 }, usedStats: [] }] },
    ],
    phase: 'opponents_selecting', activePlayerIndex: 0,
    activeCardId: 1, activeStat: 'goals',
    opponentSelections: { b: { cardId: 2 }, c: { cardId: 3 } }, neutralPile: [], currentRound: 0,
  }
}

describe('resolveRound — tie', () => {
  it('sends played cards to the neutral pile and rotates to the next player', () => {
    const { game: g, roundResult, gameEnded } = resolveRound(threeWayGame())
    expect(roundResult.isTie).toBe(true)
    expect(roundResult.winnerId).toBeNull()
    expect(g.neutralPile.map(c => c.id).sort()).toEqual([1, 2, 3])
    expect(g.neutralPile.every(c => c.usedStats.includes('goals'))).toBe(true)
    expect(gameEnded).toBe(false)
    expect(g.activePlayerIndex).toBe(1) // rotated from a -> b
  })
})

describe('endByTimer', () => {
  it('ends the game and picks the highest hand score', () => {
    const g = {
      players: [
        { id: 'a', score: 300, hand: [], isActive: true },
        { id: 'b', score: 500, hand: [], isActive: true },
      ],
      phase: 'active_selecting',
    }
    const { game: ended, winnerId } = endByTimer(g)
    expect(ended.phase).toBe('ended')
    expect(winnerId).toBe('b')
  })
})
