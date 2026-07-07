import { QueryClientProvider } from '@tanstack/react-query'
import { Provider as ReduxProvider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'
import SessionInitializer from '@/features/auth/components/SessionInitializer'
import queryClient from '@/lib/api/queryClient'
import router from '@/routes/router'
import { store } from '@/store/store'

export default function App() {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <SessionInitializer />
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ReduxProvider>
  )
}
