import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  waitForPlaying,
  waitForPaused,
  clickTestId,
  waitForAudioTime,
  addQueueTracks,
} from '../scenarios/full-player';

test.use({ viewport: { width: 390, height: 844 } });

async function waitForTrackLoaded(page: import('@playwright/test').Page, timeout = 30000): Promise<string> {
  await page.waitForFunction(
    () => {
      const h2 = document.querySelector('.full-player.active h2');
      return h2 && h2.textContent && h2.textContent.trim().length > 0;
    },
    { timeout },
  );
  return await page.evaluate(() => {
    const h2 = document.querySelector('.full-player.active h2');
    return h2?.textContent ?? '';
  });
}

test.describe('Playback Controls', () => {
  test('toggles play/pause', async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);

    await clickTestId(page, 'btn-play');

    const paused = await waitForPaused(page);
    expect(paused).toBe(true);

    await clickTestId(page, 'btn-play');

    const playing = await waitForPlaying(page);
    expect(playing).toBe(true);
  });

  test('skips to next track via autoplay', async ({ page }) => {
    await startPlayback(page);
    await addQueueTracks(page);
    await openFullPlayer(page);

    const titleBefore = await waitForTrackLoaded(page);

    await clickTestId(page, 'btn-next');

    const titleAfter = await waitForTrackLoaded(page, 45000);
    expect(titleAfter).toBeTruthy();
    expect(titleAfter).not.toBe(titleBefore);
  });

  test('restarts current track when previous is clicked after 3s', async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);

    await waitForPlaying(page);
    await waitForAudioTime(page, 6, 30000);

    await clickTestId(page, 'btn-prev');
    await page.waitForTimeout(500);

    const timeAfter = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio?.currentTime ?? 999;
    });
    expect(timeAfter).toBeLessThan(2);
  });

  test('updates track metadata after skip', async ({ page }) => {
    await startPlayback(page);
    await addQueueTracks(page);
    await openFullPlayer(page);

    const titleBefore = await waitForTrackLoaded(page);

    await clickTestId(page, 'btn-next');

    const titleAfter = await waitForTrackLoaded(page, 45000);
    expect(titleAfter).toBeTruthy();
    expect(titleAfter).not.toBe(titleBefore);
  });

  test('shows loading state on track change', async ({ page }) => {
    await startPlayback(page);
    await addQueueTracks(page);
    await openFullPlayer(page);

    await waitForTrackLoaded(page);

    await clickTestId(page, 'btn-next');

    const isLoadingState = await page.evaluate(() => {
      const fp = document.querySelector('.full-player.active');
      const spinner = fp?.querySelector('div.animate-spin');
      const hasNoH2 = !fp?.querySelector('h2')?.textContent?.trim();
      return !!spinner || hasNoH2;
    });
    expect(isLoadingState).toBe(true);

    await waitForTrackLoaded(page, 45000);
  });
});
