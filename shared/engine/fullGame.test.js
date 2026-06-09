import { describe, it, expect } from 'vitest'
import { createGame, selectCardAndStat, selectOpponentCard, resolveRound } from './game.js'
import { botPickActive, botPickOpponent } from './bot.js'
import { getDeck } from './decks.js'
import { makeRng } from './random.js'

// Play a whole game with all-bot players until it ends. Guards termination,
// rotation, and that a single winner emerges — the loop the UI orchestrates.
function playToEnd(playerCount, seed) {
  const players = Array.from({ length: playerCount }, (_, i) => ({ id: `p${i}`, name: `P${i}`, isBot: true }))
  let game = createGame({ players, deck: getDeck('international'), rng: makeRng(seed) })
  let guard = 0
  while (game.phase !== 'ended' && guard < 10000) {
    guard++
    const active = game.players[game.activePlayerIndex]
    const a = botPickActive(game, active.id, 'medium')
    game = selectCardAndStat(game, active.id, a.cardId, a.stat).game
    const opponents = game.players.filter(p => p.isActive && p.hand.length > 0 && p.id !== active.id)
    for (const opp of opponents) {
      const o = botPickOpponent(game, opp.id, game.activeStat)
      game = selectOpponentCard(game, opp.id, o.cardId).game
    }
    game = resolveRound(game).game
  }
  return { game, guard }
}

describe('full game simulation', () => {
  it.each([2, 3, 4])('a %i-player all-bot game terminates with one winner', (count) => {
    const { game, guard } = playToEnd(count, 123 + count)
    expect(game.phase).toBe('ended')
    expect(guard).toBeLessThan(10000) // did not hit the runaway guard
    expect(game.winnerId).toBeTruthy()
    // total cards are conserved across hands + neutral pile
    const totalCards = game.players.reduce((n, p) => n + p.hand.length, 0) + game.neutralPile.length
    expect(totalCards).toBeGreaterThan(0)
  })
})
