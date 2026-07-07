import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { UserForm } from './UserForm'

import type { User, CreateUserPayload, UpdateUserPayload } from '../types'

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
  isSelf?: boolean
  onSubmitCreate?: (data: CreateUserPayload) => Promise<void>
  onSubmitUpdate?: (data: UpdateUserPayload) => Promise<void>
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  isSelf = false,
  onSubmitCreate,
  onSubmitUpdate,
}: UserFormDialogProps) {
  const isCreate = !user

  const handleSubmit = async (data: any) => {
    if (isCreate && onSubmitCreate) {
      await onSubmitCreate(data)
    } else if (onSubmitUpdate) {
      await onSubmitUpdate(data)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Create User' : 'Edit User'}</DialogTitle>
        </DialogHeader>
        <UserForm
          isCreate={isCreate}
          isSelf={isSelf}
          defaultValues={
            user
              ? {
                  name: user.name,
                  email: user.email,
                  role: user.role._id,
                  isActive: user.isActive,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          submitLabel={isCreate ? 'Create' : 'Save Changes'}
        />
      </DialogContent>
    </Dialog>
  )
}
