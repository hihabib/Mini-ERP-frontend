import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiClientError } from '@/lib/api/ApiClientError'

import { useRoles } from '../hooks/users-hooks'

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  isActive: z.boolean().optional(),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
  defaultValues?: Partial<UserFormValues>
  onSubmit: (data: UserFormValues) => Promise<void>
  isCreate?: boolean
  isSelf?: boolean
  submitLabel?: string
}

export function UserForm({
  defaultValues,
  onSubmit,
  isCreate = false,
  isSelf = false,
  submitLabel = 'Save',
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(
      isCreate
        ? userSchema.extend({
            password: z.string().min(6, 'Password must be at least 6 characters'),
          })
        : userSchema,
    ),
    defaultValues: { isActive: true, ...defaultValues },
  })

  const { data: roles = [], isLoading: rolesLoading } = useRoles()

  const roleValue = watch('role')
  const isActiveValue = watch('isActive')

  async function onValid(values: UserFormValues) {
    try {
      await onSubmit(values)
    } catch (err) {
      if (err instanceof ApiClientError && err.errors) {
        for (const [field, message] of Object.entries(err.errors)) {
          setError(field as keyof UserFormValues, { message: String(message) })
        }
      } else {
        // general error handling might be handled by mutation onError, but we can also set root error here
        setError('root', { message: err instanceof Error ? err.message : 'An error occurred' })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-5">
      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      {(isCreate || defaultValues?.password !== undefined) && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">
            Password{' '}
            {isCreate ? (
              <span className="text-destructive">*</span>
            ) : (
              '(Leave empty to keep unchanged)'
            )}
          </Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            aria-invalid={!!errors.password}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role">Role</Label>
        <Select
          disabled={rolesLoading}
          value={roleValue}
          onValueChange={(val) => setValue('role', val, { shouldValidate: true })}
        >
          <SelectTrigger id="role" aria-invalid={!!errors.role}>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role._id} value={role._id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      {!isCreate && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4"
              checked={isActiveValue}
              disabled={isSelf}
              onChange={(e) => setValue('isActive', e.target.checked)}
            />
            <Label
              htmlFor="isActive"
              className={isSelf ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}
            >
              Active Account
            </Label>
          </div>
          {isSelf && (
            <p className="text-xs text-muted-foreground">You cannot deactivate your own account.</p>
          )}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
