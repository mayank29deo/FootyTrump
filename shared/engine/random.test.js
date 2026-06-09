import { describe, it, expect } from 'vitest'
import { makeRng, shuffle } from './random.js'

describe('random', () => {
  it('makeRng is deterministic for a given seed', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    const seqA = [a(), a(), a()]
    const seqB = [b(), b(), b()]
    expect(seqA).toEqual(seqB)
    for (const n of seqA) { expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThan(1) }
  })
  it('shuffle returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5]
    const out = shuffle(input, makeRng(7))
    expect(out).toHaveLength(5)
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
    expect(input).toEqual([1, 2, 3, 4, 5]) // unchanged
  })
  it('shuffle with the same seed is reproducible', () => {
    expect(shuffle([1, 2, 3, 4, 5], makeRng(7))).toEqual(shuffle([1, 2, 3, 4, 5], makeRng(7)))
  })
})
