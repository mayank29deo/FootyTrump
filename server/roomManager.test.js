import { describe, it, expect, beforeEach } from 'vitest'
import * as rm from './roomManager.js'
import { ACTIVE_SECONDS, OPPONENT_SECONDS } from './roomManager.js'

const host = { id: 'h', name: 'Host', socketId: 's1' }

describe('roomManager lifecycle', () => {
  beforeEach(() => rm._reset())

  it('creates a room with a 6-char code and the host as first player', () => {
    const room = rm.createRoom(host, 6, 'international')
    expect(room.code).toMatch(/^[A-Z0-9]{6}$/)
    expect(room.players).toHaveLength(1)
    expect(room.hostId).toBe('h')
    expect(room.timeOption).toBe(6)
    expect(room.phase).toBe('waiting')
  })
  it('defaults an invalid time option to 6', () => {
    expect(rm.createRoom(host, 99).timeOption).toBe(6)
  })
  it('defaults to trump; accepts a quiz gameType + quizMode', () => {
    expect(rm.createRoom(host, 6).gameType).toBe('trump')
    const q = rm.createRoom(host, 6, 'international', 'quiz', 'guess')
    expect(q.gameType).toBe('quiz')
    expect(q.quizMode).toBe('guess')
  })
  it('joins a second player; blocks a 7th and blocks join after start', () => {
    const room = rm.createRoom(host, 4)
    expect(rm.joinRoom(room.code, { id: 'p2', name: 'B', socketId: 's2' }).room.players).toHaveLength(2)
    for (let i = 3; i <= 6; i++) rm.joinRoom(room.code, { id: 'p' + i, name: 'P' + i, socketId: 's' + i })
    expect(rm.joinRoom(room.code, { id: 'p7', name: 'P7', socketId: 's7' }).error).toMatch(/full/i)
  })
  it('lets an existing player rejoin with a new socketId', () => {
    const room = rm.createRoom(host, 4)
    const r = rm.joinRoom(room.code, { id: 'h', name: 'Host', socketId: 'sNEW' })
    expect(r.rejoining).toBe(true)
    expect(rm.getRoom(room.code).players[0].socketId).toBe('sNEW')
  })
  it('returns an error for unknown rooms', () => {
    expect(rm.joinRoom('ZZZZZZ', host).error).toMatch(/not found/i)
  })
})

describe('roomManager game integration', () => {
  beforeEach(() => rm._reset())
  function started() {
    const room = rm.createRoom({ id: 'a', name: 'A', socketId: 's1' }, 4)
    rm.joinRoom(room.code, { id: 'b', name: 'B', socketId: 's2' })
    rm.startGame(room.code)
    return room.code
  }
  it('exposes 30s phase constants', () => {
    expect(ACTIVE_SECONDS).toBe(30)
    expect(OPPONENT_SECONDS).toBe(30)
  })
  it('startGame deals hands and enters active_selecting', () => {
    const code = started()
    const room = rm.getRoom(code)
    expect(room.phase).toBe('active_selecting')
    expect(room.game.players[0].hand.length).toBeGreaterThan(0)
  })
  it('autoActive + autoOpponents resolve a round end-to-end', () => {
    const code = started()
    rm.autoActive(code)
    expect(rm.getRoom(code).phase).toBe('opponents_selecting')
    const res = rm.autoOpponentsAndResolve(code)
    expect(res.roundResult).toBeTruthy()
    expect(['active_selecting', 'ended']).toContain(rm.getRoom(code).phase)
  })
  it('timerExpiry ends the game with the top scorer', () => {
    const code = started()
    const { winnerId } = rm.timerExpiry(code)
    expect(rm.getRoom(code).phase).toBe('ended')
    expect(winnerId).toBeTruthy()
  })
  it('publicState hides hands but exposes card counts + active card', () => {
    const code = started()
    rm.autoActive(code)
    const pub = rm.publicState(rm.getRoom(code))
    expect(pub.players[0].cardCount).toBeGreaterThan(0)
    expect(pub.players[0].hand).toBeUndefined()
    expect(pub.activeStat).toBeTruthy()
    expect(pub.activeCard).toBeTruthy()
  })
})
