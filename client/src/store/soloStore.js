import { create } from 'zustand'
import { createGame, selectCardAndStat, selectOpponentCard, resolveRound } from '../../../shared/engine/game.js'
import { botPickActive, botPickOpponent } from '../../../shared/engine/bot.js'
import { getDeck } from '../../../shared/engine/decks.js'

const BOT_DELAY = 900
const REVEAL_MS = 2600
const wait = (ms) => new Promise(r => setTimeout(r, ms))

export const useSoloStore = create((set, get) => ({
  game: null,
  myId: 'me',
  difficulty: 'medium',
  selectedStat: null,
  roundResult: null,
  busy: false,
  finished: false,

  start({ humanName = 'You', botCount = 1, difficulty = 'medium', deckType = 'international' }) {
    const players = [{ id: 'me', name: humanName, isBot: false }]
    for (let i = 0; i < botCount; i++) players.push({ id: `bot${i + 1}`, name: `CPU ${i + 1}`, isBot: true })
    const game = createGame({ players, deck: getDeck(deckType), deckType })
    set({ game, difficulty, selectedStat: null, roundResult: null, finished: false, busy: false })
    get()._maybeBotActive()
  },

  // human (active) picks a stat on a chosen card
  pickActiveStat(cardId, stat) {
    const { game } = get()
    if (!game || game.phase !== 'active_selecting') return
    const res = selectCardAndStat(game, 'me', cardId, stat)
    if (res.error) return
    set({ game: res.game, selectedStat: stat })
    get()._runOpponents()
  },

  // human (as an opponent) picks a card to defend with
  pickOpponentCard(cardId) {
    const { game } = get()
    if (!game || game.phase !== 'opponents_selecting') return
    const res = selectOpponentCard(game, 'me', cardId)
    if (res.error) return
    set({ game: res.game })
    if (res.allSelected) get()._resolve()
    else get()._runOpponents()
  },

  // ── internal orchestration ──────────────────────────────
  async _maybeBotActive() {
    const { game, difficulty } = get()
    if (!game || game.phase !== 'active_selecting') return
    const active = game.players[game.activePlayerIndex]
    if (!active.isBot) return // wait for human
    set({ busy: true })
    await wait(BOT_DELAY)
    const pick = botPickActive(get().game, active.id, difficulty)
    const res = selectCardAndStat(get().game, active.id, pick.cardId, pick.stat)
    set({ game: res.game, selectedStat: pick.stat, busy: false })
    get()._runOpponents()
  },

  async _runOpponents() {
    const { game } = get()
    if (!game || game.phase !== 'opponents_selecting') return
    const active = game.players[game.activePlayerIndex]
    const pending = game.players.filter(p => p.isActive && p.hand.length > 0 && p.id !== active.id && !game.opponentSelections[p.id])
    const humanPending = pending.find(p => p.id === 'me')
    if (humanPending) return // wait for human to defend
    set({ busy: true })
    for (const bot of pending) {
      await wait(BOT_DELAY)
      const pick = botPickOpponent(get().game, bot.id, get().game.activeStat)
      const res = selectOpponentCard(get().game, bot.id, pick.cardId)
      set({ game: res.game })
      if (res.allSelected) { set({ busy: false }); return get()._resolve() }
    }
    set({ busy: false })
  },

  async _resolve() {
    const res = resolveRound(get().game)
    set({ roundResult: res.roundResult, game: res.game, busy: true })
    await wait(REVEAL_MS)
    set({ roundResult: null, selectedStat: null, busy: false })
    if (res.gameEnded) { set({ finished: true }); return }
    get()._maybeBotActive()
  },
}))
