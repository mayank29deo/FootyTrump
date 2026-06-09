// guest identity in localStorage (no login wall)
const KEY = 'footytrump.identity'
const COLORS = ['#1d4ed8', '#7c3aed', '#b45309', '#065f46', '#9f1239', '#0e7490']

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'g-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function getIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.id) return saved
  } catch { /* ignore */ }
  const created = { id: uuid(), name: 'Player', color: COLORS[Math.floor(Math.random() * COLORS.length)] }
  localStorage.setItem(KEY, JSON.stringify(created))
  return created
}

export function setName(name) {
  const id = getIdentity()
  const updated = { ...id, name: name.trim().slice(0, 20) || 'Player' }
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}
