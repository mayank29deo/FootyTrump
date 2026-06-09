import CardBack from './CardBack.jsx'

export default function OpponentStrip({ players, activeId, myId }) {
  const opponents = players.filter(p => p.id !== myId)
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {opponents.map(p => (
        <div key={p.id} className={`text-center ${!p.isActive || p.hand.length === 0 ? 'opacity-40' : ''}`}>
          <CardBack compact />
          <div className={`mt-1 text-[11px] font-display ${p.id === activeId ? 'text-gold font-bold' : 'text-white'}`}>{p.name}</div>
          <div className="text-[10px] text-slate-200">{p.hand.length} cards</div>
        </div>
      ))}
    </div>
  )
}
