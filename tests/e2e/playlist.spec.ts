import { test, expect } from './fixtures/test';

test.describe('Playlist', () => {
  test('should show create playlist button in library', async ({ authenticatedPage: page }) => {
    await page.goto('/library');
    await page.waitForURL('/library');
    await page.waitForTimeout(2000);

    const createBtn = page.getByText('만들기');
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test('should show create playlist form when clicking create button', async ({ authenticatedPage: page }) => {
    await page.goto('/library');
    await page.waitForURL('/library');
    await page.waitForTimeout(2000);

    const createBtn = page.getByText('만들기');
    await createBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByPlaceholder('재생목록 이름')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('취소')).toBeVisible();
  });

  test('should navigate to playlist detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/library');
    await page.waitForURL('/library');
    await page.waitForTimeout(2000);

    const playlistItems = page.locator('button').filter({ has: page.locator('svg.lucide-list-music') });
    const count = await playlistItems.count();

    if (count > 0) {
      await playlistItems.first().click();
      await page.waitForURL(/\/playlist\//, { timeout: 10000 });

      await expect(page.locator('button', { hasText: /^재생$/ })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button', { hasText: /^셔플$/ })).toBeVisible();
    }
  });

  test('should show back button on playlist detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/library');
    await page.waitForURL('/library');
    await page.waitForTimeout(2000);

    const playlistItems = page.locator('button').filter({ has: page.locator('svg.lucide-list-music') });
    const count = await playlistItems.count();

    if (count > 0) {
      await playlistItems.first().click();
      await page.waitForURL(/\/playlist\//, { timeout: 10000 });

      const backBtn = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left') });
      await expect(backBtn).toBeVisible({ timeout: 5000 });
    }
  });
});
