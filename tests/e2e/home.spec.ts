import { test, expect } from './fixtures/test';

test.describe('Home Page', () => {
  test('should display home page title', async ({ authenticatedPage: page }) => {
    await page.goto('/home');
    await page.waitForURL('/home');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: '듣기' })).toBeVisible({ timeout: 10000 });
  });

  test('should display chart section with tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/home');
    await page.waitForURL('/home');
    await page.waitForTimeout(2000);

    await expect(page.getByText('실시간', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('HOT 100')).toBeVisible();
    await expect(page.getByText('일간')).toBeVisible();
  });

  test('should switch chart tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/home');
    await page.waitForURL('/home');
    await page.waitForTimeout(2000);

    const hot100 = page.getByText('HOT 100');
    await hot100.waitFor({ state: 'visible', timeout: 15000 });
    await hot100.click();
    await page.waitForTimeout(2000);

    const daily = page.getByText('일간');
    await daily.click();
    await page.waitForTimeout(2000);

    const realtime = page.getByText('실시간', { exact: true });
    await realtime.click();
    await page.waitForTimeout(2000);
  });
});
