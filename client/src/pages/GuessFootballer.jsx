import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizStore } from '../store/quizStore.js'

export default function GuessFootballer() {
  const nav = useNavigate()
  const s = useQuizStore()
  useEffect(() => { if (!s.current && !s.finished) nav('/quiz') }, [s.current, s.finished, nav])
  useEffect(() => { if (s.finished) nav('/quiz/results') }, [s.finished, nav])
  if (!s.current) return null

  const ans = s.current.answer
  const revealed = new Set(s.revealedIdx)
  const isLetter = (ch) => /[A-Za-z]/.test(ch)
  const cell = (ch, i) => {
    if (!isLetter(ch)) return ch === ' ' ? ' ' : ch
    return (revealed.has(i) || s.solved) ? ch.toUpperCase() : '_'
  }
  const hintsLeft = Math.min(3, s.hintOrderArr.length) - s.hintsUsed

  return (
    <div className="pitch-bg min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between text-sm font-display">
          <span>Q {s.idx + 1}/{s.queue.length}</span>
          <span>🔥 {s.streak} · {s.score} pts</span>
        </div>

        <div className="navy-card rounded-2xl p-5 mt-3">
          <div className="text-xs font-display font-bold text-gold tracking-widest">WHO AM I?</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {s.current.clues.map((c, i) => (
              <li key={i} className="flex gap-2"><span className="text-white font-bold leading-none mt-0.5">•</span><span>{c}</span></li>
            ))}
          </ul>

          <div className="flex gap-1.5 justify-center flex-wrap mt-4">
            {ans.split('').map((ch, i) => (
              <span key={i} className={`min-w-8 h-10 px-1 rounded-md grid place-items-center font-display font-bold text-lg ${!isLetter(ch) ? 'bg-transparent' : (cell(ch, i) !== '_' ? 'bg-pitch text-white' : 'bg-white/10 text-gold border border-gold/40')}`}>{cell(ch, i)}</span>
            ))}
          </div>
          {s.solved && <div className="text-center text-pitch-light font-display font-bold mt-2">✓ {ans}</div>}

          {!s.solved && (
            <>
              <input value={s.typed} onChange={e => s.setTyped(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') s.submitGuess() }}
                placeholder="Type your answer…" autoFocus
                className="w-full mt-4 rounded-lg bg-navy-deep px-3 py-2.5 text-center font-display text-lg tracking-wide outline-none focus:ring-2 focus:ring-gold" />
              <div className="flex gap-2 justify-center mt-3">
                <button onClick={s.useHint} disabled={hintsLeft <= 0} className="bg-white/10 rounded-lg px-4 py-2 font-display disabled:opacity-40">💡 Hint ({hintsLeft} left)</button>
                <button onClick={s.submitGuess} disabled={!s.typed.trim()} className="bg-gold text-navy-deep rounded-lg px-5 py-2 font-display font-bold disabled:opacity-40">Submit</button>
              </div>
              {s.wrongTries > 0 && <div className="text-center text-red-300 text-sm mt-2">Not quite — try again ({s.wrongTries} wrong)</div>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
