import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@mini-erp.dev'
const ADMIN_PASSWORD = 'Admin@1234!'

test.describe('App Layout & Navigation', () => {
  test('sidebar renders correctly for admin user', async ({ page }) => {
    // 1. Log in as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')

    // 2. Wait for navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/)

    // 3. Verify Sidebar contains expected links
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    await expect(sidebar.locator('text=Dashboard')).toBeVisible()
    await expect(sidebar.locator('text=Products')).toBeVisible()
    await expect(sidebar.locator('text=POS (Sell)')).toBeVisible()
    await expect(sidebar.locator('text=Sale History')).toBeVisible()

    // 4. Test Navigation to Products
    await sidebar.locator('text=Products').click()
    await expect(page).toHaveURL('/products')

    // 5. Test Navigation to POS
    await sidebar.locator('text=POS (Sell)').click()
    await expect(page).toHaveURL('/sales')
  })
})
