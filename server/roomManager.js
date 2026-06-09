import { createGame, selectCardAndStat, selectOpponentCard, resolveRound, endByTimer } from '../shared/engine/game.js'
import { botPickActive, botPickOpponent } from '../shared/engine/bot.js'
import { getDeck } from '../shared/engine/decks.js'

export const ACTIVE_SECONDS = 30
export const OPPONENT_SECONDS = 30
const VALID_TIMES = [4, 6, 8]

const rooms = new Map()
export function _reset() { rooms.clear() }          // test helper
export function getRoom(code) { return rooms.get(code) || null }

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code
  do { code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') }
  while (rooms.has(code))
  return code
}

export function createRoom(host, timeOption, deckType = 'international') {
  const code = generateRoomCode()
  const room = {
    code,
    hostId: host.id,
    players: [{ id: host.id, name: host.name, avatar: host.avatar ?? null, socketId: host.socketId, connected: true }],
    timeOption: VALID_TIMES.includes(timeOption) ? timeOption : 6,
    deckType,
    phase: 'waiting',
    game: null,
    pendingEnd: false,
    createdAt: Date.now(),
  }
  rooms.set(code, room)
  return room
}

export function joinRoom(code, player) {
  const room = rooms.get(code)
  if (!room) return { error: 'Room not found' }
  const existing = room.players.find(p => p.id === player.id)
  if (existing) { existing.socketId = player.socketId; existing.connected = true; return { room, rejoining: true } }
  if (room.phase !== 'waiting') return { error: 'Game already in progress' }
  if (room.players.length >= 6) return { error: 'Room is full' }
  room.players.push({ id: player.id, name: player.name, avatar: player.avatar ?? null, socketId: player.socketId, connected: true })
  return { room }
}

export function leaveRoom(code, playerId) {
  const room = rooms.get(code)
  if (!room) return null
  room.players = room.players.filter(p => p.id !== playerId)
  if (room.players.length === 0) { rooms.delete(code); return { deleted: true } }
  if (room.hostId === playerId) room.hostId = room.players[0].id
  return { room }
}

export function updateSocket(code, playerId, socketId) {
  const room = rooms.get(code)
  const p = room?.players.find(x => x.id === playerId)
  if (p) { p.socketId = socketId; p.connected = true }
  return room
}

export function startGame(code) {
  const room = rooms.get(code)
  if (!room) return { error: 'Room not found' }
  if (room.players.length < 2) return { error: 'Need at least 2 players' }
  room.game = createGame({
    players: room.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
    deck: getDeck(room.deckType),
    deckType: room.deckType,
  })
  room.phase = 'active_selecting'
  room.pendingEnd = false
  return { room }
}

export function selectCardStat(code, playerId, cardId, stat) {
  const room = rooms.get(code)
  if (!room?.game) return { error: 'No game' }
  const res = selectCardAndStat(room.game, playerId, cardId, stat)
  if (res.error) return res
  room.game = res.game; room.phase = res.game.phase
  return { room }
}

export function selectOpponent(code, playerId, cardId) {
  const room = rooms.get(code)
  if (!room?.game) return { error: 'No game' }
  const res = selectOpponentCard(room.game, playerId, cardId)
  if (res.error) return res
  room.game = res.game
  return { room, allSelected: res.allSelected }
}

export function resolve(code) {
  const room = rooms.get(code)
  const res = resolveRound(room.game)
  if (res.error) return res
  room.game = res.game; room.phase = res.game.phase
  return { room, roundResult: res.roundResult, gameEnded: res.gameEnded, winnerId: res.winnerId }
}

export function autoActive(code) {
  const room = rooms.get(code)
  const activeId = room.game.players[room.game.activePlayerIndex].id
  const pick = botPickActive(room.game, activeId, 'medium')
  return selectCardStat(code, activeId, pick.cardId, pick.stat)
}

export function autoOpponentsAndResolve(code) {
  const room = rooms.get(code)
  const active = room.game.players[room.game.activePlayerIndex]
  const pending = room.game.players.filter(p => p.isActive && p.hand.length > 0 && p.id !== active.id && !room.game.opponentSelections[p.id])
  for (const opp of pending) {
    const pick = botPickOpponent(room.game, opp.id, room.game.activeStat)
    const res = selectOpponentCard(room.game, opp.id, pick.cardId)
    room.game = res.game
  }
  return resolve(code)
}

export function timerExpiry(code) {
  const room = rooms.get(code)
  if (!room?.game) return { error: 'No game' }
  const res = endByTimer(room.game)
  room.game = res.game; room.phase = 'ended'
  return { room, winnerId: res.winnerId }
}

// Public room snapshot (no private hands). Per-player hands are sent separately.
export function publicState(room) {
  const g = room.game
  return {
    code: room.code, hostId: room.hostId, timeOption: room.timeOption, deckType: room.deckType, phase: room.phase,
    players: room.players.map(p => {
      const gp = g?.players.find(x => x.id === p.id)
      return { id: p.id, name: p.name, avatar: p.avatar, connected: p.connected, cardCount: gp?.hand.length ?? 0, score: gp?.score ?? 0, isActive: gp?.isActive ?? true }
    }),
    currentRound: g?.currentRound ?? 0,
    activePlayerId: g ? g.players[g.activePlayerIndex]?.id : null,
    activeStat: g?.activeStat ?? null,
    activeCard: g?.activeStat ? g.players[g.activePlayerIndex]?.hand.find(c => c.id === g.activeCardId) ?? null : null,
    neutralPileCount: g?.neutralPile.length ?? 0,
    winnerId: g?.winnerId ?? null,
  }
}
