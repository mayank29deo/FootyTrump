import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSoloStore } from '../store/soloStore.js'
import PlayerCard from '../components/game/PlayerCard.jsx'
import OpponentStrip from '../components/game/OpponentStrip.jsx'
import RoundResultOverlay from '../components/game/RoundResultOverlay.jsx'
import { STAT_LABELS } from '../../../shared/engine/constants.js'

export default function SoloGame() {
  const nav = useNavigate()
  const { game, myId, roundResult, finished, pickActiveStat, pickOpponentCard } = useSoloStore()

  useEffect(() => { if (!game) nav('/solo/setup') }, [game, nav])
  useEffect(() => { if (finished) nav('/results') }, [finished, nav])
  if (!game) return null

  const me = game.players.find(p => p.id === myId)
  const active = game.players[game.activePlayerIndex]
  const iAmActive = active?.id === myId
  const defending = game.phase === 'opponents_selecting'
  const iMustDefend = defending && !game.opponentSelections[myId] && me?.hand.length > 0

  // The card + stat the active player is attacking with (still in their hand until resolve)
  const attackCard = defending && active ? active.hand.find(c => c.id === game.activeCardId) : null
  const attackStat = game.activeStat
  const attackValue = attackCard && attackStat ? attackCard.stats[attackStat] : null

  const turnText = game.phase === 'active_selecting'
    ? (iAmActive ? 'Your turn — tap a stat to attack' : `${active.name} is choosing…`)
    : (iMustDefend ? `Beat ${STAT_LABELS[attackStat]} ${attackValue} — pick a card` : 'Waiting for opponents…')

  return (
    <div className="pitch-bg min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center text-sm">
          <span className="font-display">Round {game.currentRound + 1}</span>
          <span className="text-gold font-display font-bold">{turnText}</span>
        </div>

        <div className="mt-4"><OpponentStrip players={game.players} activeId={active?.id} myId={myId} /></div>

        {/* Attack panel — shows what the active player played so defenders aren't blind */}
        {attackCard && attackStat && (
          <div className="mt-5 flex flex-col items-center">
            <div className="navy-card rounded-xl px-4 py-2 mb-3 text-center">
              <span className="text-gold font-display font-bold">
                {iAmActive ? 'You attack' : `${active.name} attacks`} with {STAT_LABELS[attackStat]}
              </span>
              <span className="ml-2 text-white font-display font-bold text-lg">{attackValue}</span>
              {iMustDefend && <div className="text-[11px] text-slate-200 mt-0.5">Play a card with a higher {STAT_LABELS[attackStat]} to win</div>}
            </div>
            <PlayerCard card={attackCard} selectedStat={attackStat} />
          </div>
        )}

        <div className="mt-6">
          {iMustDefend && <div className="text-center text-sm font-display text-gold mb-2">Your hand — pick a card to defend</div>}
          <div className="flex gap-3 overflow-x-auto pb-4 justify-start">
            {me?.hand.map(card => (
              <div key={card.id} className="shrink-0">
                <PlayerCard
                  card={card}
                  selectable={iAmActive && game.phase === 'active_selecting'}
                  selectedStat={
                    game.phase === 'active_selecting'
                      ? (iAmActive && game.activeCardId === card.id ? game.activeStat : null)
                      : (iMustDefend ? attackStat : null)
                  }
                  onPickStat={(stat) => pickActiveStat(card.id, stat)}
                />
                {iMustDefend && (
                  <button onClick={() => pickOpponentCard(card.id)} className="mt-2 w-full text-xs font-display font-bold bg-gold text-navy-deep rounded-lg py-1.5">
                    Play this card ({card.stats[attackStat]})
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <RoundResultOverlay result={roundResult} players={game.players} />
    </div>
  )
}
