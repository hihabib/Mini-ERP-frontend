import { createSlice } from '@reduxjs/toolkit'

interface AuthState {
  hasToken: boolean
  initialized: boolean
}

const initialState: AuthState = {
  hasToken: false,
  initialized: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    tokenAcquired: (state) => {
      state.hasToken = true
      state.initialized = true
    },
    tokenCleared: (state) => {
      state.hasToken = false
      state.initialized = true
    },
  },
})

export const { tokenAcquired, tokenCleared } = authSlice.actions
export default authSlice.reducer
