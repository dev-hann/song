import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  getFullPlayer,
  waitForPlaying,
  clickTestId,
} from '../scenarios/full-player';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Player Modes', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);
    await waitForPlaying(page);
  });

  test('toggles shuffle on and off', async ({ page }) => {
    const classBefore = await page.evaluate(() => {
      const svg = document.querySelector('.full-player.active [data-testid="btn-shuffle"] svg');
      return svg?.getAttribute('class') ?? '';
    });

    await clickTestId(page, 'btn-shuffle');
    await page.waitForTimeout(300);

    const classAfter = await page.evaluate(() => {
      const svg = document.querySelector('.full-player.active [data-testid="btn-shuffle"] svg');
      return svg?.getAttribute('class') ?? '';
    });
    expect(classBefore).not.toBe(classAfter);

    await clickTestId(page, 'btn-shuffle');
    await page.waitForTimeout(300);

    const classRestored = await page.evaluate(() => {
      const svg = document.querySelector('.full-player.active [data-testid="btn-shuffle"] svg');
      return svg?.getAttribute('class') ?? '';
    });
    expect(classRestored).toBe(classBefore);
  });

  test('cycles repeat mode: OFF -> ALL -> ONE -> OFF', async ({ page }) => {
    await clickTestId(page, 'btn-repeat');
    await page.waitForTimeout(300);
    const allClass = await page.evaluate(() => {
      const svg = document.querySelector('.full-player.active [data-testid="btn-repeat"] svg');
      return svg?.getAttribute('class') ?? '';
    });
    expect(allClass).toContain('text-foreground');
    expect(allClass).not.toContain('text-muted');

    await clickTestId(page, 'btn-repeat');
    await page.waitForTimeout(300);
    const oneSvg = await page.evaluate(() => {
      const svg = document.querySelector('.full-player.active [data-testid="btn-repeat"] svg');
      return svg?.getAttribute('class') ?? '';
    });
    expect(oneSvg).toContain('text-foreground');

    await clickTestId(page, 'btn-repeat');
    await page.waitForTimeout(300);
    const offClass = await page.evaluate(() => {
      const svg = document.querySelector('.full-player.active [data-testid="btn-repeat"] svg');
      return svg?.getAttribute('class') ?? '';
    });
    expect(offClass).toContain('text-muted');
  });

  test('opens speed picker and changes speed', async ({ page }) => {
    await clickTestId(page, 'btn-speed');

    const speed15 = page.locator('.full-player.active [data-testid="speed-picker"] button', { hasText: '1.5x' });
    await expect(speed15).toBeVisible();
    await speed15.click();

    await page.waitForTimeout(300);

    await clickTestId(page, 'btn-speed');
    const isActive = await page.evaluate(() => {
      const btns = document.querySelectorAll('.full-player.active [data-testid="speed-picker"] button');
      for (const btn of btns) {
        if (btn.textContent?.includes('1.5x')) return btn.classList.contains('bg-foreground');
      }
      return false;
    });
    expect(isActive).toBe(true);
  });

  test('toggles autoplay on and off', async ({ page }) => {
    const classBefore = await page.evaluate(() => {
      const svg = document.querySelector('.full-player.active [data-testid="btn-autoplay"] svg');
      return svg?.getAttribute('class') ?? '';
    });

    await clickTestId(page, 'btn-autoplay');
    await page.waitForTimeout(300);

    const classAfter = await page.evaluate(() => {
      const svg = document.querySelector('.full-player.active [data-testid="btn-autoplay"] svg');
      return svg?.getAttribute('class') ?? '';
    });
    expect(classBefore).not.toBe(classAfter);

    await clickTestId(page, 'btn-autoplay');
    await page.waitForTimeout(300);

    const classRestored = await page.evaluate(() => {
      const svg = document.querySelector('.full-player.active [data-testid="btn-autoplay"] svg');
      return svg?.getAttribute('class') ?? '';
    });
    expect(classRestored).toBe(classBefore);
  });

  test('all speed options are available', async ({ page }) => {
    await clickTestId(page, 'btn-speed');

    for (const speed of ['0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x']) {
      await expect(page.locator('.full-player.active [data-testid="speed-picker"] button', { hasText: speed })).toBeVisible();
    }
  });

  test('speed picker closes after selection', async ({ page }) => {
    await clickTestId(page, 'btn-speed');
    await page.locator('.full-player.active [data-testid="speed-picker"] button', { hasText: '2x' }).click();

    await page.waitForTimeout(300);

    await expect(page.locator('.full-player.active [data-testid="speed-picker"]')).not.toBeVisible();
    await expect(page.locator('.full-player.active [data-testid="btn-speed"]')).toBeVisible();
  });
});
