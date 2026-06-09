import { playersInternational } from '../data/players.international.js'

export const DECKS = { international: playersInternational }

export function getDeck(deckType = 'international') {
  return DECKS[deckType] ?? playersInternational
}
