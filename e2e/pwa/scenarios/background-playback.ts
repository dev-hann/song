import type { Page } from '@playwright/test';
import type { BaseDeviceAdapter } from '../fixtures';

const CHART_ITEM_SELECTOR = 'button[class*="w-full flex items-center gap-3"]';
const PLAYER_BAR_SELECTOR = '.player-bar';

export async function startPlayback(page: Page): Promise<void> {
  await page.goto('/home');
  await page.waitForLoadState('networkidle');

  const firstChartItem = page.locator(CHART_ITEM_SELECTOR).first();
  await firstChartItem.waitFor({ state: 'visible', timeout: 10000 });
  await firstChartItem.click();

  await page.locator(PLAYER_BAR_SELECTOR).waitFor({ state: 'visible', timeout: 20000 });

  try {
    await page.waitForFunction(
      () => {
        const audio = document.querySelector('audio');
        return audio && !audio.paused;
      },
      { timeout: 20000 },
    );
  } catch {
    console.warn('[startPlayback] Audio did not start playing within timeout, proceeding anyway');
  }

  await page.waitForTimeout(1000);
}

export async function waitForPlaybackState(
  page: Page,
  expectedState: 'playing' | 'paused' | 'idle',
  timeout = 10000,
): Promise<boolean> {
  try {
    if (expectedState === 'playing') {
      await page.waitForFunction(
        () => {
          const audio = document.querySelector('audio');
          return audio && !audio.paused;
        },
        { timeout },
      );
    } else if (expectedState === 'paused') {
      await page.waitForFunction(
        () => {
          const audio = document.querySelector('audio');
          return audio && audio.paused;
        },
        { timeout },
      );
    }
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentTrackTitle(page: Page): Promise<string> {
  const playerBar = page.locator(PLAYER_BAR_SELECTOR);
  const titleEl = playerBar.locator('p').first();
  return (await titleEl.textContent()) ?? '';
}

export async function isPlayerBarVisible(page: Page): Promise<boolean> {
  const playerBar = page.locator(PLAYER_BAR_SELECTOR);
  return playerBar.isVisible();
}

export async function backgroundPlaybackScenario(
  page: Page,
  device: BaseDeviceAdapter,
): Promise<{ backgroundStillPlaying: boolean; foregroundStateMatches: boolean }> {
  await startPlayback(page);

  const titleBefore = await getCurrentTrackTitle(page);
  const stateBefore = await device.getMediaSessionPlaybackState(page);

  await device.goToBackground();
  await page.waitForTimeout(3000);

  const backgroundStillPlaying = await device.getMediaSessionPlaybackState(page) === 'playing';

  await device.bringToForeground();
  await page.waitForTimeout(2000);

  const stateAfter = await device.getMediaSessionPlaybackState(page);
  const foregroundStateMatches = stateAfter === stateBefore;

  const titleAfter = await getCurrentTrackTitle(page);
  const trackPreserved = titleBefore === titleAfter;

  return {
    backgroundStillPlaying,
    foregroundStateMatches: foregroundStateMatches && trackPreserved,
  };
}

export async function mediaSessionPauseScenario(
  page: Page,
  device: BaseDeviceAdapter,
): Promise<boolean> {
  await startPlayback(page);

  await device.goToBackground();
  await page.waitForTimeout(1000);

  await device.pressMediaButton('pause');
  await page.waitForTimeout(1000);

  const state = await device.getMediaSessionPlaybackState(page);

  await device.bringToForeground();
  await page.waitForTimeout(1000);

  return state === 'paused';
}

export async function mediaSessionPlayScenario(
  page: Page,
  device: BaseDeviceAdapter,
): Promise<boolean> {
  await startPlayback(page);

  await device.goToBackground();
  await page.waitForTimeout(1000);

  await device.pressMediaButton('pause');
  await page.waitForTimeout(1000);

  await device.pressMediaButton('play');
  await page.waitForTimeout(1000);

  const state = await device.getMediaSessionPlaybackState(page);

  await device.bringToForeground();
  await page.waitForTimeout(1000);

  return state === 'playing';
}

export async function mediaSessionNextTrackScenario(
  page: Page,
  device: BaseDeviceAdapter,
): Promise<boolean> {
  await startPlayback(page);

  const titleBefore = await getCurrentTrackTitle(page);

  await device.goToBackground();
  await page.waitForTimeout(1000);

  await device.pressMediaButton('nexttrack');
  await page.waitForTimeout(2000);

  await device.bringToForeground();
  await page.waitForTimeout(2000);

  const titleAfter = await getCurrentTrackTitle(page);
  return titleBefore !== titleAfter && titleAfter.length > 0;
}

export async function networkDisconnectScenario(
  page: Page,
  device: BaseDeviceAdapter,
): Promise<boolean> {
  await startPlayback(page);

  await device.setNetwork(false);
  await page.waitForTimeout(3000);

  const stateWhileOffline = await device.getMediaSessionPlaybackState(page);

  await device.setNetwork(true);
  await page.waitForTimeout(2000);

  return stateWhileOffline === 'playing';
}
