import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@mini-erp.dev'
const ADMIN_PASSWORD = 'Admin@1234!'

test.describe('Auth flow', () => {
  test('unauthenticated user visiting /dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('login with valid credentials lands on /dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
  })

  test('authenticated user can reach /products', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })

    // Navigate to protected page
    await page.goto('/products')
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('login with wrong credentials shows an error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
