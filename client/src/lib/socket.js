import { io } from 'socket.io-client'

// Root cause of "Connecting… forever" on mobile data: the Railway host is IPv4-only,
// and IPv6-only mobile carriers (e.g. Jio) can't reach it. The page loads because
// Vercel is dual-stack. Fix: in production the client talks to the SAME origin
// (Vercel), which proxies /socket.io to Railway via a vercel.json rewrite — so the
// phone only ever connects to Vercel, which it can reach on any network.
// Dev connects to the local server directly.
const PRIMARY = import.meta.env.DEV ? (import.meta.env.VITE_SERVER_URL || 'http://localhost:3001') : undefined
export const SERVER_URL = PRIMARY || 'same-origin (Vercel→Railway proxy)'
let socket = null

const OPTIONS = {
  autoConnect: true,
  // Vercel rewrites can't proxy WebSocket upgrades, so production uses HTTP polling
  // (works through the proxy and through carrier proxies). Dev connects directly and
  // can use WebSocket.
  transports: import.meta.env.DEV ? ['websocket', 'polling'] : ['polling'],
  reconnection: true,
  reconnectionAttempts: Infinity, // never permanently give up — survives redeploys / mobile sleeps
  reconnectionDelay: 800,
  reconnectionDelayMax: 4000,
  timeout: 20000,
}

export function currentTransport() { try { return socket?.io?.engine?.transport?.name || '—' } catch { return '—' } }

export function getSocket() {
  if (!socket) {
    socket = io(PRIMARY, OPTIONS)
    // iOS Safari suspends background tabs; revive on foreground / network return.
    if (typeof window !== 'undefined') {
      const revive = () => { if (socket && socket.disconnected) socket.connect() }
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') revive() })
      window.addEventListener('online', revive)
      window.addEventListener('focus', revive)
    }
  }
  return socket
}

export function emit(event, data) {
  const s = getSocket()
  if (s.connected) { s.emit(event, data); return }
  s.once('connect', () => s.emit(event, data))
  if (s.disconnected) s.connect() // revive an inactive socket so the queued emit can flush
}
