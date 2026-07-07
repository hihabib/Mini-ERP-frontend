import { useEffect, type ReactNode } from 'react'
import { useSelector } from 'react-redux'

import { useDashboardInvalidation } from '@/features/dashboard/hooks/useDashboardInvalidation'
import { useStockUpdates } from '@/features/products/hooks/useStockUpdates'
import { getToken } from '@/lib/auth/tokenStore'
import { connectSocket, disconnectSocket } from '@/lib/socket/socketClient'

import type { RootState } from '@/store/store'

function SocketEffects() {
  useStockUpdates()
  useDashboardInvalidation()
  return null
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { hasToken, initialized } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (initialized && hasToken) {
      const token = getToken()
      if (token) connectSocket(token)
    } else if (initialized && !hasToken) {
      disconnectSocket()
    }
  }, [hasToken, initialized])

  return (
    <>
      <SocketEffects />
      {children}
    </>
  )
}
