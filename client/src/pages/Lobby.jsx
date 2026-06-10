import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useOnlineStore } from '../store/onlineStore.js'
import { getIdentity, setName } from '../lib/identity.js'
import ShareModal from '../components/lobby/ShareModal.jsx'
import Button from '../components/ui/Button.jsx'

export default function Lobby() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const store = useOnlineStore()
  const [name, setNm] = useState(getIdentity().name)
  const [timeOption, setTime] = useState(6)
  const [pick, setPick] = useState('trump') // 'trump' | 'guess' | 'mcq'
  const [joinCode, setJoinCode] = useState(params.get('room') || '')
  const [share, setShare] = useState(false)

  useEffect(() => { store.bind() }, [])
  useEffect(() => { if (store.state && !store.finished) nav('/online/game') }, [store.state, store.finished, nav])
  useEffect(() => { if (store.quiz?.mode && !store.quiz.ended) nav('/online/quiz') }, [store.quiz?.mode, store.quiz?.ended, nav])

  const me = () => { const id = setName(name); return { id: id.id, name: id.name, avatar: id.color } }
  const create = () => {
    const gameType = pick === 'trump' ? 'trump' : 'quiz'
    const quizMode = pick === 'guess' ? 'guess' : 'mcq'
    store.createRoom(me(), timeOption, 'international', gameType, quizMode)
  }
  const GAMES = [{ k: 'trump', label: '⚔️ Trump Cards' }, { k: 'guess', label: '🔎 Quiz: Guess (bingo)' }, { k: 'mcq', label: '✅ Quiz: MCQ' }]
  const join = () => joinCode.trim() && store.joinRoom(joinCode.trim().toUpperCase(), me())

  const inRoom = !!store.lobby
  const isHost = store.lobby && store.myId === store.lobby.hostId

  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6">
      <div className="navy-card rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-2xl font-bold text-gold">Play Online</h1>
          <span className={`text-[11px] font-display flex items-center gap-1 ${store.connected ? 'text-pitch-light' : 'text-amber-300'}`}>
            <span className={`w-2 h-2 rounded-full ${store.connected ? 'bg-pitch-light' : 'bg-amber-300 animate-pulse'}`} />
            {store.connected ? 'Connected' : 'Connecting…'}
          </span>
        </div>
        {store.error && <div className="text-red-300 text-sm mb-2">{store.error} <button className="underline" onClick={store.clearError}>dismiss</button></div>}

        {!inRoom && (
          <>
            <label className="text-sm">Your name
              <input value={name} onChange={e => setNm(e.target.value)} className="w-full mt-1 rounded-lg bg-navy-deep px-3 py-2" />
            </label>
            <div className="mt-4 text-sm">What to play
              <div className="flex gap-2 mt-1">{GAMES.map(g => (
                <button key={g.k} onClick={() => setPick(g.k)} className={`flex-1 rounded-lg py-2 text-xs font-display ${pick === g.k ? 'bg-gold text-navy-deep' : 'bg-navy-deep'}`}>{g.label}</button>
              ))}</div>
            </div>
            <div className="mt-4 text-sm">Room time
              <div className="flex gap-2 mt-1">{[4, 6, 8].map(t => (
                <button key={t} onClick={() => setTime(t)} className={`flex-1 rounded-lg py-2 font-display ${timeOption === t ? 'bg-gold text-navy-deep' : 'bg-navy-deep'}`}>{t} min</button>
              ))}</div>
            </div>
            <Button onClick={create} disabled={!store.connected} className="w-full mt-4">{store.connected ? 'Create room' : 'Connecting…'}</Button>
            <div className="text-center text-slate-300 my-3 text-sm">or join with a code</div>
            <div className="flex gap-2">
              <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="ABC123" className="flex-1 rounded-lg bg-navy-deep px-3 py-2 uppercase" />
              <Button variant="secondary" onClick={join} disabled={!store.connected || !joinCode.trim()}>Join</Button>
            </div>
          </>
        )}

        {inRoom && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-200">Room <b className="text-gold tracking-widest">{store.lobby.code}</b> · {store.lobby.gameType === 'quiz' ? `Quiz: ${store.lobby.quizMode === 'guess' ? 'Guess (bingo)' : 'MCQ'} · ${store.lobby.timeOption} min` : `${store.lobby.timeOption} min`}</span>
              <button onClick={() => setShare(true)} className="text-sm bg-white/10 rounded-lg px-3 py-1 font-display">Invite</button>
            </div>
            <ul className="mt-3">
              {store.lobby.players.map(p => (
                <li key={p.id} className="flex justify-between py-1.5 border-b border-white/10">
                  <span>{p.name}{p.id === store.lobby.hostId ? ' 👑' : ''}{p.id === store.myId ? ' (you)' : ''}</span>
                </li>
              ))}
            </ul>
            {isHost
              ? <Button onClick={store.startGame} disabled={store.lobby.players.length < 2} className="w-full mt-4">{store.lobby.players.length < 2 ? 'Waiting for players…' : 'Start game ⚽'}</Button>
              : <p className="text-center text-slate-300 mt-4 text-sm">Waiting for the host to start…</p>}
          </>
        )}
        <ShareModal open={share} onClose={() => setShare(false)} code={store.lobby?.code} />
      </div>
    </div>
  )
}
