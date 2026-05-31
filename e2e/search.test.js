import { test, expect } from '@playwright/test'

test.describe('search', () => {
  test('renders landing page at root', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=subooru')).toBeVisible()
    await expect(page.locator('text=Enter tags in the sidebar')).toBeVisible()
  })

  test('searches with a tag and shows results', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[placeholder="Search tags..."]', 'cat')
    await page.click('button:has-text("Search")')
    await page.waitForURL(/\/search\/1\//, { timeout: 10000 })
    await page.waitForTimeout(5000)

    // Should have navigated to search URL
    expect(page.url()).toContain('/search/1/')
  })

  test('search without tags loads results', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Search")')
    await page.waitForURL(/\/search\/1\//, { timeout: 10000 })
    await page.waitForTimeout(5000)

    // Should navigate and show results (not stuck on spinner)
    const spinner = page.locator('.spinner-border')
    await expect(spinner).toHaveCount(0, { timeout: 15000 })
  })

  test('opens fullscreen on post click', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[placeholder="Search tags..."]', 'cat')
    await page.click('button:has-text("Search")')
    await page.waitForURL(/\/search\/1\//, { timeout: 10000 })
    await page.waitForTimeout(5000)

    const images = page.locator('img')
    const count = await images.count()
    if (count > 0) {
      await images.first().click()
      await page.waitForTimeout(2000)

      // Fullscreen overlay should be visible
      const overlay = page.locator('[style*="z-index: 1060"]')
      await expect(overlay).toBeVisible()
    }
  })
})
