import { useNavigate } from 'react-router-dom'
import { useQuizStore } from '../store/quizStore.js'

export default function QuizHome() {
  const nav = useNavigate()
  const { startGuess, startMcq, best } = useQuizStore()

  const go = (mode) => { mode === 'guess' ? startGuess() : startMcq(); nav(`/quiz/${mode}`) }

  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6 text-center">
      <div className="w-full max-w-sm">
        <div className="text-5xl">🧠</div>
        <h1 className="font-display text-4xl font-bold mt-1">Football Quiz</h1>
        <p className="text-slate-100 mt-1 text-sm">Solo practice · beat your best</p>

        <button onClick={() => go('guess')} className="navy-card rounded-2xl p-5 w-full mt-6 text-left">
          <div className="font-display font-bold text-lg text-gold">🔎 Guess the Footballer</div>
          <div className="text-sm text-slate-200 mt-1">3 hints, then build the name from letter tiles.</div>
          <div className="text-xs text-slate-300 mt-2">Best: {best.guess ?? 0}</div>
        </button>

        <button onClick={() => go('mcq')} className="navy-card rounded-2xl p-5 w-full mt-4 text-left">
          <div className="font-display font-bold text-lg text-gold">✅ Multiple Choice</div>
          <div className="text-sm text-slate-200 mt-1">Fast-fire trivia — beat the clock for bonus points.</div>
          <div className="text-xs text-slate-300 mt-2">Best: {best.mcq ?? 0}</div>
        </button>

        <button onClick={() => nav('/')} className="mt-6 text-slate-200 text-sm">← Home</button>
      </div>
    </div>
  )
}
