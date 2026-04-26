import { test, expect } from './fixtures/test';

test.describe('Library', () => {
  test('should show library title and settings button', async ({ authenticatedPage: page }) => {
    await page.goto('/library');
    await page.waitForURL('/library');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: '라이브러리' })).toBeVisible({ timeout: 10000 });
  });

  test('should switch between filter tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/library');
    await page.waitForURL('/library');
    await page.waitForTimeout(2000);

    const filterBar = page.locator('.flex.gap-2');
    await filterBar.waitFor({ state: 'visible', timeout: 10000 });

    await filterBar.getByText('좋아요', { exact: true }).click();
    await page.waitForTimeout(1000);

    await filterBar.getByText('최근 재생', { exact: true }).click();
    await page.waitForTimeout(1000);

    await filterBar.getByText('재생목록', { exact: true }).click();
    await page.waitForTimeout(1000);
  });

  test('should show liked songs and recent songs shortcuts in playlist tab', async ({ authenticatedPage: page }) => {
    await page.goto('/library');
    await page.waitForURL('/library');
    await page.waitForTimeout(2000);

    await expect(page.getByText('좋아요한 곡')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('p', { hasText: '최근 재생' })).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to liked page from library', async ({ authenticatedPage: page }) => {
    await page.goto('/library');
    await page.waitForURL('/library');
    await page.waitForTimeout(2000);

    const likedBtn = page.locator('button').filter({ hasText: '좋아요한 곡' }).first();
    await likedBtn.waitFor({ state: 'visible', timeout: 10000 });
    await likedBtn.click();
    await page.waitForURL('/liked', { timeout: 10000 });

    await expect(page.getByRole('heading', { name: '좋아요한 곡' })).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to recent page from library', async ({ authenticatedPage: page }) => {
    await page.goto('/recent');
    await page.waitForURL('/recent');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: '최근 재생' })).toBeVisible({ timeout: 10000 });
  });
});
