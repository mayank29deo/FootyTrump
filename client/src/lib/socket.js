import { io } from 'socket.io-client'

const PRIMARY = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
let socket = null

export function getSocket() {
  if (!socket) socket = io(PRIMARY, { autoConnect: true, transports: ['polling', 'websocket'], reconnection: true, reconnectionAttempts: 10 })
  return socket
}

export function emit(event, data) {
  const s = getSocket()
  if (s.connected) s.emit(event, data)
  else s.once('connect', () => s.emit(event, data))
}
