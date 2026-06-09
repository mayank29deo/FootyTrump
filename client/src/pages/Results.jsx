import { Link } from 'react-router-dom'
import { useSoloStore } from '../store/soloStore.js'
import { useOnlineStore } from '../store/onlineStore.js'

export default function Results() {
  const solo = useSoloStore(s => s.game)
  const online = useOnlineStore()
  const isOnline = online.finished && online.state

  const players = isOnline ? online.state.players : solo?.players
  const winnerId = isOnline ? online.winnerId : solo?.winnerId

  if (!players) {
    return <div className="pitch-bg min-h-screen grid place-items-center"><Link className="navy-card rounded-xl px-6 py-3" to="/">Home</Link></div>
  }

  const winner = players.find(p => p.id === winnerId)
  const ranked = [...players].sort((a, b) => b.score - a.score)
  const cards = (p) => (isOnline ? p.cardCount : p.hand.length)

  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6 text-center">
      <div className="navy-card rounded-2xl p-6 w-full max-w-sm">
        <div className="text-5xl">🏆</div>
        <h1 className="font-display text-3xl font-bold text-gold mt-2">{winner ? `${winner.name} wins!` : 'Game over'}</h1>
        <ul className="mt-4 text-left">
          {ranked.map(p => (
            <li key={p.id} className="flex justify-between border-b border-white/10 py-1.5">
              <span>{p.name}</span><span className="font-display font-bold">{p.score} pts · {cards(p)} cards</span>
            </li>
          ))}
        </ul>
        <Link to={isOnline ? '/online' : '/solo/setup'} className="block mt-6 bg-gold text-navy-deep font-display font-bold rounded-xl py-3">Play again</Link>
        <Link to="/" className="block mt-2 text-slate-200 text-sm">Home</Link>
      </div>
    </div>
  )
}
