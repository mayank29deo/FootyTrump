import { Link } from 'react-router-dom'
import { getIdentity } from '../lib/identity.js'

export default function Home() {
  const me = getIdentity()
  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6 text-center">
      <div>
        <div className="text-6xl">⚽</div>
        <h1 className="font-display text-5xl font-bold mt-2">FootyTrump</h1>
        <p className="text-slate-100 mt-1">FIFA World Cup 2026 · Trump Cards</p>
        <div className="mt-8 flex flex-col gap-3 w-64 mx-auto">
          <Link to="/solo/setup" className="navy-card rounded-xl py-3 font-display font-bold">⚔️ Play vs CPU</Link>
          <Link to="/online" className="navy-card rounded-xl py-3 font-display font-bold">👥 Play Online</Link>
          <span className="bg-white/10 rounded-xl py-3 font-display text-slate-300">🧠 Quiz (coming soon)</span>
        </div>
        <p className="text-xs text-slate-200 mt-6">Playing as {me.name}</p>
      </div>
    </div>
  )
}
