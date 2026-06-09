import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSoloStore } from '../store/soloStore.js'
import { getIdentity, setName } from '../lib/identity.js'
import Button from '../components/ui/Button.jsx'

export default function SoloSetup() {
  const nav = useNavigate()
  const start = useSoloStore(s => s.start)
  const [name, setNameInput] = useState(getIdentity().name)
  const [botCount, setBotCount] = useState(1)
  const [difficulty, setDifficulty] = useState('medium')

  function play() {
    const me = setName(name)
    start({ humanName: me.name, botCount, difficulty })
    nav('/solo')
  }

  return (
    <div className="pitch-bg min-h-screen grid place-items-center p-6">
      <div className="navy-card rounded-2xl p-6 w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-gold mb-4">Solo vs CPU</h1>
        <label className="text-sm">Your name
          <input value={name} onChange={e => setNameInput(e.target.value)} className="w-full mt-1 rounded-lg bg-navy-deep px-3 py-2 text-white" />
        </label>
        <div className="mt-4 text-sm">CPU opponents
          <div className="flex gap-2 mt-1">{[1, 2, 3].map(n => (
            <button key={n} onClick={() => setBotCount(n)} className={`flex-1 rounded-lg py-2 font-display ${botCount === n ? 'bg-gold text-navy-deep' : 'bg-navy-deep'}`}>{n}</button>
          ))}</div>
        </div>
        <div className="mt-4 text-sm">Difficulty
          <div className="flex gap-2 mt-1">{['easy', 'medium', 'hard'].map(d => (
            <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 rounded-lg py-2 font-display capitalize ${difficulty === d ? 'bg-gold text-navy-deep' : 'bg-navy-deep'}`}>{d}</button>
          ))}</div>
        </div>
        <Button onClick={play} className="w-full mt-6">Kick off ⚽</Button>
      </div>
    </div>
  )
}
