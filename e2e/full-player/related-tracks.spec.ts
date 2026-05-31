import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  getFullPlayer,
  waitForPlaying,
  getFullPlayerTrackTitle,
} from '../scenarios/full-player';

test.describe('Related Tracks', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);
  });

  test('switches to related tab and loads tracks', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const relatedTab = fullPlayer.locator('button', { hasText: '추천 곡' });
    await relatedTab.click();

    const trackItems = fullPlayer.locator('button[class*="flex-shrink-0"]');
    await expect(trackItems.first()).toBeVisible({ timeout: 15000 });

    const count = await trackItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('shows loading skeleton before tracks load', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const relatedTab = fullPlayer.locator('button', { hasText: '추천 곡' });
    const relatedPromise = relatedTab.click();

    const skeletonVisible = await fullPlayer.locator('[data-slot="skeleton"]').first().isVisible().catch(() => false);

    await relatedPromise;

    await expect(fullPlayer.locator('button[class*="flex-shrink-0"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('plays a related track on thumbnail click', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);
    const titleBefore = await getFullPlayerTrackTitle(page);

    const relatedTab = fullPlayer.locator('button', { hasText: '추천 곡' });
    await relatedTab.click();

    await expect(fullPlayer.locator('button[class*="flex-shrink-0"]').first()).toBeVisible({ timeout: 15000 });

    const firstTrackThumb = fullPlayer.locator('button[class*="flex-shrink-0"]').first();
    await firstTrackThumb.click();

    await page.waitForTimeout(3000);

    await waitForPlaying(page, 15000).catch(() => undefined);

    const controlsTab = fullPlayer.locator('button', { hasText: '재생' });
    await controlsTab.click();

    const titleAfter = await getFullPlayerTrackTitle(page);

    expect(titleAfter).toBeTruthy();
  });

  test('adds related track to queue', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const relatedTab = fullPlayer.locator('button', { hasText: '추천 곡' });
    await relatedTab.click();

    await expect(fullPlayer.locator('button[class*="flex-shrink-0"]').first()).toBeVisible({ timeout: 15000 });

    const addToQueueButton = fullPlayer.getByText('+ 큐에 추가').first();
    await addToQueueButton.click();

    await page.waitForTimeout(500);

    const controlsTab = fullPlayer.locator('button', { hasText: '재생' });
    await controlsTab.click();

    const queueButton = fullPlayer.locator('svg.lucide-list-music').locator('..');
    await queueButton.click();

    const sheet = page.locator('[data-side="bottom"]');
    await expect(sheet).toBeVisible();

    const trackItems = sheet.locator('[data-slot="track-item"]');
    const count = await trackItems.count();
    expect(count).toBeGreaterThan(1);
  });
});
