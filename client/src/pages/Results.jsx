import { Link } from 'react-router-dom'
import { useSoloStore } from '../store/soloStore.js'

export default function Results() {
  const game = useSoloStore(s => s.game)
  if (!game) return <div className="pitch-bg min-h-screen grid place-items-center"><Link className="navy-card rounded-xl px-6 py-3" to="/">Home</Link></div>
  const winner = game.players.find(p => p.id === game.winnerId)
  const ranked = [...game.players].sort((a, b) => b.score - a.score)
  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6 text-center">
      <div className="navy-card rounded-2xl p-6 w-full max-w-sm">
        <div className="text-5xl">🏆</div>
        <h1 className="font-display text-3xl font-bold text-gold mt-2">{winner ? `${winner.name} wins!` : 'Game over'}</h1>
        <ul className="mt-4 text-left">
          {ranked.map(p => (
            <li key={p.id} className="flex justify-between border-b border-white/10 py-1.5">
              <span>{p.name}</span><span className="font-display font-bold">{p.score} pts · {p.hand.length} cards</span>
            </li>
          ))}
        </ul>
        <Link to="/solo/setup" className="block mt-6 bg-gold text-navy-deep font-display font-bold rounded-xl py-3">Play again</Link>
        <Link to="/" className="block mt-2 text-slate-200 text-sm">Home</Link>
      </div>
    </div>
  )
}
