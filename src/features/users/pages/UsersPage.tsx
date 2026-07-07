import { Plus, Search, Edit2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { usePermission } from '@/features/auth/hooks/usePermission'
import { cn } from '@/lib/utils'

import { UserFormDialog } from '../components/UserFormDialog'
import { useUsers, useCreateUser, useUpdateUser } from '../hooks/users-hooks'

import type { User, CreateUserPayload, UpdateUserPayload } from '../types'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const canCreate = usePermission('user:create')
  const canUpdate = usePermission('user:update')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>()

  const { data: usersData, isLoading } = useUsers({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
  })

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    // Basic debounce for simplicity
    setTimeout(() => {
      setDebouncedSearch(e.target.value)
      setPage(1)
    }, 500)
  }

  const openCreateDialog = () => {
    setEditingUser(undefined)
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const handleCreate = async (payload: CreateUserPayload) => {
    await createUserMutation.mutateAsync(payload)
  }

  const handleUpdate = async (payload: UpdateUserPayload) => {
    if (!editingUser) return
    // Remove password if empty string was provided during update
    if (payload.password === '') {
      delete payload.password
    }
    await updateUserMutation.mutateAsync({ id: editingUser._id, payload })
  }

  const users = usersData?.data || []
  const meta = usersData?.meta

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage system users and their roles.</p>
        </div>
        {canCreate && (
          <Button onClick={openCreateDialog} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              {canUpdate && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    {user.name}
                    {currentUser?._id === user._id && (
                      <span className="ml-2 text-xs text-slate-500 font-normal">(You)</span>
                    )}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role?.name || 'Unknown'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? 'default' : 'secondary'}
                      className={cn(
                        user.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20'
                          : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {canUpdate && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(user)}
                        aria-label="Edit user"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {meta && meta.total > meta.limit && (
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-muted-foreground">
              Showing {(meta.page - 1) * meta.limit + 1} to{' '}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * meta.limit >= meta.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={editingUser}
        isSelf={!!editingUser && editingUser._id === currentUser?._id}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
      />
    </div>
  )
}
