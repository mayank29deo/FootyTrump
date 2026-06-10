import { io } from 'socket.io-client'

// Same pattern as the cricket game: a primary server (Railway — fast) and a fallback
// (Render — Cloudflare-fronted, reachable on mobile data). Before connecting we
// health-check the candidates and connect to whichever the network can actually reach.
const PRIMARY = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '')
const FALLBACK = import.meta.env.VITE_FALLBACK_URL || ''
export const CANDIDATES = [PRIMARY, FALLBACK].filter(Boolean)

let socket = null
let activeUrl = CANDIDATES[0] || PRIMARY
export const getActiveUrl = () => activeUrl || '(none)'
export function setActiveUrl(url) { activeUrl = url }
export function currentTransport() { try { return socket?.io?.engine?.transport?.name || '—' } catch { return '—' } }

const OPTIONS = {
  autoConnect: false, // connect only AFTER the preflight picks a reachable server
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 4000,
  timeout: 20000,
}

export function getSocket() {
  if (!socket) {
    socket = io(activeUrl, OPTIONS)
    if (typeof window !== 'undefined') {
      const revive = () => { if (socket && socket.disconnected) socket.connect() }
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') revive() })
      window.addEventListener('online', revive)
      window.addEventListener('focus', revive)
    }
  }
  return socket
}

export function resetSocket() {
  if (socket) { socket.removeAllListeners(); socket.disconnect(); socket = null }
}

// Health-check candidates; return the first reachable URL (or null). Primary (Railway)
// gets a short timeout (fast on WiFi); the fallback (Render) a long one to allow the
// free-tier cold start (~30s).
export async function resolveServerUrl(onStatus) {
  for (let i = 0; i < CANDIDATES.length; i++) {
    const url = CANDIDATES[i]
    if (i > 0) onStatus?.('Waking up backup server… (~30s)')
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(i === 0 ? 6000 : 60000) })
      if (res.ok) return url
    } catch { /* unreachable — try the next candidate */ }
  }
  return null
}

export function emit(event, data) {
  const s = getSocket()
  if (s.connected) { s.emit(event, data); return }
  s.once('connect', () => s.emit(event, data))
  if (s.disconnected) s.connect()
}
