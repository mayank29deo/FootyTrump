import { describe, it, expect } from 'vitest'
import * as qm from './quizManager.js'
import { makeRng } from '../shared/engine/random.js'

function room(players, mode = 'mcq') {
  const r = { players: players.map(id => ({ id, name: id })), quizMode: mode, quiz: null }
  qm.startQuiz(r, makeRng(1))
  return r
}

describe('quizManager', () => {
  it('startQuiz picks questions, zeroes scores, phase=question', () => {
    const r = room(['a', 'b'])
    expect(r.quiz.questions.length).toBeGreaterThan(0)
    expect(r.quiz.scores).toEqual({ a: 0, b: 0 })
    expect(r.quiz.phase).toBe('question')
  })
  it('questionPayload (mcq) exposes options but NOT the correct answer', () => {
    const r = room(['a', 'b'])
    const p = qm.questionPayload(r)
    expect(p.options).toHaveLength(4)
    expect(p.correctIndex).toBeUndefined()
    expect(p.answer).toBeUndefined()
  })
  it('questionPayload (guess) sends a mask + maxHints but NOT the answer/hidden letters', () => {
    const r = room(['a', 'b'], 'guess')
    const p = qm.questionPayload(r)
    expect(Array.isArray(p.mask)).toBe(true)
    expect(p.maxHints).toBeGreaterThan(0)
    expect(p.answer).toBeUndefined()
    expect(p.tiles).toBeUndefined() // no jumbled letters anymore
    const hidden = p.mask.filter(m => m.revealed === false)
    expect(hidden.length).toBeGreaterThan(0)
    expect(hidden.every(m => m.ch === undefined)).toBe(true) // hidden cells leak no letter
  })
  it('useHint reveals one letter at a time, capped at 3', () => {
    const r = room(['a', 'b'], 'guess')
    const h1 = qm.useHint(r, 'a'); qm.useHint(r, 'a'); qm.useHint(r, 'a')
    const h4 = qm.useHint(r, 'a')
    expect(h1).toHaveProperty('index'); expect(h1).toHaveProperty('ch')
    expect(h4).toBeNull()
    expect(r.quiz.hints.a).toBe(3)
  })
  it('guess scoring = rank base minus hints (2nd place + 2 hints -> 6)', () => {
    const r = room(['a', 'b'], 'guess')
    const ans = r.quiz.questions[0].answer
    qm.useHint(r, 'b'); qm.useHint(r, 'b')
    qm.recordAnswer(r, 'a', ans, 1000)
    qm.recordAnswer(r, 'b', ans, 2000)
    const res = qm.scoreQuestion(r)
    expect(res.gained.a).toBe(10)
    expect(res.gained.b).toBe(6)
  })
  it('scoreQuestion ranks correct answers by speed (10 then 6 for 2 players)', () => {
    const r = room(['a', 'b'])
    const correct = r.quiz.questions[0].correctIndex
    qm.recordAnswer(r, 'a', correct, 1000) // faster, correct
    qm.recordAnswer(r, 'b', correct, 2000) // slower, correct
    const res = qm.scoreQuestion(r)
    expect(res.gained.a).toBe(10)
    expect(res.gained.b).toBe(6)
    expect(r.quiz.scores).toEqual({ a: 10, b: 6 })
  })
  it('wrong / no answer scores 0', () => {
    const r = room(['a', 'b'])
    const wrong = (r.quiz.questions[0].correctIndex + 1) % 4
    qm.recordAnswer(r, 'a', wrong, 1000)
    const res = qm.scoreQuestion(r)
    expect(res.gained.a).toBe(0)
    expect(res.gained.b).toBe(0)
  })
  it('advance moves through questions then ends', () => {
    const r = room(['a', 'b'])
    for (let i = 0; i < r.quiz.questions.length; i++) qm.advance(r)
    expect(r.quiz.phase).toBe('ended')
  })
})
