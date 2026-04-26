import { test, expect } from './fixtures/test';

test.describe('Navigation', () => {
  test('should navigate between tabs using bottom nav', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: '듣기' })).toBeVisible({ timeout: 10000 });

    const searchTab = page.locator('nav').getByText('검색');
    await searchTab.click();
    await page.waitForURL('/search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/search');

    const libraryTab = page.locator('nav').getByText('라이브러리');
    await libraryTab.click();
    await page.waitForURL('/library');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/library');

    const homeTab = page.locator('nav').getByText('홈');
    await homeTab.click();
    await page.waitForURL('/home');
    await expect(page.getByRole('heading', { name: '듣기' })).toBeVisible({ timeout: 10000 });
  });

  test('should navigate directly to protected routes when authenticated', async ({ authenticatedPage: page }) => {
    const routes = ['/search', '/library', '/liked', '/recent'];

    for (const path of routes) {
      await page.goto(path);
      await page.waitForURL(new RegExp(path.replace('/', '/')), { timeout: 10000 });
      expect(page.url()).toContain(path);
    }
  });

  test('should show bottom nav on all main pages', async ({ authenticatedPage: page }) => {
    const pages = ['/home', '/search', '/library'];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForURL(new RegExp(path));
      await page.waitForTimeout(2000);
      const nav = page.locator('nav');
      await expect(nav).toBeVisible({ timeout: 10000 });
    }
  });
});
