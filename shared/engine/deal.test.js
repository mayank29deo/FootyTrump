import { describe, it, expect } from 'vitest'
import { cardsPerPlayer, dealHands } from './game.js'
import { makeRng } from './random.js'

// minimal fake deck of N cards
const deck = (n) => Array.from({ length: n }, (_, i) => ({
  id: i + 1, name: `P${i + 1}`, rarity: 'common', points: 25,
  stats: { matches: i, goals: i, assists: i, tackles: i, saves: i, cleanSheets: i },
}))

describe('dealHands', () => {
  it('cardsPerPlayer: 24 for 2 players, 14 for >2, capped by deck size', () => {
    expect(cardsPerPlayer(54, 2)).toBe(24)
    expect(cardsPerPlayer(54, 3)).toBe(14)
    expect(cardsPerPlayer(54, 6)).toBe(9) // floor(54/6)=9 < 14
  })
  it('deals equal hands and puts the remainder in the neutral pile', () => {
    const { hands, neutralPile } = dealHands(deck(54), 2, makeRng(1))
    expect(hands).toHaveLength(2)
    expect(hands[0]).toHaveLength(24)
    expect(hands[1]).toHaveLength(24)
    expect(neutralPile).toHaveLength(54 - 48)
  })
  it('every dealt card is fresh (usedStats: [])', () => {
    const { hands } = dealHands(deck(54), 3, makeRng(1))
    expect(hands[0][0].usedStats).toEqual([])
  })
  it('no card id appears in two hands', () => {
    const { hands } = dealHands(deck(54), 3, makeRng(2))
    const ids = hands.flat().map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
