import { createBrowserRouter } from 'react-router-dom'

import LoginPage from '@/features/auth/components/LoginPage'
import DashboardPage from '@/features/dashboard/components/DashboardPage'
import CreateProductPage from '@/features/products/pages/CreateProductPage'
import EditProductPage from '@/features/products/pages/EditProductPage'
import ProductListPage from '@/features/products/pages/ProductListPage'
import SalesPage from '@/features/sales/components/SalesPage'

import ProtectedRoute from './ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/products',
    element: (
      <ProtectedRoute requiredPermission="product:view">
        <ProductListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/products/new',
    element: (
      <ProtectedRoute requiredPermission="product:create">
        <CreateProductPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/products/:id/edit',
    element: (
      <ProtectedRoute requiredPermission="product:update">
        <EditProductPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sales',
    element: (
      <ProtectedRoute>
        <SalesPage />
      </ProtectedRoute>
    ),
  },
])

export default router
