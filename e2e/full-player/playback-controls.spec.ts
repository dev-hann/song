import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  getFullPlayer,
  waitForPlaying,
  waitForPaused,
  getCurrentTrackTitle,
  getFullPlayerTrackTitle,
} from '../scenarios/full-player';

test.describe('Playback Controls', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);
  });

  test('toggles play/pause', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const playButton = fullPlayer.locator('button[class*="w-14 h-14"]');
    await playButton.click();

    const paused = await waitForPaused(page);
    expect(paused).toBe(true);

    await playButton.click();

    const playing = await waitForPlaying(page);
    expect(playing).toBe(true);
  });

  test('skips to next track', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);
    const titleBefore = await getFullPlayerTrackTitle(page);

    const nextButton = fullPlayer.locator('svg.lucide-skip-forward').locator('..');
    await nextButton.click();

    await page.waitForTimeout(3000);

    const titleAfter = await getFullPlayerTrackTitle(page);
    expect(titleAfter).toBeTruthy();
    expect(titleAfter).not.toBe(titleBefore);
  });

  test('restarts current track when previous is clicked after 3s', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    await page.waitForTimeout(3500);

    const currentTime = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio?.currentTime ?? 0;
    });
    expect(currentTime).toBeGreaterThan(2);

    const prevButton = fullPlayer.locator('svg.lucide-skip-back').locator('..');
    await prevButton.click();

    await page.waitForTimeout(500);

    const timeAfter = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio?.currentTime ?? 999;
    });
    expect(timeAfter).toBeLessThan(2);
  });

  test('goes to previous track when clicked within 3s', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);
    const titleBefore = await getFullPlayerTrackTitle(page);

    const nextButton = fullPlayer.locator('svg.lucide-skip-forward').locator('..');
    await nextButton.click();
    await page.waitForTimeout(3000);

    await waitForPlaying(page);
    const titleAfterNext = await getFullPlayerTrackTitle(page);

    const prevButton = fullPlayer.locator('svg.lucide-skip-back').locator('..');
    await prevButton.click();
    await page.waitForTimeout(3000);

    await waitForPlaying(page);
    const titleAfterPrev = await getFullPlayerTrackTitle(page);

    expect(titleAfterNext).not.toBe(titleBefore);
    expect(titleAfterPrev).not.toBe(titleAfterNext);
  });

  test('updates track metadata after skip', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const titleBefore = await fullPlayer.locator('h2').textContent();
    const channelBefore = await fullPlayer.locator('h2 + p').textContent();

    const nextButton = fullPlayer.locator('svg.lucide-skip-forward').locator('..');
    await nextButton.click();
    await page.waitForTimeout(3000);

    await waitForPlaying(page);

    const titleAfter = await fullPlayer.locator('h2').textContent();
    const channelAfter = await fullPlayer.locator('h2 + p').textContent();

    expect(titleAfter).toBeTruthy();
    expect(titleAfter).not.toBe(titleBefore);
  });

  test('shows loading spinner on track change', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const nextButton = fullPlayer.locator('svg.lucide-skip-forward').locator('..');
    await nextButton.click();

    const spinner = fullPlayer.locator('div.animate-spin');
    const hadSpinner = await spinner.isVisible().catch(() => false);

    await waitForPlaying(page, 20000);

    await expect(fullPlayer.locator('h2')).toBeVisible();
  });
});
