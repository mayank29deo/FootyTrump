import { STATS } from './constants.js'
import { shuffle } from './random.js'
import { freshCard, calcHandScore } from './cards.js'

const clone = (game) => structuredClone(game)

export function cardsPerPlayer(deckSize, playerCount) {
  const target = playerCount <= 2 ? 24 : 14
  return Math.max(4, Math.min(target, Math.floor(deckSize / playerCount)))
}

export function dealHands(deck, playerCount, rng = Math.random) {
  const seen = new Set()
  const unique = shuffle(deck, rng).filter(c => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
  const per = cardsPerPlayer(unique.length, playerCount)
  const hands = []
  for (let i = 0; i < playerCount; i++) {
    hands.push(unique.slice(i * per, (i + 1) * per).map(freshCard))
  }
  const neutralPile = unique.slice(playerCount * per).map(freshCard)
  return { hands, neutralPile, per }
}

export function createGame({ players, deck, deckType = 'international', rng = Math.random }) {
  const { hands, neutralPile } = dealHands(deck, players.length, rng)
  const gamePlayers = players.map((p, i) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar ?? null,
    isBot: !!p.isBot,
    hand: hands[i],
    score: calcHandScore(hands[i]),
    isActive: true,
  }))
  return {
    players: gamePlayers,
    deckType,
    phase: 'active_selecting',
    currentRound: 0,
    activePlayerIndex: 0,
    activeCardId: null,
    activeStat: null,
    opponentSelections: {},
    neutralPile,
    winnerId: null,
  }
}

export function selectCardAndStat(game, playerId, cardId, stat) {
  if (game.phase !== 'active_selecting') return { error: 'Not in card-selection phase' }
  const active = game.players[game.activePlayerIndex]
  if (!active || active.id !== playerId) return { error: 'Not your turn' }
  if (!STATS.includes(stat)) return { error: 'Invalid stat' }
  const card = active.hand.find(c => c.id === cardId)
  if (!card) return { error: 'Card not in your hand' }
  if (card.usedStats?.includes(stat)) return { error: `${stat} already used on this card` }

  const next = clone(game)
  next.activeCardId = cardId
  next.activeStat = stat
  next.opponentSelections = {}
  next.phase = 'opponents_selecting'
  return { game: next }
}

export function selectOpponentCard(game, playerId, cardId) {
  if (game.phase !== 'opponents_selecting') return { error: 'Not in opponent-selection phase' }
  const active = game.players[game.activePlayerIndex]
  if (active.id === playerId) return { error: 'Active player cannot select an opponent card' }
  const player = game.players.find(p => p.id === playerId && p.isActive && p.hand.length > 0)
  if (!player) return { error: 'Player not in play' }
  if (game.opponentSelections[playerId]) return { error: 'Already selected this round' }
  const card = player.hand.find(c => c.id === cardId)
  if (!card) return { error: 'Card not in your hand' }

  const next = clone(game)
  next.opponentSelections[playerId] = { cardId }
  const opponents = next.players.filter(p => p.isActive && p.hand.length > 0 && p.id !== active.id)
  const allSelected = opponents.every(p => next.opponentSelections[p.id])
  return { game: next, allSelected }
}

function topByScore(players) {
  let best = null, max = -1
  for (const p of players) if (p.score > max) { max = p.score; best = p.id }
  return best
}

function nextActiveIndex(game) {
  let idx = (game.activePlayerIndex + 1) % game.players.length
  let attempts = 0
  while ((!game.players[idx].isActive || game.players[idx].hand.length === 0) && attempts < game.players.length) {
    idx = (idx + 1) % game.players.length
    attempts++
  }
  return idx
}

export function resolveRound(game) {
  const next = clone(game)
  const active = next.players[next.activePlayerIndex]
  const stat = next.activeStat
  const activeCard = active.hand.find(c => c.id === next.activeCardId)
  if (!activeCard || !stat) return { error: 'No active card/stat' }

  const played = {} // pid -> { card, value }
  played[active.id] = { card: activeCard, value: activeCard.stats[stat] ?? 0 }
  for (const [pid, sel] of Object.entries(next.opponentSelections)) {
    const p = next.players.find(x => x.id === pid)
    const card = p?.hand.find(c => c.id === sel.cardId)
    if (card) played[pid] = { card, value: card.stats[stat] ?? 0 }
  }

  // remove played cards from their owners' hands
  for (const [pid, { card }] of Object.entries(played)) {
    const p = next.players.find(x => x.id === pid)
    p.hand = p.hand.filter(c => c.id !== card.id)
  }

  const target = Math.max(...Object.values(played).map(x => x.value))
  const winners = Object.entries(played).filter(([, x]) => x.value === target).map(([pid]) => pid)
  const playedCards = Object.values(played).map(x => x.card)
  const burn = (c) => ({ ...c, usedStats: c.usedStats?.includes(stat) ? c.usedStats : [...(c.usedStats || []), stat] })

  let winnerId = null
  if (winners.length === 1) {
    winnerId = winners[0]
    const winner = next.players.find(p => p.id === winnerId)
    winner.hand.push(...playedCards.map(burn))
    if (next.neutralPile.length) {
      winner.hand.push(...next.neutralPile.map(freshCard))
      next.neutralPile = []
    }
  } else {
    next.neutralPile.push(...playedCards.map(burn))
  }

  for (const p of next.players) {
    p.score = calcHandScore(p.hand)
    if (p.hand.length === 0) p.isActive = false
  }

  next.currentRound += 1
  const stillIn = next.players.filter(p => p.isActive && p.hand.length > 0)

  let gameEnded = false
  if (stillIn.length <= 1) {
    gameEnded = true
    next.phase = 'ended'
    next.winnerId = stillIn[0]?.id ?? topByScore(next.players)
  } else {
    next.activePlayerIndex = winnerId
      ? next.players.findIndex(p => p.id === winnerId)
      : nextActiveIndex(next)
    next.phase = 'active_selecting'
  }
  next.activeCardId = null
  next.activeStat = null
  next.opponentSelections = {}

  return {
    game: next,
    roundResult: {
      stat,
      winnerId,
      isTie: winners.length > 1,
      cards: Object.fromEntries(Object.entries(played).map(([pid, x]) => [pid, { card: x.card, value: x.value }])),
      currentRound: next.currentRound,
    },
    gameEnded,
    winnerId: next.winnerId,
  }
}

export function endByTimer(game) {
  const next = clone(game)
  next.phase = 'ended'
  next.winnerId = topByScore(next.players)
  return { game: next, winnerId: next.winnerId }
}
