import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizStore } from '../store/quizStore.js'

const LETTER = ['A', 'B', 'C', 'D']

export default function QuizMcq() {
  const nav = useNavigate()
  const s = useQuizStore()

  useEffect(() => { if (!s.current && !s.finished) nav('/quiz') }, [s.current, s.finished, nav])
  useEffect(() => { if (s.finished) nav('/quiz/results') }, [s.finished, nav])

  // ONE countdown interval for the whole page; tick() self-guards on
  // current/picked/finished so it only decrements an active, unanswered question.
  useEffect(() => {
    const id = setInterval(() => useQuizStore.getState().tick(), 1000)
    return () => clearInterval(id)
  }, [])

  if (!s.current) return null
  const q = s.current

  const optClass = (i) => {
    if (s.picked == null) return 'bg-white/5 hover:bg-white/10'
    if (i === q.correctIndex) return 'bg-pitch text-white'
    if (i === s.picked) return 'bg-red-500/30 border border-red-400'
    return 'bg-white/5 opacity-60'
  }

  return (
    <div className="pitch-bg min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between text-sm font-display">
          <span>Q {s.idx + 1}/{s.queue.length}</span>
          <span className={s.timeLeft <= 4 ? 'text-red-400' : ''}>⏱ {s.timeLeft}s</span>
          <span>🔥 {s.streak} · {s.score} pts</span>
        </div>

        <div className="navy-card rounded-2xl p-5 mt-3">
          <div className="text-xs text-gold font-display tracking-widest">{q.category?.toUpperCase()}</div>
          <h2 className="font-display font-bold text-lg mt-1">{q.q}</h2>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {q.options.map((opt, i) => (
              <button key={i} disabled={s.picked != null} onClick={() => s.answerMcq(i)}
                className={`text-left rounded-xl px-4 py-3 font-display transition ${optClass(i)}`}>
                <span className="text-gold font-bold mr-2">{LETTER[i]}</span>{opt}
                {s.picked != null && i === q.correctIndex && ' ✓'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
