import { create } from 'zustand'
import { getSocket, emit } from '../lib/socket.js'

export const useOnlineStore = create((set, get) => ({
  connected: false, code: null, myId: null, lobby: null, state: null, myHand: [],
  phase: null, phaseLeft: null, clockLeft: null, roundResult: null, error: null, finished: false, winnerId: null,
  bound: false,

  bind() {
    if (get().bound) return
    const s = getSocket()
    s.on('connect', () => set({ connected: true }))
    s.on('disconnect', () => set({ connected: false }))
    s.on('error_msg', ({ message }) => set({ error: message }))
    s.on('room_created', ({ code, room, myId }) => set({ code, myId, lobby: room }))
    s.on('room_joined', ({ room, myId }) => set({ code: room.code, myId, lobby: room }))
    s.on('room_updated', ({ room }) => set({ lobby: room }))
    s.on('game_started', (state) => set({ state, phase: state.phase, finished: false, roundResult: null }))
    s.on('game_state', (state) => set({ state }))
    s.on('your_hand', ({ hand }) => set({ myHand: hand }))
    s.on('phase_changed', ({ phase, seconds }) => set({ phase, phaseLeft: seconds }))
    s.on('phase_tick', ({ left }) => set({ phaseLeft: left }))
    s.on('timer_tick', ({ left }) => set({ clockLeft: left }))
    s.on('round_result', (rr) => set({ roundResult: rr }))
    s.on('game_ended', ({ winnerId, state }) => set({ finished: true, winnerId, state, roundResult: null }))
    set({ bound: true })
  },

  createRoom(player, timeOption, deckType) { get().bind(); emit('create_room', { player, timeOption, deckType }) },
  joinRoom(code, player) { get().bind(); emit('join_room', { code, player }) },
  startGame() { emit('start_game', { code: get().code, playerId: get().myId }) },
  pickActive(cardId, stat) { emit('select_card_stat', { code: get().code, playerId: get().myId, cardId, stat }) },
  pickDefend(cardId) { emit('select_opponent_card', { code: get().code, playerId: get().myId, cardId }) },
  leave() { emit('leave_room', { code: get().code, playerId: get().myId }) },
  clearError() { set({ error: null }) },
}))
