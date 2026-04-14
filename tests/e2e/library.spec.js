// tests/e2e/library.spec.js
const { test, expect } = require('@playwright/test')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'changeme123'

// Helper: log in
async function login(page) {
  await page.goto(BASE)
  await page.waitForSelector('[data-testid="login-username"]')
  await page.fill('[data-testid="login-username"]', ADMIN_USER)
  await page.fill('[data-testid="login-password"]', ADMIN_PASS)
  await page.click('[data-testid="login-submit"]')
  await page.waitForSelector('[data-testid="nav-library"]', { timeout: 10000 })
}

test.describe('Authentication', () => {
  test('shows login page when not authenticated', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('[data-testid="login-username"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible()
  })

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto(BASE)
    await page.fill('[data-testid="login-username"]', 'admin')
    await page.fill('[data-testid="login-password"]', 'wrongpassword')
    await page.click('[data-testid="login-submit"]')
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 })
  })

  test('logs in with correct credentials', async ({ page }) => {
    await login(page)
    await expect(page.locator('[data-testid="nav-library"]')).toBeVisible()
    await expect(page.locator('[data-testid="logout-btn"]')).toBeVisible()
  })

  test('logs out successfully', async ({ page }) => {
    await login(page)
    await page.click('[data-testid="logout-btn"]')
    await expect(page.locator('[data-testid="login-username"]')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('all nav tabs are visible', async ({ page }) => {
    for (const tab of ['library','dashboard','goals','wishlist']) {
      await expect(page.locator(`[data-testid="nav-${tab}"]`)).toBeVisible()
    }
  })

  test('admin sees scan and settings tabs', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-scan"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible()
  })

  test('navigates to Dashboard', async ({ page }) => {
    await page.click('[data-testid="nav-dashboard"]')
    await expect(page.locator('text=Reading Dashboard')).toBeVisible()
  })

  test('navigates to Goals', async ({ page }) => {
    await page.click('[data-testid="nav-goals"]')
    await expect(page.locator('text=Reading Goals')).toBeVisible()
  })

  test('navigates to Settings', async ({ page }) => {
    await page.click('[data-testid="nav-settings"]')
    await expect(page.locator('text=Google Sheets Database')).toBeVisible()
  })
})

test.describe('Settings - Google Sheets', () => {
  test.beforeEach(async ({ page }) => { await login(page); await page.click('[data-testid="nav-settings"]') })

  test('shows sheet connection status', async ({ page }) => {
    await expect(page.locator('text=Google Sheets Database')).toBeVisible()
    // Either connected or not connected message
    const status = page.locator('text=Connected to Google Sheet, text=Not connected')
    await expect(status.first()).toBeVisible()
  })

  test('shows error for invalid spreadsheet id', async ({ page }) => {
    await page.fill('input[placeholder*="1BxiMVs0XRA5"]', 'invalid-id')
    await page.fill('textarea[placeholder*="service_account"]', '{"client_email":"test@test.iam.gserviceaccount.com","private_key":"bad"}')
    await page.click('text=Connect Google Sheet')
    await expect(page.locator('text=Sheet connection failed')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Library - Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    // Wait for library to load (may be empty if no sheet connected)
    await page.waitForSelector('[data-testid="search-input"]', { timeout: 10000 })
  })

  test('search input is visible and functional', async ({ page }) => {
    const input = page.locator('[data-testid="search-input"]')
    await expect(input).toBeVisible()
    await input.fill('test search')
    await expect(input).toHaveValue('test search')
  })

  test('genre filters are visible', async ({ page }) => {
    await expect(page.locator('[data-testid="genre-filter-all"]')).toBeVisible()
    await expect(page.locator('[data-testid="genre-filter-Fiction"]')).toBeVisible()
  })

  test('clicking genre filter marks it active', async ({ page }) => {
    await page.click('[data-testid="genre-filter-Fiction"]')
    await expect(page.locator('[data-testid="genre-filter-Fiction"]')).toHaveClass(/bg-bamboo/)
  })

  test('empty state shown when no results', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'zzznoresultsxxx')
    await page.waitForTimeout(400)
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
  })

  test('clear search button removes query', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'something')
    await page.waitForTimeout(100)
    const clear = page.locator('[data-testid="search-clear"]')
    if (await clear.isVisible()) {
      await clear.click()
      await expect(page.locator('[data-testid="search-input"]')).toHaveValue('')
    }
  })
})

test.describe('Add Book', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.waitForSelector('[data-testid="search-input"]')
  })

  test('Add Book button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Book"), button:has-text("Add")')).toBeVisible()
  })

  test('add modal opens and closes', async ({ page }) => {
    await page.click('button:has-text("Add")')
    await expect(page.locator('[data-testid="add-book-modal"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="add-book-modal"]')).not.toBeVisible()
  })

  test('manual entry validates required fields', async ({ page }) => {
    await page.click('button:has-text("Add")')
    await page.locator('[data-testid="add-book-modal"]').waitFor()
    // Switch to manual if lookup step is shown
    const manualLink = page.locator('text=add manually')
    if (await manualLink.isVisible()) await manualLink.click()
    // Try to save without data
    await page.click('button:has-text("Add to Library")')
    await expect(page.locator('text=Title is required')).toBeVisible()
  })
})

test.describe('Goals', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.click('[data-testid="nav-goals"]')
    await page.waitForSelector('text=Reading Goals')
  })

  test('goals page loads', async ({ page }) => {
    await expect(page.locator('text=Reading Goals')).toBeVisible()
  })

  test('New Goal button is visible for admin', async ({ page }) => {
    await expect(page.locator('button:has-text("New Goal")')).toBeVisible()
  })

  test('new goal modal opens', async ({ page }) => {
    await page.click('button:has-text("New Goal")')
    await expect(page.locator('text=New Reading Goal')).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('goal creation validates name', async ({ page }) => {
    await page.click('button:has-text("New Goal")')
    await page.locator('text=New Reading Goal').waitFor()
    await page.click('button:has-text("Create Goal")')
    await expect(page.locator('text=Give this goal a name')).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Wishlist', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.click('[data-testid="nav-wishlist"]')
    await page.waitForSelector('text=Reading Wishlist')
  })

  test('wishlist page loads', async ({ page }) => {
    await expect(page.locator('text=Reading Wishlist')).toBeVisible()
  })

  test('add to wishlist modal works', async ({ page }) => {
    await page.click('button:has-text("Add Book")')
    await expect(page.locator('text=Add to Wishlist')).toBeVisible()
    await page.keyboard.press('Escape')
  })
})

test.describe('Book Scanner', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.click('[data-testid="nav-scan"]')
    await page.waitForSelector('text=Scan Books')
  })

  test('scan page loads with dropzone', async ({ page }) => {
    await expect(page.locator('text=Scan Books')).toBeVisible()
    await expect(page.locator('text=Drag book photos here')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('login page works on mobile', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('[data-testid="login-username"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible()
  })

  test('mobile nav hamburger is visible after login', async ({ page }) => {
    await login(page)
    await expect(page.locator('[data-testid="nav-library"]')).toBeVisible()
  })

  test('library works on mobile', async ({ page }) => {
    await login(page)
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()
  })
})
