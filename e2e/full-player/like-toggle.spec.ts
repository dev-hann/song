import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  getFullPlayer,
  waitForPlaying,
  clickTestId,
} from '../scenarios/full-player';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Like Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);
    await waitForPlaying(page);
  });

  test('toggles like on and off in full player', async ({ page }) => {
    const heartIcon = page.locator('.full-player.active [data-testid="btn-like"] svg');

    const classBefore = await heartIcon.evaluate(el => el.getAttribute('class') ?? '');
    expect(classBefore).toContain('text-muted');

    await clickTestId(page, 'btn-like');
    await page.waitForTimeout(1500);

    const classAfter = await heartIcon.evaluate(el => el.getAttribute('class') ?? '');
    expect(classAfter).toContain('fill-red-500');

    await clickTestId(page, 'btn-like');
    await page.waitForTimeout(1500);

    const classRestored = await heartIcon.evaluate(el => el.getAttribute('class') ?? '');
    expect(classRestored).toContain('text-muted');
    expect(classRestored).not.toContain('fill-red-500');
  });

  test('syncs like state with mini player', async ({ page }) => {
    await clickTestId(page, 'btn-like');
    await page.waitForTimeout(1500);

    const isLikedInFull = await page.evaluate(() => {
      const svg = document.querySelector('.full-player.active [data-testid="btn-like"] svg');
      return svg?.classList.contains('fill-red-500') ?? false;
    });
    expect(isLikedInFull).toBe(true);

    await clickTestId(page, 'btn-close');
    await page.waitForTimeout(500);

    const isLikedInMini = await page.evaluate(() => {
      const bar = document.querySelector('.player-bar');
      const svg = bar?.querySelector('svg.lucide-heart');
      return svg?.classList.contains('fill-red-500') ?? false;
    });
    expect(isLikedInMini).toBe(isLikedInFull);
  });
});
