import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setToken } from '@/lib/auth/tokenStore'
import { tokenAcquired } from '@/store/slices/authSlice'

import { login } from '../api'

import type { AppDispatch } from '@/store/store'

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@mini-erp.dev', password: 'Admin@1234!' },
  { label: 'Manager', email: 'manager@mini-erp.dev', password: 'Manager@1234!' },
  { label: 'Employee', email: 'employee@mini-erp.dev', password: 'Employee@1234!' },
] as const

interface FieldErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!email.trim()) errors.email = 'Email is required'
  if (!password) errors.password = 'Password is required'
  return errors
}

export default function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    const errors = validate(email, password)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setIsPending(true)

    try {
      const { accessToken } = await login(email, password)
      setToken(accessToken)
      dispatch(tokenAcquired())
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please try again.'
      setApiError(msg)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" role="alert" className="text-sm text-destructive">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
        />
        {fieldErrors.password && (
          <p id="password-error" role="alert" className="text-sm text-destructive">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {apiError && (
        <p role="alert" className="text-sm text-destructive">
          {apiError}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Demo accounts</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DEMO_ACCOUNTS.map(({ label, email: demoEmail, password: demoPassword }) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEmail(demoEmail)
              setPassword(demoPassword)
              setFieldErrors({})
              setApiError(null)
            }}
          >
            {label}
          </Button>
        ))}
      </div>
    </form>
  )
}
