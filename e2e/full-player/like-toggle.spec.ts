import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  closeFullPlayer,
  getFullPlayer,
} from '../scenarios/full-player';

test.describe('Like Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);
  });

  test('toggles like on and off in full player', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const likeButton = fullPlayer.locator('button svg.lucide-heart').locator('..');

    const heartBefore = fullPlayer.locator('svg.lucide-heart');
    const classBefore = await heartBefore.getAttribute('class');

    await likeButton.click();
    await page.waitForTimeout(1000);

    const heartAfter = fullPlayer.locator('svg.lucide-heart');
    const classAfter = await heartAfter.getAttribute('class');

    expect(classBefore).not.toBe(classAfter);

    await likeButton.click();
    await page.waitForTimeout(1000);

    const heartRestored = fullPlayer.locator('svg.lucide-heart');
    const classRestored = await heartRestored.getAttribute('class');

    expect(classRestored).not.toBe(classAfter);
  });

  test('syncs like state with mini player', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const likeButton = fullPlayer.locator('button svg.lucide-heart').locator('..');
    await likeButton.click();
    await page.waitForTimeout(1000);

    const isLikedInFull = await fullPlayer.locator('svg.lucide-heart').getAttribute('class');

    await closeFullPlayer(page);

    const playerBar = page.locator('.player-bar');
    await expect(playerBar).toBeVisible();

    const isLikedInMini = await playerBar.locator('svg.lucide-heart').getAttribute('class');

    const fullLiked = isLikedInFull?.includes('fill-red') ?? false;
    const miniLiked = isLikedInMini?.includes('fill-red') ?? false;

    expect(fullLiked).toBe(miniLiked);
  });
});
