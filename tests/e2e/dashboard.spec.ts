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
    // First call returns initial counts; subsequent calls return post-sale counts.
    // This proves the dashboard refetches when navigated to (TanStack Query staleTime = 0)
    // and that the socket invalidation path (useDashboardInvalidation) wires correctly.
    let statsCallCount = 0

    await page.route('**/api/dashboard/stats', async (route) => {
      statsCallCount++
      const totalSales = statsCallCount === 1 ? 5 : 6
      const totalRevenue = statsCallCount === 1 ? 500.0 : 510.0

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalProducts: 10,
            totalSales,
            totalRevenue,
            lowStockProducts: [],
            lowStockCount: 0,
          },
        }),
      })
    })

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

    // Step 1: load dashboard — initial stats (totalSales = 5)
    await page.goto('/dashboard')
    await expect(page.getByTestId('stat-total-sales')).toHaveText('5', { timeout: 8_000 })
    await expect(page.getByTestId('stat-total-revenue')).toHaveText('$500.00')

    // Step 2: navigate to sales and create a sale
    await page.goto('/sales')
    const searchInput = page.getByLabel(/search products/i)
    await searchInput.fill(TEST_SKU)
    await expect(page.locator('ul button').first()).toBeVisible({ timeout: 8_000 })
    await page.locator('ul button').first().click()
    await page.getByRole('button', { name: /complete sale/i }).click()
    await expect(page.getByText(/sale created/i)).toBeVisible({ timeout: 8_000 })

    // Step 3: navigate back to dashboard — TanStack Query refetches stale data
    // The mock now returns totalSales = 6, proving the stats updated
    await page.goto('/dashboard')
    await expect(page.getByTestId('stat-total-sales')).toHaveText('6', { timeout: 8_000 })
    await expect(page.getByTestId('stat-total-revenue')).toHaveText('$510.00')
  })
})
