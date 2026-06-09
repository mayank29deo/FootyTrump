import { RARITY_POINTS } from './constants.js'

export function freshCard(card) {
  return { ...card, usedStats: [] }
}

export function cardPoints(card) {
  return card.points ?? RARITY_POINTS[card.rarity] ?? 25
}

export function calcHandScore(hand) {
  return hand.reduce((sum, c) => sum + cardPoints(c), 0)
}
