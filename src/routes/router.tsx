import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import LoginPage from '@/features/auth/components/LoginPage'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import CreateProductPage from '@/features/products/pages/CreateProductPage'
import EditProductPage from '@/features/products/pages/EditProductPage'
import ProductListPage from '@/features/products/pages/ProductListPage'
import CreateSalePage from '@/features/sales/pages/CreateSalePage'
import SaleHistoryPage from '@/features/sales/pages/SaleHistoryPage'

import ProtectedRoute from './ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    // Base protection for all layout routes
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute requiredPermission="dashboard:view">
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredPermission="dashboard:view">
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'products',
        element: (
          <ProtectedRoute requiredPermission="product:view">
            <ProductListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'products/new',
        element: (
          <ProtectedRoute requiredPermission="product:create">
            <CreateProductPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'products/:id/edit',
        element: (
          <ProtectedRoute requiredPermission="product:update">
            <EditProductPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sales',
        element: <CreateSalePage />, // Base ProtectedRoute already covers general auth
      },
      {
        path: 'sales/history',
        element: (
          <ProtectedRoute requiredPermission="sale:view">
            <SaleHistoryPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
])

export default router
