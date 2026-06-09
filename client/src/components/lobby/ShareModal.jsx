import Modal from '../ui/Modal.jsx'

export default function ShareModal({ open, onClose, code }) {
  const url = `${window.location.origin}/online?room=${code}`
  const wa = `https://wa.me/?text=${encodeURIComponent(`Join my FootyTrump room ${code}: ${url}`)}`
  return (
    <Modal open={open} onClose={onClose} title="Invite friends">
      <div className="text-center">
        <div className="font-display text-3xl tracking-[0.3em] text-gold">{code}</div>
        <input readOnly value={url} className="w-full mt-3 rounded-lg bg-navy-deep px-3 py-2 text-sm" onFocus={e => e.target.select()} />
        <div className="flex gap-2 mt-3">
          <button onClick={() => navigator.clipboard?.writeText(url)} className="flex-1 bg-white/10 rounded-lg py-2 font-display">Copy link</button>
          <a href={wa} target="_blank" rel="noreferrer" className="flex-1 bg-pitch rounded-lg py-2 font-display text-center">WhatsApp</a>
        </div>
      </div>
    </Modal>
  )
}
