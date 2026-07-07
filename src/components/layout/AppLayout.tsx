import { LayoutDashboard, Package, ShoppingCart, LogOut, UserCircle, Menu } from 'lucide-react'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/features/auth/api'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { usePermission } from '@/features/auth/hooks/usePermission'
import { cn } from '@/lib/utils'
import { tokenCleared } from '@/store/slices/authSlice'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const canViewDashboard = usePermission('dashboard:view')
  const canViewProducts = usePermission('product:view')
  const canViewSales = usePermission('sale:view')

  // We assume any authenticated user can create sales (POS).
  // Strictly, they need `sale:create`, but for navigation simplify it.
  // We'll show POS for everyone.

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, show: canViewDashboard },
    { name: 'Products', path: '/products', icon: Package, show: canViewProducts },
    {
      name: 'POS (Sell)',
      path: '/sales',
      icon: ShoppingCart,
      show: true,
      exact: false,
      children: [
        { name: 'Sell', path: '/sales', show: true, exact: true },
        { name: 'Sale History', path: '/sales/history', show: canViewSales, exact: true },
      ],
    },
  ].filter((item) => item.show)

  const handleLogout = async () => {
    try {
      await logout()
      dispatch(tokenCleared())
      navigate('/login')
    } catch {
      toast.error('Failed to logout. Please try again.')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-56 transform border-r bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 dark:bg-slate-900 dark:border-slate-800',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center border-b px-4 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            Mini-ERP
          </div>
        </div>

        <nav className="space-y-0.5 p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const activeClass = 'bg-primary text-primary-foreground shadow-sm'
            const inactiveClass =
              'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50'

            return (
              <div key={item.path} className="space-y-0.5">
                <NavLink
                  to={item.path}
                  end={item.exact}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                      isActive ? activeClass : inactiveClass,
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </NavLink>

                {item.children && (
                  <div className="ml-6 mt-0.5 space-y-0.5 border-l-2 border-slate-200 pl-3 dark:border-slate-800">
                    {item.children
                      .filter((c) => c.show)
                      .map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          end={child.exact}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-primary-foreground'
                                : inactiveClass,
                            )
                          }
                        >
                          {child.name}
                        </NavLink>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex w-full flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(true)}
              data-testid="menu-button"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <UserCircle className="h-6 w-6 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2 border-b mb-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <div className="mt-2 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold w-fit">
                    {user?.role.name}
                  </div>
                </div>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer rounded-sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
