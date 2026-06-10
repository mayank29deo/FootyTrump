import { io } from 'socket.io-client'

const PRIMARY = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
let socket = null

const OPTIONS = {
  autoConnect: true,
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity, // never permanently give up — survives server redeploys / mobile sleeps
  reconnectionDelay: 800,
  reconnectionDelayMax: 4000,
  timeout: 20000,
}

export function getSocket() {
  if (!socket) {
    socket = io(PRIMARY, OPTIONS)
    // iOS Safari suspends background tabs (freezing the socket). Revive when the
    // page returns to the foreground or the network comes back.
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
  // not yet connected — send as soon as we are, and make sure we're actually trying to connect
  s.once('connect', () => s.emit(event, data))
  if (s.disconnected) s.connect() // revive an inactive/exhausted socket so the queued emit can flush
}
