import type { Page, Locator } from '@playwright/test';

const CHART_ITEM_SELECTOR = 'button[class*="w-full flex items-center gap-3"]';
const PLAYER_BAR_SELECTOR = '.player-bar';
const FULL_PLAYER_SELECTOR = '.full-player.active';

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

export async function openFullPlayer(page: Page): Promise<void> {
  await page.locator(PLAYER_BAR_SELECTOR).click();
  await page.locator(FULL_PLAYER_SELECTOR).waitFor({ state: 'visible', timeout: 5000 });
}

export async function closeFullPlayer(page: Page): Promise<void> {
  const closeButton = page.locator('.full-player svg.lucide-chevron-down').first();
  await closeButton.click();
  await page.waitForTimeout(500);
}

export function getFullPlayer(page: Page): Locator {
  return page.locator(FULL_PLAYER_SELECTOR);
}

export async function waitForPlaying(page: Page, timeout = 15000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const audio = document.querySelector('audio');
        return audio && !audio.paused;
      },
      { timeout },
    );
    return true;
  } catch {
    return false;
  }
}

export async function waitForPaused(page: Page, timeout = 10000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const audio = document.querySelector('audio');
        return audio && audio.paused;
      },
      { timeout },
    );
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

export async function getFullPlayerTrackTitle(page: Page): Promise<string> {
  const fullPlayer = getFullPlayer(page);
  return (await fullPlayer.locator('h2').textContent()) ?? '';
}

export async function getAudioCurrentTime(page: Page): Promise<number> {
  return page.evaluate(() => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    return audio?.currentTime ?? 0;
  });
}

export async function getAudioDuration(page: Page): Promise<number> {
  return page.evaluate(() => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    return audio?.duration ?? 0;
  });
}

export async function isAudioPaused(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const audio = document.querySelector('audio') as HTMLAudioElement;
    return audio?.paused ?? true;
  });
}

export async function getPlaybackStatus(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector('audio') as HTMLAudioElement;
    if (!el) {return 'idle';}
    if (el.paused) {return 'paused';}
    return 'playing';
  });
}
