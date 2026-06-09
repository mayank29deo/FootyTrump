import { STATS } from './constants.js'

function validCombos(player) {
  const out = []
  for (const card of player.hand) {
    for (const stat of STATS) {
      if (card.usedStats?.includes(stat)) continue
      out.push({ cardId: card.id, stat, value: card.stats[stat] ?? 0 })
    }
  }
  return out
}

export function botPickActive(game, playerId, difficulty = 'medium', rng = Math.random) {
  const player = game.players.find(p => p.id === playerId)
  const combos = validCombos(player)
  if (combos.length === 0) {
    const card = player.hand[0]
    return { cardId: card.id, stat: STATS[0] }
  }
  if (difficulty === 'easy') {
    const pick = combos[Math.floor(rng() * combos.length)]
    return { cardId: pick.cardId, stat: pick.stat }
  }
  // medium / hard: greedy max raw value
  const best = combos.reduce((a, b) => (b.value > a.value ? b : a))
  return { cardId: best.cardId, stat: best.stat }
}

export function botPickOpponent(game, playerId, stat) {
  const player = game.players.find(p => p.id === playerId)
  let best = null
  for (const card of player.hand) {
    const value = card.stats[stat] ?? 0
    if (!best || value > best.value) best = { cardId: card.id, value }
  }
  return { cardId: best.cardId }
}
