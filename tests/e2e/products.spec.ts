import path from 'path'
import { fileURLToPath } from 'url'

import { test, expect, type Page } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ADMIN_EMAIL = 'admin@mini-erp.dev'
const ADMIN_PASSWORD = 'Admin@1234!'
const EMPLOYEE_EMAIL = 'employee@mini-erp.dev'
const EMPLOYEE_PASSWORD = 'Employee@1234!'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
}

// ─── Admin flow ───────────────────────────────────────────────────────────────

test.describe('Products — Admin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)
  })

  test('can see Add Product button on /products', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('button', { name: /add product/i })).toBeVisible({ timeout: 8_000 })
  })

  test('full CRUD: create → edit (low-stock) → delete', async ({ page }) => {
    const testSku = `E2E-${Date.now()}`

    // ── Create ────────────────────────────────────────────────────────────────
    await page.goto('/products/new')
    await page.getByLabel(/name/i).fill('E2E Test Widget')
    await page.getByLabel(/sku/i).fill(testSku)
    await page.getByLabel(/category/i).fill('E2E Category')
    await page.getByLabel(/purchase price/i).fill('5')
    await page.getByLabel(/selling price/i).fill('10')
    await page.getByLabel(/stock quantity/i).fill('20')

    // Upload a real image fixture
    const imagePath = path.resolve(__dirname, 'fixtures/test-image.jpg')
    await page.getByLabel(/image/i).setInputFiles(imagePath)
    // Verify preview appears
    await expect(page.getByAltText(/product preview/i)).toBeVisible()

    await page.getByRole('button', { name: /create product/i }).click()

    // Should redirect back to list and show the new product
    await expect(page).toHaveURL(/\/products$/, { timeout: 10_000 })
    await expect(page.getByText('E2E Test Widget')).toBeVisible({ timeout: 8_000 })

    // ── Edit: set stock below 5 to trigger low-stock flag ────────────────────
    await page.getByRole('button', { name: /edit e2e test widget/i }).click()
    await expect(page).toHaveURL(/\/products\/.+\/edit/, { timeout: 5_000 })

    const stockInput = page.getByLabel(/stock quantity/i)
    await stockInput.clear()
    await stockInput.fill('3')
    await page.getByRole('button', { name: /save changes/i }).click()

    await expect(page).toHaveURL(/\/products$/, { timeout: 10_000 })

    // Low-stock badge should appear for the updated product
    await expect(page.getByTestId('low-stock-badge').first()).toBeVisible({ timeout: 8_000 })

    // ── Delete ────────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /delete e2e test widget/i }).click()

    // Confirm dialog
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: /^delete$/i }).click()

    // Product should disappear
    await expect(page.getByText('E2E Test Widget')).not.toBeVisible({ timeout: 8_000 })
  })
})

// ─── Employee flow ────────────────────────────────────────────────────────────

test.describe('Products — Employee', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD)
  })

  test('can view /products but has no Add Product button', async ({ page }) => {
    await page.goto('/products')
    // List loads successfully
    await expect(page).not.toHaveURL(/\/login/)
    // Add button must not be present
    await expect(page.getByRole('button', { name: /add product/i })).not.toBeVisible()
  })

  test('has no Edit or Delete action buttons', async ({ page }) => {
    await page.goto('/products')
    // If there are any products, make sure edit/delete buttons are absent
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: /edit /i }).first()).not.toBeVisible()
    await expect(page.getByRole('button', { name: /delete /i }).first()).not.toBeVisible()
  })
})
