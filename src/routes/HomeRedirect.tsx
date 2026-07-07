import { Navigate } from 'react-router-dom'

import { usePermission } from '@/features/auth/hooks/usePermission'

export default function HomeRedirect() {
  const canViewDashboard = usePermission('dashboard:view')
  return <Navigate to={canViewDashboard ? '/dashboard' : '/products'} replace />
}
