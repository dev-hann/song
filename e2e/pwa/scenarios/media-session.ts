import type { Page } from '@playwright/test';
import type { BaseDeviceAdapter } from '../fixtures';

const CHART_ITEM_SELECTOR = 'button[class*="w-full flex items-center gap-3"]';

export async function startPlaybackAndGetMetadata(page: Page): Promise<{ title: string; artist: string }> {
  await page.goto('/home');
  await page.waitForLoadState('networkidle');

  const firstChartItem = page.locator(CHART_ITEM_SELECTOR).first();
  await firstChartItem.waitFor({ state: 'visible', timeout: 10000 });
  await firstChartItem.click();

  await page.waitForFunction(
    () => {
      return navigator.mediaSession?.metadata?.title != null;
    },
    { timeout: 15000 },
  );

  return page.evaluate(() => {
    const metadata = navigator.mediaSession?.metadata;
    return {
      title: metadata?.title ?? '',
      artist: metadata?.artist ?? '',
    };
  });
}

export async function mediaSessionActionHandlersScenario(
  page: Page,
): Promise<Record<string, boolean>> {
  return page.evaluate(() => {
    const handlers: Record<string, boolean> = {};
    const actions = ['play', 'pause', 'stop', 'previoustrack', 'nexttrack', 'seekto'] as const;
    const ms = navigator.mediaSession as MediaSession & {
      actionHandlers?: Record<string, ((details: MediaSessionActionDetails) => void) | null>;
    };
    for (const action of actions) {
      handlers[action] = ms?.actionHandlers?.[action] != null;
    }
    return handlers;
  });
}

export async function mediaSessionMetadataScenario(
  page: Page,
): Promise<{ title: string; artist: string }> {
  return startPlaybackAndGetMetadata(page);
}

export async function mediaSessionPositionStateScenario(
  page: Page,
  _device: BaseDeviceAdapter,
): Promise<{ duration: number; position: number; playbackRate: number } | null> {
  await page.goto('/home');
  await page.waitForLoadState('networkidle');

  const firstChartItem = page.locator(CHART_ITEM_SELECTOR).first();
  await firstChartItem.waitFor({ state: 'visible', timeout: 10000 });
  await firstChartItem.click();

  await page.waitForFunction(
    () => {
      const el = document.querySelector('audio');
      return el && el.duration > 0 && isFinite(el.duration);
    },
    { timeout: 15000 },
  );

  return page.evaluate(() => {
    try {
      const el = document.querySelector('audio');
      if (!el) {return null;}
      return {
        duration: el.duration,
        position: el.currentTime,
        playbackRate: el.playbackRate,
      };
    } catch {
      return null;
    }
  });
}
