import { describe, it, expect } from 'vitest'
import { selectOpponentCard } from './game.js'

function game() {
  return {
    players: [
      { id: 'a', isActive: true, hand: [{ id: 1, stats: { goals: 10 }, usedStats: [] }] },
      { id: 'b', isActive: true, hand: [{ id: 2, stats: { goals: 4 }, usedStats: [] }] },
      { id: 'c', isActive: true, hand: [{ id: 3, stats: { goals: 7 }, usedStats: [] }] },
    ],
    phase: 'opponents_selecting', activePlayerIndex: 0,
    activeCardId: 1, activeStat: 'goals', opponentSelections: {}, neutralPile: [],
  }
}

describe('selectOpponentCard', () => {
  it('records a selection and reports allSelected=false until everyone picks', () => {
    const r1 = selectOpponentCard(game(), 'b', 2)
    expect(r1.error).toBeUndefined()
    expect(r1.allSelected).toBe(false)
    expect(r1.game.opponentSelections.b).toEqual({ cardId: 2 })
  })
  it('reports allSelected=true once all opponents have chosen', () => {
    let g = game()
    g = selectOpponentCard(g, 'b', 2).game
    const r = selectOpponentCard(g, 'c', 3)
    expect(r.allSelected).toBe(true)
  })
  it('blocks the active player from selecting', () => {
    expect(selectOpponentCard(game(), 'a', 1).error).toMatch(/active/i)
  })
  it('blocks double selection', () => {
    let g = selectOpponentCard(game(), 'b', 2).game
    expect(selectOpponentCard(g, 'b', 2).error).toMatch(/already/i)
  })
})
