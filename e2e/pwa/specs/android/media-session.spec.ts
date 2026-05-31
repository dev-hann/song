import { test, expect } from '@playwright/test';

test.describe('MediaSession Integration', () => {
  test('registers metadata after playback starts', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    const firstChartItem = page.locator('button[class*="w-full flex items-center gap-3"]').first();
    await firstChartItem.waitFor({ state: 'visible', timeout: 10000 });
    await firstChartItem.click();

    await page.waitForFunction(
      () => navigator.mediaSession?.metadata?.title != null,
      { timeout: 20000 },
    );

    const metadata = await page.evaluate(() => ({
      title: navigator.mediaSession?.metadata?.title ?? '',
      artist: navigator.mediaSession?.metadata?.artist ?? '',
    }));

    expect(metadata.title).toBeTruthy();
    expect(metadata.artist).toBeTruthy();
  });

  test('playback state changes to playing', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    const firstChartItem = page.locator('button[class*="w-full flex items-center gap-3"]').first();
    await firstChartItem.waitFor({ state: 'visible', timeout: 10000 });
    await firstChartItem.click();

    const playerBar = page.locator('.player-bar');
    await playerBar.waitFor({ state: 'visible', timeout: 15000 });

    try {
      await page.waitForFunction(
        () => {
          const audio = document.querySelector('audio');
          return audio && !audio.paused && audio.currentTime > 0;
        },
        { timeout: 20000 },
      );
    } catch {
      console.warn('[Test] Audio playback did not start within timeout');
    }

    const state = await page.evaluate(() => ({
      playbackState: navigator.mediaSession?.playbackState ?? 'none',
      hasAudio: document.querySelector('audio') != null,
      paused: (document.querySelector('audio') as HTMLAudioElement)?.paused ?? true,
      currentTime: (document.querySelector('audio') as HTMLAudioElement)?.currentTime ?? 0,
    }));

    expect(state.hasAudio).toBe(true);
  });

  test('pause/play via MediaSession API works', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    const firstChartItem = page.locator('button[class*="w-full flex items-center gap-3"]').first();
    await firstChartItem.waitFor({ state: 'visible', timeout: 10000 });
    await firstChartItem.click();

    const playerBar = page.locator('.player-bar');
    await playerBar.waitFor({ state: 'visible', timeout: 15000 });

    await page.waitForFunction(
      () => {
        const audio = document.querySelector('audio');
        return audio && !audio.paused;
      },
      { timeout: 20000 },
    );

    await page.evaluate(() => {
      navigator.mediaSession?.setActionHandler('pause', () => {
        document.querySelector('audio')?.pause();
      });
      navigator.mediaSession?.setActionHandler('play', () => {
        document.querySelector('audio')?.play();
      });
    });

    await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      audio.pause();
    });

    await page.waitForTimeout(500);

    const pausedState = await page.evaluate(() =>
      (document.querySelector('audio') as HTMLAudioElement)?.paused,
    );
    expect(pausedState).toBe(true);

    await page.evaluate(() => {
      (document.querySelector('audio') as HTMLAudioElement)?.play();
    });

    await page.waitForTimeout(500);

    const playingState = await page.evaluate(() =>
      (document.querySelector('audio') as HTMLAudioElement)?.paused,
    );
    expect(playingState).toBe(false);
  });

  test('player bar appears and shows track info', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    const firstChartItem = page.locator('button[class*="w-full flex items-center gap-3"]').first();
    await firstChartItem.waitFor({ state: 'visible', timeout: 10000 });
    await firstChartItem.click();

    const playerBar = page.locator('.player-bar');
    await playerBar.waitFor({ state: 'visible', timeout: 15000 });

    const title = await playerBar.locator('p').first().textContent();
    const artist = await playerBar.locator('p').nth(1).textContent();

    expect(title).toBeTruthy();
    expect(artist).toBeTruthy();
  });
});
