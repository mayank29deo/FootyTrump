import StatBar from './StatBar.jsx'
import { STATS } from '../../../../shared/engine/constants.js'

const RARITY = {
  legendary: { label: 'LEGENDARY', stars: '★★★★★', color: '#ffd24a' },
  epic: { label: 'EPIC', stars: '★★★★☆', color: '#a855f7' },
  rare: { label: 'RARE', stars: '★★★☆☆', color: '#3b82f6' },
  common: { label: 'COMMON', stars: '★★☆☆☆', color: '#94a3b8' },
}
const STAT_COLOR = { matches: '#5b9bff', goals: '#ffd24a', assists: '#34d399', tackles: '#a78bfa', saves: '#22d3ee', cleanSheets: '#2dd4bf' }

export default function PlayerCard({ card, selectable = false, selectedStat = null, isWinner = false, onPickStat, onCardClick }) {
  if (!card) return null
  const r = RARITY[card.rarity] || RARITY.common
  const initials = card.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  return (
    <div
      onClick={onCardClick}
      className={`navy-card rounded-2xl p-3.5 w-[230px] shadow-xl ${isWinner ? 'ring-4 ring-gold scale-105' : ''} ${onCardClick ? 'cursor-pointer hover:ring-2 hover:ring-gold active:scale-95 transition' : ''}`}
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full" style={{ background: r.color, color: '#10203f' }}>{r.label}</span>
        <span className="text-[11px]" style={{ color: r.color }}>{r.stars}</span>
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <div className="w-10 h-10 rounded-lg grid place-items-center font-display font-bold text-gold-light bg-navy-light">{initials}</div>
        <div className="min-w-0">
          <div className="font-display font-bold text-white text-sm truncate">{card.name}</div>
          <div className="text-[10px] text-slate-300 truncate">{card.country} · {card.position}</div>
        </div>
      </div>
      <div className="h-px bg-gold/30 my-2.5" />
      <div className="flex flex-col gap-1.5">
        {STATS.map(stat => (
          <StatBar key={stat} statKey={stat} value={card.stats[stat]} color={STAT_COLOR[stat]}
            selectable={selectable} selected={selectedStat === stat}
            burned={card.usedStats?.includes(stat)} onPick={onPickStat} />
        ))}
      </div>
    </div>
  )
}
