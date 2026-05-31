import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  closeFullPlayer,
  getFullPlayer,
  waitForPlaying,
} from '../scenarios/full-player';

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

    const relatedTab = fullPlayer.locator('button', { hasText: '추천 곡' });
    await relatedTab.click();

    await expect(fullPlayer.getByText('추천 곡', { exact: true })).toBeVisible();

    const controlsTab = fullPlayer.locator('button', { hasText: '재생' });
    await controlsTab.click();

    await expect(fullPlayer.locator('h2')).toBeVisible();
  });

  test('opens and closes queue sheet', async ({ page }) => {
    await openFullPlayer(page);
    const fullPlayer = getFullPlayer(page);

    const queueButton = fullPlayer.locator('svg.lucide-list-music').locator('..');
    await queueButton.click();

    const sheet = page.locator('[data-side="bottom"]');
    await expect(sheet).toBeVisible();

    const backdrop = page.locator('[data-side="bottom"]').locator('..').locator('div').first();
    await backdrop.click();
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
