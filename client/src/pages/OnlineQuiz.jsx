import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineStore } from '../store/onlineStore.js'

const LETTER = ['A', 'B', 'C', 'D']

function Leaderboard({ rows, myId }) {
  if (!rows?.length) return null
  return (
    <div className="navy-card rounded-xl p-3 mt-3">
      <div className="text-[10px] text-gold font-display tracking-widest mb-1">LEADERBOARD</div>
      {rows.map((p, i) => (
        <div key={p.id} className={`flex justify-between text-sm py-0.5 ${p.id === myId ? 'text-gold' : ''}`}>
          <span>{i + 1}. {p.name}{p.id === myId ? ' (you)' : ''}</span><span className="font-display font-bold">{p.score}</span>
        </div>
      ))}
    </div>
  )
}

export default function OnlineQuiz() {
  const nav = useNavigate()
  const s = useOnlineStore()
  const q = s.quiz
  const [filled, setFilled] = useState([])

  useEffect(() => { if (!q.mode) nav('/online') }, [q.mode, nav])
  // reset letter tiles when a new guess question arrives
  useEffect(() => { setFilled([]) }, [q.question?.idx])

  if (!q.mode) return null

  if (q.ended) {
    return (
      <div className="pitch-bg min-h-screen grid place-items-center p-6 text-center">
        <div className="navy-card rounded-2xl p-6 w-full max-w-sm">
          <div className="text-5xl">🏆</div>
          <h1 className="font-display text-2xl font-bold text-gold mt-2">{q.leaderboard[0]?.name} wins!</h1>
          <Leaderboard rows={q.leaderboard} myId={s.myId} />
          <button onClick={() => nav('/')} className="block w-full mt-5 bg-gold text-navy-deep font-display font-bold rounded-xl py-3">Home</button>
        </div>
      </div>
    )
  }

  const question = q.question
  if (!question) {
    return <div className="pitch-bg min-h-screen grid place-items-center"><div className="font-display text-gold">Get ready…</div></div>
  }

  const answered = q.answered
  const result = q.result
  const myGain = result ? result.gained?.[s.myId] : null

  return (
    <div className="pitch-bg min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center text-sm font-display">
          <span>Question {question.idx + 1}</span>
          <div className="flex gap-3">
            {q.clock != null && <span className={q.clock <= 15 ? 'text-red-400 animate-pulse' : ''}>🕐 {Math.floor(q.clock / 60)}:{String(q.clock % 60).padStart(2, '0')}</span>}
            <span className={q.tick <= 5 ? 'text-red-400' : ''}>⏱ {q.tick}s</span>
          </div>
        </div>

        {question.mode === 'mcq' ? (
          <div className="navy-card rounded-2xl p-5 mt-3">
            <div className="text-xs text-gold font-display tracking-widest">{question.category?.toUpperCase()}</div>
            <h2 className="font-display font-bold text-lg mt-1">{question.q}</h2>
            <div className="grid gap-2 mt-4">
              {question.options.map((opt, i) => {
                let cls = 'bg-white/5 hover:bg-white/10'
                if (result) cls = opt === result.correctAnswer ? 'bg-pitch text-white' : 'bg-white/5 opacity-60'
                else if (answered) cls = 'bg-white/10 opacity-70'
                return (
                  <button key={i} disabled={answered || !!result} onClick={() => s.submitAnswer(i)}
                    className={`text-left rounded-xl px-4 py-3 font-display transition ${cls}`}>
                    <span className="text-gold font-bold mr-2">{LETTER[i]}</span>{opt}
                    {result && opt === result.correctAnswer && ' ✓'}
                  </button>
                )
              })}
            </div>
            {answered && !result && <div className="text-center text-slate-300 text-sm mt-3">Answer locked — waiting…</div>}
          </div>
        ) : (
          <div className="navy-card rounded-2xl p-5 mt-3">
            <div className="text-xs font-display font-bold text-gold tracking-widest">WHO AM I?</div>
            <ul className="mt-2 space-y-1.5 text-sm">{question.clues.map((c, i) => <li key={i}>🟢 {c}</li>)}</ul>
            <div className="flex gap-1.5 justify-center flex-wrap mt-4">
              {Array.from({ length: question.blankCount }, (_, i) => (
                <span key={i} className={`w-8 h-10 rounded-md grid place-items-center font-display font-bold text-lg ${filled[i] ? 'bg-pitch text-white' : 'bg-white/10 text-gold border border-gold/40'}`}>{filled[i]?.ch || '_'}</span>
              ))}
            </div>
            {result && <div className="text-center text-pitch-light font-display font-bold mt-2">✓ {result.correctAnswer}</div>}
            {!answered && !result && (
              <>
                <div className="flex gap-1.5 justify-center flex-wrap mt-4">
                  {question.tiles.map((t, i) => {
                    const used = filled.some(f => f.i === i)
                    return <button key={i} disabled={used} onClick={() => filled.length < question.blankCount && setFilled([...filled, { i, ch: t }])}
                      className={`w-9 h-9 rounded-lg font-display font-bold ${used ? 'bg-navy-deep text-slate-600' : 'bg-gold-trim text-navy-deep'}`}>{t}</button>
                  })}
                </div>
                <div className="flex gap-2 justify-center mt-4">
                  <button onClick={() => setFilled(filled.slice(0, -1))} disabled={!filled.length} className="bg-white/10 rounded-lg px-4 py-2 font-display disabled:opacity-40">⌫</button>
                  <button onClick={() => s.submitAnswer(filled.map(f => f.ch).join(''))} disabled={filled.length < question.blankCount} className="bg-gold text-navy-deep rounded-lg px-5 py-2 font-display font-bold disabled:opacity-40">Submit</button>
                </div>
              </>
            )}
            {answered && !result && <div className="text-center text-slate-300 text-sm mt-3">Answer locked — waiting…</div>}
          </div>
        )}

        {result && myGain != null && <div className="text-center font-display font-bold mt-3 text-gold">+{myGain} pts</div>}
        <Leaderboard rows={q.leaderboard} myId={s.myId} />
      </div>
    </div>
  )
}
