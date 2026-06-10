import { io } from 'socket.io-client'

const PRIMARY = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
export const SERVER_URL = PRIMARY
export function currentTransport() { try { return socket?.io?.engine?.transport?.name || '—' } catch { return '—' } }
let socket = null

const OPTIONS = {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  tryAllTransports: true,
  reconnection: true,
  reconnectionAttempts: Infinity, // never permanently give up — survives redeploys / mobile sleeps
  reconnectionDelay: 800,
  reconnectionDelayMax: 4000,
  timeout: 20000,
}

export function getSocket() {
  if (!socket) {
    socket = io(PRIMARY, OPTIONS)
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
  if (s.disconnected) s.connect()
}
