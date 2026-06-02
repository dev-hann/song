import type { Page } from '@playwright/test';

const PLAYER_BAR_SELECTOR = '.player-bar';
const FULL_PLAYER_SELECTOR = '.full-player.active';

export async function startPlayback(page: Page): Promise<void> {
  await page.goto('/home');
  await page.waitForLoadState('networkidle');

  const firstChartItem = page.locator('[data-testid="chart-item"]').first();
  await firstChartItem.waitFor({ state: 'visible', timeout: 15000 });
  await firstChartItem.click();

  const playNowButton = page.getByRole('button', { name: '바로 재생' });
  await playNowButton.waitFor({ state: 'visible', timeout: 20000 });
  await playNowButton.click();

  await page.locator(PLAYER_BAR_SELECTOR).waitFor({ state: 'visible', timeout: 30000 });

  try {
    await page.waitForFunction(
      () => {
        const audio = document.querySelector('audio');
        return audio && !audio.paused;
      },
      { timeout: 30000 },
    );
  } catch {
    console.warn('[startPlayback] Audio did not start playing within timeout');
  }

  await page.waitForTimeout(1000);
}

export async function addQueueTracks(page: Page): Promise<void> {
  const chartItems = page.locator('[data-testid="chart-item"]');
  const count = await chartItems.count();
  const tracksToAdd = Math.min(2, count - 1);

  for (let i = 0; i < tracksToAdd; i++) {
    const idx = i + 1;
    try {
      await chartItems.nth(idx).click({ timeout: 5000 });
      const playNextBtn = page.getByRole('button', { name: '다음에 재생' });
      await playNextBtn.waitFor({ state: 'visible', timeout: 10000 });
      await playNextBtn.click();
      await page.waitForTimeout(500);
    } catch {
      await page.keyboard.press('Escape').catch(() => undefined);
    }
  }
}

export async function openFullPlayer(page: Page): Promise<void> {
  await page.locator(PLAYER_BAR_SELECTOR).click();
  await page.waitForFunction(
    () => {
      const fp = document.querySelector('.full-player.active');
      if (!fp) return false;
      const rect = fp.getBoundingClientRect();
      return rect.top < 10 && rect.top >= 0;
    },
    { timeout: 5000 },
  );
}

export async function closeFullPlayer(page: Page): Promise<void> {
  await page.locator('.full-player.active [data-testid="btn-close"]').click({ force: true });
  await page.waitForTimeout(500);
}

export function getFullPlayer(page: Page) {
  return page.locator(FULL_PLAYER_SELECTOR);
}

export async function clickTestId(page: Page, testId: string): Promise<void> {
  await page.evaluate((id) => {
    const el = document.querySelector(`.full-player.active [data-testid="${id}"]`) as HTMLElement;
    el?.click();
  }, testId);
  await page.waitForTimeout(100);
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

export async function getFullPlayerTrackTitle(page: Page): Promise<string> {
  const fullPlayer = getFullPlayer(page);
  return (await fullPlayer.locator('h2').textContent()) ?? '';
}

export async function waitForAudioTime(page: Page, minTime: number, timeout = 20000): Promise<void> {
  await page.waitForFunction(
    (t) => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio && audio.currentTime >= t;
    },
    minTime,
    { timeout },
  );
}
