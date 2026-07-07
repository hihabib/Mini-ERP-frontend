import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoginPage from './components/LoginPage'

describe('LoginPage', () => {
  it('renders the login heading', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
  })
})
