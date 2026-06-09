import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSoloStore } from '../store/soloStore.js'
import PlayerCard from '../components/game/PlayerCard.jsx'
import OpponentStrip from '../components/game/OpponentStrip.jsx'
import RoundResultOverlay from '../components/game/RoundResultOverlay.jsx'

export default function SoloGame() {
  const nav = useNavigate()
  const { game, myId, roundResult, finished, pickActiveStat, pickOpponentCard } = useSoloStore()

  useEffect(() => { if (!game) nav('/solo/setup') }, [game, nav])
  useEffect(() => { if (finished) nav('/results') }, [finished, nav])
  if (!game) return null

  const me = game.players.find(p => p.id === myId)
  const active = game.players[game.activePlayerIndex]
  const iAmActive = active?.id === myId
  const iMustDefend = game.phase === 'opponents_selecting' && !game.opponentSelections[myId] && me?.hand.length > 0

  const turnText = game.phase === 'active_selecting'
    ? (iAmActive ? 'Your turn — tap a stat to attack' : `${active.name} is choosing…`)
    : (iMustDefend ? 'Pick a card to defend' : 'Waiting for opponents…')

  return (
    <div className="pitch-bg min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center text-sm">
          <span className="font-display">Round {game.currentRound + 1}</span>
          <span className="text-gold font-display font-bold">{turnText}</span>
        </div>

        <div className="mt-4"><OpponentStrip players={game.players} activeId={active?.id} myId={myId} /></div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-4 justify-start">
          {me?.hand.map(card => (
            <div key={card.id} className="shrink-0">
              <PlayerCard
                card={card}
                selectable={iAmActive && game.phase === 'active_selecting'}
                selectedStat={iAmActive && game.activeCardId === card.id ? game.activeStat : null}
                onPickStat={(stat) => pickActiveStat(card.id, stat)}
              />
              {iMustDefend && (
                <button onClick={() => pickOpponentCard(card.id)} className="mt-2 w-full text-xs font-display font-bold bg-gold text-navy-deep rounded-lg py-1.5">Play this card</button>
              )}
            </div>
          ))}
        </div>
      </div>
      <RoundResultOverlay result={roundResult} players={game.players} />
    </div>
  )
}
