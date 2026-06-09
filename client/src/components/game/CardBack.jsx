export default function CardBack({ compact = false }) {
  return (
    <div className={`rounded-xl grid place-items-center bg-gradient-to-br from-pitch to-pitch-dark border-2 border-gold-trim ${compact ? 'w-[74px] h-[104px]' : 'w-[140px] h-[196px]'}`}>
      <div className="text-center text-gold-light">
        <div className="text-3xl">⚽</div>
        <div className="text-[8px] font-display font-bold tracking-[0.2em] mt-1">TRUMP</div>
      </div>
    </div>
  )
}
