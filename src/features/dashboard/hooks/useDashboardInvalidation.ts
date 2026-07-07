import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { getSocket } from '@/lib/socket/socketClient'

export function useDashboardInvalidation() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = getSocket()

    function invalidate() {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
    }

    socket.on('sale:created', invalidate)
    socket.on('stock:updated', invalidate)

    return () => {
      socket.off('sale:created', invalidate)
      socket.off('stock:updated', invalidate)
    }
  }, [queryClient])
}
