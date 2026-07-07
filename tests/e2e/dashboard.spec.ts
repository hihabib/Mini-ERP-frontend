import path from 'path'
import { fileURLToPath } from 'url'

import { test, expect, type Page } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ADMIN_EMAIL = 'admin@mini-erp.dev'
const ADMIN_PASSWORD = 'Admin@1234!'

const TEST_SKU = `DASH-E2E-${Date.now()}`
const PRODUCT_NAME = 'Dash E2E Widget'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
}

// ─── Test product setup ───────────────────────────────────────────────────────

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)

  await page.goto('/products/new')
  await page.getByLabel(/name/i).fill(PRODUCT_NAME)
  await page.getByLabel(/sku/i).fill(TEST_SKU)
  await page.getByLabel(/category/i).fill('E2E')
  await page.getByLabel(/purchase price/i).fill('5')
  await page.getByLabel(/selling price/i).fill('10')
  await page.getByLabel(/stock quantity/i).fill('50')
  await page.getByLabel(/image/i).setInputFiles(path.resolve(__dirname, 'fixtures/test-image.jpg'))
  await page.getByRole('button', { name: /create product/i }).click()

  await expect(page).toHaveURL(/\/products$/, { timeout: 10_000 })
  await expect(page.getByText(TEST_SKU)).toBeVisible({ timeout: 8_000 })

  await page.close()
})

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage()
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)
  await page.goto('/products')
  await page.waitForLoadState('networkidle')

  const row = page.getByRole('row').filter({ hasText: TEST_SKU })
  if (await row.isVisible({ timeout: 5_000 })) {
    await row.getByRole('button', { name: /delete/i }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: /^delete$/i }).click()
  }

  await page.close()
})

// ─── Dashboard — Admin ────────────────────────────────────────────────────────

test.describe('Dashboard — Admin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)
  })

  test('shows all three stat cards', async ({ page }) => {
    // Mock stats so the test is independent of real DB counts
    await page.route('**/api/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalProducts: 12,
            totalSales: 7,
            totalRevenue: 350.0,
            lowStockProducts: [],
            lowStockCount: 0,
          },
        }),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByTestId('stat-total-products')).toHaveText('12', { timeout: 8_000 })
    await expect(page.getByTestId('stat-total-sales')).toHaveText('7')
    await expect(page.getByTestId('stat-total-revenue')).toHaveText('$350.00')
  })

  test('low-stock list shows warning badges and overflow count', async ({ page }) => {
    await page.route('**/api/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalProducts: 20,
            totalSales: 3,
            totalRevenue: 100.0,
            lowStockProducts: [
              { _id: 'ls1', name: 'Almost Gone', sku: 'AG-001', stockQuantity: 2 },
              { _id: 'ls2', name: 'Nearly Out', sku: 'NO-001', stockQuantity: 4 },
            ],
            lowStockCount: 5,
          },
        }),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByTestId('low-stock-count-badge')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByTestId('low-stock-count-badge')).toHaveText('5 Issues')
    await expect(page.getByTestId('low-stock-item-ls1')).toBeVisible()
    await expect(page.getByTestId('low-stock-item-ls2')).toBeVisible()
    await expect(page.getByText(/\+3 more products running low/)).toBeVisible()
  })

  test('stats refresh after a sale — dashboard auto-refetches on navigation', async ({ page }) => {
    // Prove the dashboard refetches when navigated to (TanStack Query staleTime = 0).
    // beforeEach already loaded /dashboard with real API values; page.reload() forces
    // a fresh load with the route mock active, avoiding a same-URL no-op issue.

    const statsBody = (totalSales: number, totalRevenue: number) =>
      JSON.stringify({
        success: true,
        data: {
          totalProducts: 10,
          totalSales,
          totalRevenue,
          lowStockProducts: [],
          lowStockCount: 0,
        },
      })

    // Step 1: register pre-sale stats mock, then reload to activate it
    await page.route('**/api/dashboard/stats', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: statsBody(5, 500.0) }),
    )

    // Mock POST /sales — local MongoDB lacks replica set for transactions
    await page.route('**/api/sales', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Sale created successfully',
            data: {
              _id: 'mock-sale-id',
              items: [
                {
                  product: 'mock-product-id',
                  productNameSnapshot: PRODUCT_NAME,
                  quantity: 1,
                  unitPriceSnapshot: 10,
                  subtotal: 10,
                },
              ],
              grandTotal: 10.0,
              soldBy: 'mock-admin-id',
              createdAt: new Date().toISOString(),
            },
          }),
        })
      } else {
        await route.continue()
      }
    })

    // page.reload() forces a full browser reload of the current /dashboard page,
    // clearing TanStack Query cache so the fresh fetch hits the mock above.
    await page.reload()
    await expect(page.getByTestId('stat-total-sales')).toHaveText('5', { timeout: 8_000 })
    await expect(page.getByTestId('stat-total-revenue')).toHaveText('$500.00')

    // Step 2: navigate to sales and create a sale
    await page.goto('/sales')
    const searchInput = page.getByLabel(/search products/i)
    await searchInput.fill(TEST_SKU)
    const resultRow = page.getByRole('row').filter({ hasText: TEST_SKU }).first()
    await expect(resultRow).toBeVisible({ timeout: 8_000 })
    await resultRow.click()
    await page.getByRole('button', { name: /complete sale/i }).click()
    await expect(page.getByText(/sale created/i)).toBeVisible({ timeout: 8_000 })

    // Step 3: swap mock to post-sale values, navigate back — TanStack Query refetches stale data
    await page.unroute('**/api/dashboard/stats')
    await page.route('**/api/dashboard/stats', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: statsBody(6, 510.0) }),
    )

    await page.goto('/dashboard')
    await expect(page.getByTestId('stat-total-sales')).toHaveText('6', { timeout: 8_000 })
    await expect(page.getByTestId('stat-total-revenue')).toHaveText('$510.00')
  })
})
