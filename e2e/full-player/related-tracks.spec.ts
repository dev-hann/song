import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  waitForPlaying,
} from '../scenarios/full-player';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Related Tracks', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);
  });

  test('switches to related tab and loads tracks', async ({ page }) => {
    const relatedTab = page.getByRole('button', { name: '추천 곡' });
    await relatedTab.click();

    await page.waitForFunction(
      () => document.querySelectorAll('.full-player.active button[class*="flex-shrink-0"]').length > 0,
      { timeout: 15000 },
    );

    const count = await page.evaluate(() => {
      return document.querySelectorAll('.full-player.active button[class*="flex-shrink-0"]').length;
    });
    expect(count).toBeGreaterThan(0);
  });

  test('plays a related track on thumbnail click', async ({ page }) => {
    const relatedTab = page.getByRole('button', { name: '추천 곡' });
    await relatedTab.click();

    await page.waitForFunction(
      () => document.querySelectorAll('.full-player.active button[class*="flex-shrink-0"]').length > 0,
      { timeout: 15000 },
    );

    await page.evaluate(() => {
      const btn = document.querySelector('.full-player.active button[class*="flex-shrink-0"]') as HTMLElement;
      btn?.click();
    });

    await page.waitForFunction(
      () => {
        const h2 = document.querySelector('.full-player.active h2');
        return h2 && h2.textContent && h2.textContent.trim().length > 0;
      },
      { timeout: 30000 },
    );

    const title = await page.evaluate(() => {
      const h2 = document.querySelector('.full-player.active h2');
      return h2?.textContent ?? '';
    });
    expect(title).toBeTruthy();
  });

  test('adds related track to queue', async ({ page }) => {
    const relatedTab = page.getByRole('button', { name: '추천 곡' });
    await relatedTab.click();

    await page.waitForFunction(
      () => document.querySelectorAll('.full-player.active button[class*="flex-shrink-0"]').length > 0,
      { timeout: 15000 },
    );

    const addBtn = page.getByText('+ 큐에 추가').first();
    await addBtn.click();
    await page.waitForTimeout(500);

    const controlsTab = page.getByRole('button', { name: '재생', exact: true });
    await controlsTab.click();

    await page.evaluate(() => {
      const btn = document.querySelector('.full-player.active [data-testid="btn-queue"]') as HTMLElement;
      btn?.click();
    });

    const sheet = page.locator('[data-side="bottom"]');
    await expect(sheet).toBeVisible();

    const count = await page.evaluate(() => {
      return document.querySelectorAll('[data-side="bottom"] [role="button"]').length;
    });
    expect(count).toBeGreaterThan(1);
  });
});
