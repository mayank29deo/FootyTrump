import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizStore } from '../store/quizStore.js'

export default function GuessFootballer() {
  const nav = useNavigate()
  const s = useQuizStore()
  useEffect(() => { if (!s.current && !s.finished) nav('/quiz') }, [s.current, s.finished, nav])
  useEffect(() => { if (s.finished) nav('/quiz/results') }, [s.finished, nav])
  if (!s.current) return null

  const len = s.current.answer.replace(/[^A-Za-z]/g, '').length
  const usedTileIdx = new Set(s.filled.map(f => f.i))
  const blanks = Array.from({ length: len }, (_, i) => s.filled[i]?.ch ?? '')

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
              <li key={i} className={i < s.hintsUsed ? 'text-slate-100' : 'text-slate-400/50'}>
                {i < s.hintsUsed ? `🟢 ${c}` : '🔒 Hint locked'}
              </li>
            ))}
          </ul>
          {s.hintsUsed < 3 && !s.revealed && (
            <button onClick={s.useHint} className="mt-2 text-xs font-display bg-white/10 rounded-lg px-3 py-1">💡 Reveal hint (−80)</button>
          )}

          {/* blanks */}
          <div className="flex gap-1.5 justify-center flex-wrap mt-5">
            {blanks.map((ch, i) => (
              <span key={i} className={`w-8 h-10 rounded-md grid place-items-center font-display font-bold text-lg ${ch ? 'bg-pitch text-white' : 'bg-white/10 text-gold border border-gold/40'}`}>{ch || '_'}</span>
            ))}
          </div>
          {s.revealed && <div className="text-center text-pitch-light font-display font-bold mt-2">✓ {s.current.answer}</div>}

          {/* tiles */}
          <div className="flex gap-1.5 justify-center flex-wrap mt-5">
            {s.tiles.map((t, i) => (
              <button key={i} disabled={usedTileIdx.has(i) || s.revealed}
                onClick={() => s.tapTile(i)}
                className={`w-9 h-9 rounded-lg font-display font-bold ${usedTileIdx.has(i) ? 'bg-navy-deep text-slate-600' : 'bg-gold-trim text-navy-deep hover:brightness-105'}`}>{t}</button>
            ))}
          </div>

          <div className="flex gap-2 justify-center mt-5">
            <button onClick={s.backspace} disabled={s.revealed || !s.filled.length} className="bg-white/10 rounded-lg px-4 py-2 font-display disabled:opacity-40">⌫ Delete</button>
            <button onClick={s.submitGuess} disabled={s.revealed || s.filled.length < len} className="bg-gold text-navy-deep rounded-lg px-5 py-2 font-display font-bold disabled:opacity-40">Submit</button>
          </div>
          {s.wrongTries > 0 && !s.revealed && <div className="text-center text-red-300 text-sm mt-2">Not quite — try again ({s.wrongTries} wrong)</div>}
        </div>
      </div>
    </div>
  )
}
