import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { getMe } from '../api'

import type { RootState } from '@/store/store'

export function useAuth() {
  const { hasToken, initialized } = useSelector((state: RootState) => state.auth)

  const { data: user, isPending } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: initialized && hasToken,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  const isLoading = !initialized || (initialized && hasToken && isPending)
  const isAuthenticated = initialized && hasToken && !!user

  return { user: user ?? null, isAuthenticated, isLoading }
}
