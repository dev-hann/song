import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  closeFullPlayer,
  getFullPlayer,
  waitForPlaying,
  clickTestId,
} from '../scenarios/full-player';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Full Player Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
  });

  test('opens full player from mini player', async ({ page }) => {
    await openFullPlayer(page);

    const fullPlayer = getFullPlayer(page);
    await expect(fullPlayer).toBeVisible();
    await expect(fullPlayer.locator('h2')).toBeVisible();
    await expect(fullPlayer.locator('h2')).not.toBeEmpty();
  });

  test('closes full player with chevron button', async ({ page }) => {
    await openFullPlayer(page);

    const fullPlayer = getFullPlayer(page);
    await expect(fullPlayer).toBeVisible();

    await closeFullPlayer(page);

    await expect(page.locator('.player-bar')).toBeVisible();
    await expect(fullPlayer).not.toBeVisible();
  });

  test('switches between controls and related tabs', async ({ page }) => {
    await openFullPlayer(page);
    const fullPlayer = getFullPlayer(page);

    const relatedTab = fullPlayer.getByRole('button', { name: '추천 곡' });
    await relatedTab.click();

    await expect(fullPlayer.getByRole('heading', { name: '추천 곡' })).toBeVisible();

    const controlsTab = fullPlayer.getByRole('button', { name: '재생', exact: true });
    await controlsTab.click();

    await expect(fullPlayer.locator('h2')).toBeVisible();
  });

  test('opens and closes queue sheet', async ({ page }) => {
    await openFullPlayer(page);

    await clickTestId(page, 'btn-queue');

    const sheet = page.locator('[data-side="bottom"]');
    await expect(sheet).toBeVisible();

    const overlay = page.locator('[data-slot="sheet-overlay"]');
    await overlay.click();
    await page.waitForTimeout(500);

    await expect(sheet).not.toBeVisible();
  });

  test('preserves playback state when opening/closing', async ({ page }) => {
    await waitForPlaying(page);

    await openFullPlayer(page);
    const playing = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio && !audio.paused;
    });
    expect(playing).toBe(true);

    await closeFullPlayer(page);

    const stillPlaying = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio && !audio.paused;
    });
    expect(stillPlaying).toBe(true);
  });
});
