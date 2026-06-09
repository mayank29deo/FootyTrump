import { STAT_LABELS, STAT_MAX } from '../../../../shared/engine/constants.js'

export default function StatBar({ statKey, value, color, selectable, selected, burned, onPick }) {
  const pct = Math.min((value / (STAT_MAX[statKey] || 100)) * 100, 100)
  return (
    <button
      type="button"
      disabled={!selectable || burned}
      onClick={() => selectable && !burned && onPick?.(statKey)}
      className={`w-full text-left rounded-md px-2 py-1 transition
        ${selected ? 'bg-gold/20 border border-gold' : 'border border-transparent'}
        ${selectable && !burned ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
        ${burned ? 'opacity-40' : ''}`}
    >
      <div className="flex justify-between text-[10px] text-slate-300">
        <span>{STAT_LABELS[statKey]}{burned ? ' ·used' : ''}</span>
        <span className="font-display font-bold text-white">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-navy-deep mt-1">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: selected ? '#ffd24a' : color }} />
      </div>
    </button>
  )
}
