import { test, expect } from '@playwright/test'

/**
 * Customer Management E2E Tests
 *
 * Note: These tests require authentication setup.
 * In a real scenario, you would:
 * 1. Set up test user credentials
 * 2. Use Playwright's storageState for auth persistence
 * 3. Seed test data before each test
 */

test.describe('Customer Management', () => {
  // Skip these tests if not in authenticated context
  test.skip(({ browserName }) => true, 'Requires auth setup')

  test('should display customers page', async ({ page }) => {
    await page.goto('/customers')

    // Check page title
    await expect(
      page.getByRole('heading', { name: /customers/i })
    ).toBeVisible()

    // Check for add customer button
    await expect(
      page.getByRole('button', { name: /add customer/i })
    ).toBeVisible()
  })

  test('should open add customer modal', async ({ page }) => {
    await page.goto('/customers')

    // Click add customer button
    await page.getByRole('button', { name: /add customer/i }).click()

    // Modal should appear
    await expect(page.getByRole('dialog')).toBeVisible()

    // Check form fields exist
    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.getByLabel(/last name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/customers')

    // Open modal
    await page.getByRole('button', { name: /add customer/i }).click()

    // Try to submit empty form
    await page.getByRole('button', { name: /save|create|add/i }).click()

    // Should show validation errors
    await expect(page.getByText(/required/i)).toBeVisible()
  })

  test('should create a new customer', async ({ page }) => {
    await page.goto('/customers')

    // Open modal
    await page.getByRole('button', { name: /add customer/i }).click()

    // Fill in form
    await page.getByLabel(/first name/i).fill('John')
    await page.getByLabel(/last name/i).fill('Doe')
    await page.getByLabel(/email/i).fill('john.doe@example.com')
    await page.getByLabel(/phone/i).fill('(555) 123-4567')

    // Submit
    await page.getByRole('button', { name: /save|create|add/i }).click()

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Customer should appear in list
    await expect(page.getByText('John Doe')).toBeVisible()
  })

  test('should search customers', async ({ page }) => {
    await page.goto('/customers')

    // Type in search
    await page.getByPlaceholder(/search/i).fill('John')

    // Wait for results
    await page.waitForTimeout(500) // Debounce

    // Results should filter
    // (Actual assertion depends on test data)
  })

  test('should view customer details', async ({ page }) => {
    await page.goto('/customers')

    // Click on a customer row
    await page
      .getByText(/john doe/i)
      .first()
      .click()

    // Should navigate to detail page or open detail panel
    await expect(page.getByText(/customer details/i)).toBeVisible()
  })
})

test.describe('Customer API', () => {
  test('GET /api/customers should require authentication', async ({
    request,
  }) => {
    const response = await request.get('/api/customers')

    // Should return 401 without auth
    expect(response.status()).toBe(401)
  })

  test('POST /api/customers should require authentication', async ({
    request,
  }) => {
    const response = await request.post('/api/customers', {
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
    })

    // Should return 401 without auth
    expect(response.status()).toBe(401)
  })
})
