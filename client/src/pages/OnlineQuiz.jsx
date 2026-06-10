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

// Reveal/buffer line shown after each question: what you answered + the correct answer.
function RevealLine({ question, result, myId }) {
  if (!result) return null
  const a = result.answers?.[myId]
  const mine = !a ? null : (question.mode === 'mcq' ? question.options?.[a.value] : a.value)
  return (
    <div className="navy-card rounded-xl px-4 py-3 mt-3 text-center">
      {a
        ? <div className={`font-display ${a.correct ? 'text-pitch-light' : 'text-red-300'}`}>Your answer: <b>{mine || '—'}</b> {a.correct ? '✓' : '✗'}</div>
        : <div className="font-display text-slate-300">You didn’t answer in time</div>}
      {(!a || !a.correct) && <div className="font-display text-gold mt-1">Correct answer: <b>{result.correctAnswer}</b></div>}
    </div>
  )
}

export default function OnlineQuiz() {
  const nav = useNavigate()
  const s = useOnlineStore()
  const q = s.quiz
  const [typed, setTyped] = useState('')

  useEffect(() => { if (!q.mode) nav('/online') }, [q.mode, nav])
  useEffect(() => { setTyped('') }, [q.question?.idx]) // reset input each new question

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
            {result ? <span className="text-pitch-light">reveal…</span> : <span className={q.tick <= 5 ? 'text-red-400' : ''}>⏱ {q.tick}s</span>}
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
          <GuessCard question={question} revealed={q.revealed} hintsLeft={q.hintsLeft} answered={answered} result={result}
            typed={typed} setTyped={setTyped} onHint={s.useHint} onSubmit={() => typed.trim() && s.submitAnswer(typed.trim())} />
        )}

        {result && myGain != null && <div className="text-center font-display font-bold mt-3 text-gold">+{myGain} pts</div>}
        <RevealLine question={question} result={result} myId={s.myId} />
        <Leaderboard rows={q.leaderboard} myId={s.myId} />
      </div>
    </div>
  )
}

function GuessCard({ question, revealed, hintsLeft, answered, result, typed, setTyped, onHint, onSubmit }) {
  const revealedMap = Object.fromEntries((revealed || []).map(r => [r.index, r.ch]))
  const cell = (m, i) => {
    if (result) return result.correctAnswer[i] === ' ' ? ' ' : result.correctAnswer[i] // reveal full answer
    if (m.fixed) return m.ch === ' ' ? ' ' : m.ch
    if (m.revealed) return m.ch
    if (revealedMap[i]) return revealedMap[i]
    return '_'
  }
  const left = hintsLeft == null ? 0 : hintsLeft
  return (
    <div className="navy-card rounded-2xl p-5 mt-3">
      <div className="text-xs font-display font-bold text-gold tracking-widest">WHO AM I?</div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {question.clues.map((c, i) => (
          <li key={i} className="flex gap-2"><span className="text-white font-bold leading-none mt-0.5">•</span><span>{c}</span></li>
        ))}
      </ul>

      <div className="flex gap-1.5 justify-center flex-wrap mt-4">
        {question.mask.map((m, i) => (
          <span key={i} className={`min-w-8 h-10 px-1 rounded-md grid place-items-center font-display font-bold text-lg ${m.fixed ? 'bg-transparent' : (cell(m, i) !== '_' ? 'bg-pitch text-white' : 'bg-white/10 text-gold border border-gold/40')}`}>{cell(m, i)}</span>
        ))}
      </div>

      {!answered && !result && (
        <>
          <input
            value={typed}
            onChange={e => setTyped(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSubmit() }}
            placeholder="Type your answer…"
            autoFocus
            className="w-full mt-4 rounded-lg bg-navy-deep px-3 py-2.5 text-center font-display text-lg tracking-wide outline-none focus:ring-2 focus:ring-gold"
          />
          <div className="flex gap-2 justify-center mt-3">
            <button onClick={onHint} disabled={left <= 0} className="bg-white/10 rounded-lg px-4 py-2 font-display disabled:opacity-40">💡 Hint ({left} left · −1 pt)</button>
            <button onClick={onSubmit} disabled={!typed.trim()} className="bg-gold text-navy-deep rounded-lg px-5 py-2 font-display font-bold disabled:opacity-40">Submit</button>
          </div>
        </>
      )}
      {answered && !result && <div className="text-center text-slate-300 text-sm mt-3">Answer locked — waiting…</div>}
    </div>
  )
}
