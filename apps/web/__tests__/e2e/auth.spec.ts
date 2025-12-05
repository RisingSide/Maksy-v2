import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard')

    // Should be redirected to sign-in
    await expect(page).toHaveURL(/sign-in/)
  })

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login')

    // Should redirect to Clerk's sign-in page
    await expect(page).toHaveURL(/sign-in/)
  })

  test('should display signup page correctly', async ({ page }) => {
    await page.goto('/signup')

    // Should redirect to Clerk's sign-up page
    await expect(page).toHaveURL(/sign-up/)
  })

  test('public booking page should be accessible without auth', async ({
    page,
  }) => {
    // Public booking pages should be accessible
    const response = await page.goto('/test-company/book')

    // May return 404 if company doesn't exist, but should not redirect to auth
    expect(response?.status()).not.toBe(401)
  })

  test('public form page should be accessible without auth', async ({
    page,
  }) => {
    // Public form pages should be accessible
    const response = await page.goto('/forms/test-form-id')

    // May return 404 if form doesn't exist, but should not redirect to auth
    expect(response?.status()).not.toBe(401)
  })
})

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In real tests, you'd set up auth state
    // For now, these tests verify the pages exist
  })

  test('home page should load', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok()).toBeTruthy()
  })

  test('health endpoint should respond', async ({ page }) => {
    const response = await page.goto('/api/health')
    expect(response?.ok()).toBeTruthy()

    const json = await response?.json()
    expect(json).toHaveProperty('status')
  })
})
