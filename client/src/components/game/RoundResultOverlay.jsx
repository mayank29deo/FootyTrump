import { STAT_LABELS } from '../../../../shared/engine/constants.js'

export default function RoundResultOverlay({ result, players }) {
  if (!result) return null
  const name = (id) => players.find(p => p.id === id)?.name ?? '—'
  const rows = Object.entries(result.cards || {})
    .map(([pid, { card, value }]) => ({ pid, card, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
      <div className="navy-card rounded-2xl px-6 py-5 text-center w-full max-w-sm">
        <div className="text-xs text-gold tracking-widest">{STAT_LABELS[result.stat]}</div>
        <div className="font-display text-2xl font-bold mt-1">
          {result.isTie ? 'TIE — cards to the pile' : `${name(result.winnerId)} wins!`}
        </div>
        <ul className="mt-4 text-left">
          {rows.map(({ pid, card, value }) => {
            const won = !result.isTie && pid === result.winnerId
            return (
              <li key={pid} className={`flex justify-between items-center rounded-lg px-3 py-1.5 mb-1 ${won ? 'bg-gold/20 border border-gold' : 'bg-white/5'}`}>
                <span className="text-sm">
                  <span className="text-slate-300">{name(pid)}:</span> {card.name}
                </span>
                <span className={`font-display font-bold ${won ? 'text-gold' : 'text-white'}`}>{value}{won ? ' ✓' : ''}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
