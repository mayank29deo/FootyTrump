export default function GameTimer({ label, seconds }) {
  if (seconds == null) return null
  const m = Math.floor(seconds / 60), s = seconds % 60
  const low = seconds <= 10
  return (
    <span className={`font-display font-bold ${low ? 'text-red-400 animate-pulse' : 'text-white'}`}>
      {label} {m}:{String(s).padStart(2, '0')}
    </span>
  )
}
