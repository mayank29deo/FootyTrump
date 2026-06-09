import { STAT_LABELS } from '../../../../shared/engine/constants.js'

export default function RoundResultOverlay({ result, players }) {
  if (!result) return null
  const name = (id) => players.find(p => p.id === id)?.name ?? '—'
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50">
      <div className="navy-card rounded-2xl px-8 py-6 text-center">
        <div className="text-xs text-gold tracking-widest">{STAT_LABELS[result.stat]}</div>
        <div className="font-display text-2xl font-bold mt-2">
          {result.isTie ? 'TIE — cards to the pile' : `${name(result.winnerId)} wins the round!`}
        </div>
      </div>
    </div>
  )
}
