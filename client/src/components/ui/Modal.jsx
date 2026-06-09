export default function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="navy-card rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
        {title && <h2 className="font-display font-bold text-xl mb-3 text-gold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
