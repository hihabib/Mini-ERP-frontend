import { io, type Socket } from 'socket.io-client'

import { env } from '@/config/env'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(env.socketUrl, {
      autoConnect: false,
      withCredentials: true,
    })
  }
  return socket
}

export function connectSocket(token: string): void {
  const s = getSocket()
  s.auth = { token }
  s.connect()
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
