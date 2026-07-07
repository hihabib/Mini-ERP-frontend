import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL as string, {
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
