import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import * as rm from './roomManager.js'
import * as qm from './quizManager.js'

const app = express()
app.use(cors({ origin: '*' }))
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const server = createServer(app)
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] }, pingInterval: 5000, pingTimeout: 10000 })

const phaseTimers = new Map() // code -> {tick, expire}
const roomClocks = new Map()  // code -> interval
const quizTimers = new Map()  // code -> {tick, expire}
const REVEAL_MS = 2600
const QUIZ_REVEAL_MS = 3500

const clearPhase = (code) => { const t = phaseTimers.get(code); if (t) { clearInterval(t.tick); clearTimeout(t.expire); phaseTimers.delete(code) } }
const stopClock = (code) => { const i = roomClocks.get(code); if (i) { clearInterval(i); roomClocks.delete(code) } }
const clearQuiz = (code) => { const t = quizTimers.get(code); if (t) { clearInterval(t.tick); clearTimeout(t.expire); quizTimers.delete(code) } }
const quizClocks = new Map() // code -> interval (overall 4/6/8-min quiz clock)
const stopQuizClock = (code) => { const i = quizClocks.get(code); if (i) { clearInterval(i); quizClocks.delete(code) } }

// ── Quiz (multiplayer) flow ──────────────────────────────────────────────
// Overall room clock (4/6/8 min). Questions run back-to-back until it expires;
// when it hits 0 mid-question, that question finishes, then the quiz ends.
function startQuizClock(code) {
  const room = rm.getRoom(code); if (!room?.quiz) return
  let left = (room.timeOption || 6) * 60
  room.quiz.clockLeft = left
  const interval = setInterval(() => {
    left -= 1
    const r = rm.getRoom(code)
    if (!r?.quiz || r.quiz.phase === 'ended') { clearInterval(interval); quizClocks.delete(code); return }
    r.quiz.clockLeft = left
    io.to(code).emit('quiz_clock', { left })
    if (left === 15) io.to(code).emit('last_round_warning')
    if (left <= 0) { clearInterval(interval); quizClocks.delete(code); r.quiz.pendingEnd = true; io.to(code).emit('quiz_clock', { left: 0 }) }
  }, 1000)
  quizClocks.set(code, interval)
}

function sendQuestion(code) {
  clearQuiz(code)
  const room = rm.getRoom(code); if (!room?.quiz || room.quiz.phase !== 'question') return
  const payload = qm.questionPayload(room)
  io.to(code).emit('quiz_question', payload)
  let left = payload.seconds
  const tick = setInterval(() => { left -= 1; io.to(code).emit('quiz_tick', { left }) }, 1000)
  const expire = setTimeout(() => finishQuestion(code), payload.seconds * 1000)
  quizTimers.set(code, { tick, expire })
}
function endQuiz(code) {
  const room = rm.getRoom(code)
  if (room?.quiz) room.quiz.phase = 'ended'
  stopQuizClock(code)
  io.to(code).emit('quiz_ended', { leaderboard: qm.leaderboard(room) })
}
function finishQuestion(code) {
  clearQuiz(code)
  const room = rm.getRoom(code); if (!room?.quiz || room.quiz.phase !== 'question') return
  const result = qm.scoreQuestion(room)
  io.to(code).emit('quiz_result', { gained: result.gained, correctAnswer: result.answer, leaderboard: qm.leaderboard(room) })
  setTimeout(() => {
    if (room.quiz.pendingEnd) return endQuiz(code)            // clock ran out — last question is done
    const phase = qm.advance(room)
    if (phase === 'ended') return endQuiz(code)               // exhausted the bank (fallback)
    sendQuestion(code)
  }, QUIZ_REVEAL_MS)
}

function emitState(code) {
  const room = rm.getRoom(code); if (!room) return
  io.to(code).emit('game_state', rm.publicState(room))
  room.players.forEach(p => {
    const gp = room.game?.players.find(x => x.id === p.id)
    if (gp) io.to(p.socketId).emit('your_hand', { hand: gp.hand })
  })
}

function startActivePhase(code) {
  clearPhase(code)
  const room = rm.getRoom(code); if (!room || room.phase !== 'active_selecting') return
  io.to(code).emit('phase_changed', { phase: 'active_selecting', activePlayerId: room.game.players[room.game.activePlayerIndex].id, seconds: rm.ACTIVE_SECONDS })
  let left = rm.ACTIVE_SECONDS
  const tick = setInterval(() => { left -= 1; io.to(code).emit('phase_tick', { phase: 'active_selecting', left }) }, 1000)
  const expire = setTimeout(() => { clearInterval(tick); phaseTimers.delete(code); rm.autoActive(code); enterOpponentPhase(code) }, rm.ACTIVE_SECONDS * 1000)
  phaseTimers.set(code, { tick, expire })
}

function enterOpponentPhase(code) {
  clearPhase(code)
  const room = rm.getRoom(code); if (!room || room.phase !== 'opponents_selecting') return
  emitState(code)
  io.to(code).emit('phase_changed', { phase: 'opponents_selecting', activePlayerId: room.game.players[room.game.activePlayerIndex].id, activeStat: room.game.activeStat, seconds: rm.OPPONENT_SECONDS })
  let left = rm.OPPONENT_SECONDS
  const tick = setInterval(() => { left -= 1; io.to(code).emit('phase_tick', { phase: 'opponents_selecting', left }) }, 1000)
  const expire = setTimeout(() => { clearInterval(tick); phaseTimers.delete(code); finishRound(code, rm.autoOpponentsAndResolve(code)) }, rm.OPPONENT_SECONDS * 1000)
  phaseTimers.set(code, { tick, expire })
}

function finishRound(code, result) {
  if (!result || result.error) return
  clearPhase(code)
  io.to(code).emit('round_result', result.roundResult)
  emitState(code)
  const room = rm.getRoom(code)
  const ended = result.gameEnded || room.pendingEnd
  if (ended) {
    stopClock(code)
    const finalWinner = room.pendingEnd && !result.gameEnded ? rm.timerExpiry(code).winnerId : result.winnerId
    setTimeout(() => io.to(code).emit('game_ended', { winnerId: finalWinner, state: rm.publicState(room) }), REVEAL_MS)
  } else {
    setTimeout(() => { emitState(code); startActivePhase(code) }, REVEAL_MS)
  }
}

function startClock(code) {
  const room = rm.getRoom(code); if (!room) return
  let left = room.timeOption * 60
  const interval = setInterval(() => {
    left -= 1
    const r = rm.getRoom(code)
    if (!r || r.phase === 'ended') { clearInterval(interval); roomClocks.delete(code); return }
    io.to(code).emit('timer_tick', { left })
    if (left === 15) io.to(code).emit('last_round_warning')
    if (left <= 0) {
      clearInterval(interval); roomClocks.delete(code)
      const mid = r.phase === 'active_selecting' || r.phase === 'opponents_selecting'
      if (mid) { r.pendingEnd = true; io.to(code).emit('timer_tick', { left: 0 }) } // let the round finish
      else { const { winnerId } = rm.timerExpiry(code); io.to(code).emit('game_ended', { winnerId, state: rm.publicState(r) }) }
    }
  }, 1000)
  roomClocks.set(code, interval)
}

const lobby = (room) => ({ code: room.code, hostId: room.hostId, timeOption: room.timeOption, deckType: room.deckType, gameType: room.gameType, quizMode: room.quizMode, phase: room.phase, players: room.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, connected: p.connected })) })

io.on('connection', (socket) => {
  socket.on('create_room', ({ player, timeOption, deckType, gameType, quizMode }) => {
    const room = rm.createRoom({ ...player, socketId: socket.id }, timeOption, deckType, gameType, quizMode)
    socket.join(room.code)
    socket.emit('room_created', { code: room.code, room: lobby(room), myId: player.id })
  })

  socket.on('join_room', ({ code, player }) => {
    const res = rm.joinRoom(code, { ...player, socketId: socket.id })
    if (res.error) return socket.emit('error_msg', { message: res.error })
    socket.join(code)
    const room = rm.getRoom(code)
    socket.emit('room_joined', { room: lobby(room), myId: player.id })
    io.to(code).emit('room_updated', { room: lobby(room) })
    if (res.rejoining && room.phase !== 'waiting') { emitState(code) }
  })

  socket.on('start_game', ({ code, playerId }) => {
    const room = rm.getRoom(code)
    if (!room || room.hostId !== playerId) return socket.emit('error_msg', { message: 'Only host can start' })
    if (room.players.length < 2) return socket.emit('error_msg', { message: 'Need at least 2 players' })

    if (room.gameType === 'quiz') {
      qm.startQuiz(room)
      room.phase = 'playing'
      io.to(code).emit('quiz_started', { mode: room.quiz.mode, timeOption: room.timeOption, players: room.players.map(p => ({ id: p.id, name: p.name })) })
      sendQuestion(code)
      startQuizClock(code)
      return
    }

    const res = rm.startGame(code)
    if (res.error) return socket.emit('error_msg', { message: res.error })
    io.to(code).emit('game_started', rm.publicState(rm.getRoom(code)))
    emitState(code)
    startClock(code)
    startActivePhase(code)
  })

  socket.on('submit_answer', ({ code, playerId, value }) => {
    const room = rm.getRoom(code)
    if (!room?.quiz || room.quiz.phase !== 'question') return
    qm.recordAnswer(room, playerId, value, Date.now())
    io.to(code).emit('answer_received', { playerId })
    if (qm.everyoneAnswered(room)) finishQuestion(code)
  })

  socket.on('quiz_hint', ({ code, playerId }) => {
    const room = rm.getRoom(code)
    if (!room?.quiz || room.quiz.phase !== 'question') return
    const hint = qm.useHint(room, playerId)
    if (hint) socket.emit('quiz_hint_letter', { ...hint, hintsLeft: qm.MAX_HINTS - (room.quiz.hints[playerId] || 0) })
  })

  socket.on('select_card_stat', ({ code, playerId, cardId, stat }) => {
    const res = rm.selectCardStat(code, playerId, cardId, stat)
    if (res.error) return socket.emit('error_msg', { message: res.error })
    enterOpponentPhase(code)
  })

  socket.on('select_opponent_card', ({ code, playerId, cardId }) => {
    const res = rm.selectOpponent(code, playerId, cardId)
    if (res.error) return socket.emit('error_msg', { message: res.error })
    io.to(code).emit('opponent_selected', { playerId })
    if (res.allSelected) finishRound(code, rm.resolve(code))
  })

  socket.on('leave_room', ({ code, playerId }) => {
    rm.leaveRoom(code, playerId); socket.leave(code)
    const room = rm.getRoom(code)
    if (room) io.to(code).emit('room_updated', { room: lobby(room) })
  })

  socket.on('rejoin_room', ({ code, playerId }) => {
    const room = rm.updateSocket(code, playerId, socket.id)
    if (!room) return
    socket.join(code)
    socket.emit('room_updated', { room: lobby(room) })
    if (room.phase !== 'waiting') emitState(code)
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log(`FootyTrump server on ${PORT}`))
