import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { setToken } from '@/lib/auth/tokenStore'
import { tokenAcquired, tokenCleared } from '@/store/slices/authSlice'

import { refresh } from '../api'

import type { AppDispatch } from '@/store/store'

export default function SessionInitializer() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    refresh()
      .then(({ accessToken }) => {
        setToken(accessToken)
        dispatch(tokenAcquired())
      })
      .catch(() => {
        dispatch(tokenCleared())
      })
  }, [dispatch])

  return null
}
