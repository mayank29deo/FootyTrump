import { useNavigate } from 'react-router-dom'
import { useQuizStore } from '../store/quizStore.js'

export default function QuizResults() {
  const nav = useNavigate()
  const { mode, score, best, startGuess, startMcq } = useQuizStore()
  const label = mode === 'guess' ? 'Guess the Footballer' : 'Multiple Choice'
  const isBest = best[mode] === score && score > 0

  const again = () => { mode === 'guess' ? startGuess() : startMcq(); nav(`/quiz/${mode}`) }

  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6 text-center">
      <div className="navy-card rounded-2xl p-6 w-full max-w-sm">
        <div className="text-5xl">{isBest ? '🥇' : '🎯'}</div>
        <h1 className="font-display text-3xl font-bold text-gold mt-2">{score} pts</h1>
        <p className="text-slate-200 text-sm mt-1">{label}{isBest ? ' · New best!' : ''}</p>
        <p className="text-slate-300 text-sm mt-1">Best: {best[mode] ?? 0}</p>
        <button onClick={again} className="block w-full mt-6 bg-gold text-navy-deep font-display font-bold rounded-xl py-3">Play again</button>
        <button onClick={() => nav('/quiz')} className="block w-full mt-2 text-slate-200 text-sm">Quiz menu</button>
        <button onClick={() => nav('/')} className="block w-full mt-1 text-slate-300 text-sm">Home</button>
      </div>
    </div>
  )
}
