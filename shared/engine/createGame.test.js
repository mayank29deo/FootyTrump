import { describe, it, expect } from 'vitest'
import { createGame } from './game.js'
import { makeRng } from './random.js'

const deck = (n) => Array.from({ length: n }, (_, i) => ({
  id: i + 1, name: `P${i + 1}`, rarity: 'common', points: 25,
  stats: { matches: i, goals: i, assists: i, tackles: i, saves: i, cleanSheets: i },
}))

describe('createGame', () => {
  it('initialises players, hands, scores and phase', () => {
    const g = createGame({
      players: [{ id: 'a', name: 'Ana' }, { id: 'b', name: 'Ben' }],
      deck: deck(54), rng: makeRng(1),
    })
    expect(g.phase).toBe('active_selecting')
    expect(g.players).toHaveLength(2)
    expect(g.players[0].hand.length).toBeGreaterThan(0)
    expect(g.players[0].score).toBe(g.players[0].hand.length * 25)
    expect(g.activePlayerIndex).toBe(0)
    expect(g.currentRound).toBe(0)
    expect(g.winnerId).toBeNull()
    expect(g.deckType).toBe('international')
  })
})
