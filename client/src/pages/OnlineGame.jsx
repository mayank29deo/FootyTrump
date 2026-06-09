import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineStore } from '../store/onlineStore.js'
import PlayerCard from '../components/game/PlayerCard.jsx'
import OpponentStrip from '../components/game/OpponentStrip.jsx'
import RoundResultOverlay from '../components/game/RoundResultOverlay.jsx'
import GameTimer from '../components/game/GameTimer.jsx'
import { STAT_LABELS } from '../../../shared/engine/constants.js'

export default function OnlineGame() {
  const nav = useNavigate()
  const s = useOnlineStore()
  useEffect(() => { if (!s.state) nav('/online') }, [s.state, nav])
  useEffect(() => { if (s.finished) nav('/results') }, [s.finished, nav])
  if (!s.state) return null

  const st = s.state
  const iAmActive = st.activePlayerId === s.myId
  const defending = st.phase === 'opponents_selecting'
  const myPlayer = st.players.find(p => p.id === s.myId)
  // OpponentStrip expects {id,name,isActive,hand:{length}} — adapt from public players (cardCount only)
  const stripPlayers = st.players.map(p => ({ id: p.id, name: p.name, isActive: p.isActive, hand: { length: p.cardCount } }))
  const attackStat = st.activeStat
  const iMustDefend = defending && !iAmActive && myPlayer?.cardCount > 0

  return (
    <div className="pitch-bg min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center text-sm">
          <span className="font-display">Round {st.currentRound + 1}</span>
          <div className="flex gap-3">
            <GameTimer label="⏱" seconds={s.clockLeft} />
            <GameTimer label="turn" seconds={s.phaseLeft} />
          </div>
        </div>
        <div className="mt-4"><OpponentStrip players={stripPlayers} activeId={st.activePlayerId} myId={s.myId} /></div>

        {defending && st.activeCard && (
          <div className="mt-5 flex flex-col items-center">
            <div className="navy-card rounded-xl px-4 py-2 mb-3 text-center">
              <span className="text-gold font-display font-bold">{iAmActive ? 'You attack' : 'Opponent attacks'} with {STAT_LABELS[attackStat]}</span>
              <span className="ml-2 text-white font-display font-bold text-lg">{st.activeCard.stats[attackStat]}</span>
              {iMustDefend && <div className="text-[11px] text-slate-200 mt-0.5">Play a card with a higher {STAT_LABELS[attackStat]} to win</div>}
            </div>
            <PlayerCard card={st.activeCard} selectedStat={attackStat} />
          </div>
        )}

        <div className="mt-6">
          {st.phase === 'active_selecting' && (
            <div className="text-center text-sm font-display text-gold mb-2">
              {iAmActive ? 'Your turn — tap a stat to attack' : `${st.players.find(p => p.id === st.activePlayerId)?.name ?? 'Opponent'} is choosing…`}
            </div>
          )}
          <div className="flex gap-3 overflow-x-auto pb-4">
            {s.myHand.map(card => (
              <div key={card.id} className="shrink-0">
                <PlayerCard card={card}
                  selectable={iAmActive && st.phase === 'active_selecting'}
                  selectedStat={iMustDefend ? attackStat : null}
                  onPickStat={(stat) => s.pickActive(card.id, stat)} />
                {iMustDefend && <button onClick={() => s.pickDefend(card.id)} className="mt-2 w-full text-xs font-display font-bold bg-gold text-navy-deep rounded-lg py-1.5">Play ({card.stats[attackStat]})</button>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <RoundResultOverlay result={s.roundResult} players={st.players} />
    </div>
  )
}
