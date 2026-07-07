import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '@/features/auth/components/LoginPage'
import DashboardPage from '@/features/dashboard/components/DashboardPage'
import ProductsPage from '@/features/products/components/ProductsPage'
import SalesPage from '@/features/sales/components/SalesPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: '/products',
    element: <ProtectedRoute><ProductsPage /></ProtectedRoute>,
  },
  {
    path: '/sales',
    element: <ProtectedRoute><SalesPage /></ProtectedRoute>,
  },
])

export default router
