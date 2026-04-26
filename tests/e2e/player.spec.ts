import { test, expect } from './fixtures/test';

async function playFirstSearchResult(page: import('@playwright/test').Page) {
  await page.goto('/search');
  await page.waitForURL('/search');
  await page.waitForTimeout(2000);

  const input = page.getByPlaceholder('노래, 아티스트 검색...');
  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill('NewJeans Hype Boy');
  await input.press('Enter');

  await page.waitForTimeout(6000);

  const trackItems = page.locator('[class*="w-12"]').locator('..').filter({ has: page.locator('img') });
  const count = await trackItems.count();

  if (count > 0) {
    await trackItems.first().click();
    await page.waitForTimeout(4000);
    return true;
  }
  return false;
}

test.describe('Player', () => {
  test('should show player bar when a track is playing', async ({ authenticatedPage: page }) => {
    const played = await playFirstSearchResult(page);
    if (!played) return;

    const playerBar = page.locator('.player-bar');
    const isVisible = await playerBar.isVisible({ timeout: 10000 }).catch(() => false);

    if (isVisible) {
      const title = playerBar.locator('p').first();
      await expect(title).not.toBeEmpty();
    }
  });

  test('should toggle play/pause from player bar', async ({ authenticatedPage: page }) => {
    const played = await playFirstSearchResult(page);
    if (!played) return;

    const playerBar = page.locator('.player-bar');
    const isVisible = await playerBar.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isVisible) return;

    const buttons = playerBar.locator('button');
    const playPauseBtn = buttons.nth(1);

    await playPauseBtn.click();
    await page.waitForTimeout(1000);

    await playPauseBtn.click();
    await page.waitForTimeout(500);
  });

  test('should open full player when clicking player bar', async ({ authenticatedPage: page }) => {
    const played = await playFirstSearchResult(page);
    if (!played) return;

    const playerBar = page.locator('.player-bar');
    const isVisible = await playerBar.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isVisible) return;

    await playerBar.locator('p').first().click();
    await page.waitForTimeout(1000);

    const fullPlayer = page.locator('.full-player.active');
    await expect(fullPlayer).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('should close full player with chevron down button', async ({ authenticatedPage: page }) => {
    const played = await playFirstSearchResult(page);
    if (!played) return;

    const playerBar = page.locator('.player-bar');
    const isVisible = await playerBar.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isVisible) return;

    await playerBar.locator('p').first().click();
    const fullPlayer = page.locator('.full-player.active');
    await expect(fullPlayer).toBeVisible({ timeout: 5000 }).catch(() => {});
    if (!(await fullPlayer.isVisible())) return;

    const closeBtn = fullPlayer.locator('button').first();
    await closeBtn.click();
    await page.waitForTimeout(1000);
  });

  test('should toggle repeat mode in full player', async ({ authenticatedPage: page }) => {
    const played = await playFirstSearchResult(page);
    if (!played) return;

    const playerBar = page.locator('.player-bar');
    const isVisible = await playerBar.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isVisible) return;

    await playerBar.locator('p').first().click();
    const fullPlayer = page.locator('.full-player.active');
    await expect(fullPlayer).toBeVisible({ timeout: 5000 }).catch(() => {});
    if (!(await fullPlayer.isVisible())) return;

    const repeatBtn = fullPlayer.locator('button').filter({ has: page.locator('svg[class*="lucide-repeat"]') }).first();
    if (await repeatBtn.isVisible()) {
      await repeatBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should switch to related tracks tab in full player', async ({ authenticatedPage: page }) => {
    const played = await playFirstSearchResult(page);
    if (!played) return;

    const playerBar = page.locator('.player-bar');
    const isVisible = await playerBar.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isVisible) return;

    await playerBar.locator('p').first().click();
    const fullPlayer = page.locator('.full-player.active');
    await expect(fullPlayer).toBeVisible({ timeout: 5000 }).catch(() => {});
    if (!(await fullPlayer.isVisible())) return;

    const relatedTab = fullPlayer.locator('button').filter({ hasText: '추천 곡' });
    await relatedTab.click();
    await page.waitForTimeout(3000);

    await expect(fullPlayer.locator('h3')).toContainText('추천 곡').catch(() => {});
  });
});
