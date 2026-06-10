import { create } from 'zustand'
import { getSocket, emit } from '../lib/socket.js'

export const useOnlineStore = create((set, get) => ({
  connected: false, code: null, myId: null, lobby: null, state: null, myHand: [],
  phase: null, phaseLeft: null, clockLeft: null, roundResult: null, error: null, finished: false, winnerId: null,
  gameType: 'trump', quizMode: 'mcq',
  quiz: { mode: null, question: null, tick: null, clock: null, result: null, leaderboard: [], ended: false, answered: false, revealed: [], hintsLeft: null },
  bound: false,

  bind() {
    if (get().bound) return
    const s = getSocket()
    s.on('connect', () => set({ connected: true }))
    s.on('disconnect', () => set({ connected: false }))
    s.on('error_msg', ({ message }) => set({ error: message }))
    s.on('room_created', ({ code, room, myId }) => set({ code, myId, lobby: room, gameType: room.gameType, quizMode: room.quizMode }))
    s.on('room_joined', ({ room, myId }) => set({ code: room.code, myId, lobby: room, gameType: room.gameType, quizMode: room.quizMode }))
    s.on('room_updated', ({ room }) => set({ lobby: room, gameType: room.gameType, quizMode: room.quizMode }))
    s.on('game_started', (state) => set({ state, phase: state.phase, finished: false, roundResult: null }))
    s.on('game_state', (state) => set({ state }))
    s.on('your_hand', ({ hand }) => set({ myHand: hand }))
    s.on('phase_changed', ({ phase, seconds }) => set({ phase, phaseLeft: seconds }))
    s.on('phase_tick', ({ left }) => set({ phaseLeft: left }))
    s.on('timer_tick', ({ left }) => set({ clockLeft: left }))
    s.on('round_result', (rr) => set({ roundResult: rr }))
    s.on('game_ended', ({ winnerId, state }) => set({ finished: true, winnerId, state, roundResult: null }))
    // ── quiz events ──
    s.on('quiz_started', ({ mode }) => set({ quiz: { mode, question: null, tick: null, clock: null, result: null, leaderboard: [], ended: false, answered: false, revealed: [], hintsLeft: null } }))
    s.on('quiz_question', (q) => set({ quiz: { ...get().quiz, question: q, tick: q.seconds, result: null, answered: false, revealed: [], hintsLeft: q.maxHints ?? null } }))
    s.on('quiz_tick', ({ left }) => set({ quiz: { ...get().quiz, tick: left } }))
    s.on('quiz_clock', ({ left }) => set({ quiz: { ...get().quiz, clock: left } }))
    s.on('answer_received', () => {})
    s.on('quiz_hint_letter', ({ index, ch, hintsLeft }) => set({ quiz: { ...get().quiz, revealed: [...get().quiz.revealed, { index, ch }], hintsLeft } }))
    s.on('quiz_result', ({ gained, correctAnswer, answers, leaderboard }) => set({ quiz: { ...get().quiz, result: { gained, correctAnswer, answers }, leaderboard } }))
    s.on('quiz_ended', ({ leaderboard }) => set({ quiz: { ...get().quiz, ended: true, leaderboard } }))
    set({ bound: true })
  },

  createRoom(player, timeOption, deckType, gameType = 'trump', quizMode = 'mcq') { get().bind(); emit('create_room', { player, timeOption, deckType, gameType, quizMode }) },
  joinRoom(code, player) { get().bind(); emit('join_room', { code, player }) },
  startGame() { emit('start_game', { code: get().code, playerId: get().myId }) },
  pickActive(cardId, stat) { emit('select_card_stat', { code: get().code, playerId: get().myId, cardId, stat }) },
  pickDefend(cardId) { emit('select_opponent_card', { code: get().code, playerId: get().myId, cardId }) },
  submitAnswer(value) { emit('submit_answer', { code: get().code, playerId: get().myId, value }); set({ quiz: { ...get().quiz, answered: true } }) },
  useHint() { emit('quiz_hint', { code: get().code, playerId: get().myId }) },
  leave() { emit('leave_room', { code: get().code, playerId: get().myId }) },
  clearError() { set({ error: null }) },
}))
