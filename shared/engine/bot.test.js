import { describe, it, expect } from 'vitest'
import { botPickActive, botPickOpponent } from './bot.js'
import { makeRng } from './random.js'

function game() {
  return {
    activePlayerIndex: 0,
    players: [
      { id: 'bot', isActive: true, hand: [
        { id: 1, stats: { matches: 100, goals: 5, assists: 2, tackles: 1, saves: 0, cleanSheets: 0 }, usedStats: [] },
        { id: 2, stats: { matches: 8, goals: 40, assists: 2, tackles: 1, saves: 0, cleanSheets: 0 }, usedStats: [] },
      ] },
      { id: 'human', isActive: true, hand: [
        { id: 9, stats: { goals: 12 }, usedStats: [] },
        { id: 10, stats: { goals: 30 }, usedStats: [] },
      ] },
    ],
  }
}

describe('bot', () => {
  it('medium picks the highest available stat value across its hand', () => {
    // matches 100 (card1) is the biggest raw value -> bot attacks with matches/card1
    const pick = botPickActive(game(), 'bot', 'medium')
    expect(pick).toEqual({ cardId: 1, stat: 'matches' })
  })
  it('skips burned stats when picking active', () => {
    const g = game()
    g.players[0].hand[0].usedStats = ['matches'] // burn the big one
    const pick = botPickActive(g, 'bot', 'medium')
    expect(pick).toEqual({ cardId: 2, stat: 'goals' }) // next best value 40
  })
  it('opponent picks its best card for the contested stat', () => {
    expect(botPickOpponent(game(), 'human', 'goals')).toEqual({ cardId: 10 })
  })
  it('easy returns a valid (cardId, stat) pair', () => {
    const pick = botPickActive(game(), 'bot', 'easy', makeRng(3))
    expect([1, 2]).toContain(pick.cardId)
    expect(Object.keys(pick)).toContain('stat')
  })
})
