import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  clickTestId,
  waitForPlaying,
  waitForAudioTime,
} from '../scenarios/full-player';

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test.describe('Full Player Seek Regression (Mobile Touch)', () => {
  test('audio does NOT go backwards when tapping to open full player', async ({ page }) => {
    await startPlayback(page);

    await waitForAudioTime(page, 8, 30000);

    const timeBefore = await page.evaluate(() => {
      return (document.querySelector('audio') as HTMLAudioElement).currentTime;
    });

    const bar = page.locator('.player-bar');
    await bar.tap();
    await page.waitForFunction(() => {
      const fp = document.querySelector('.full-player.active');
      return fp && fp.getBoundingClientRect().top < 10;
    }, { timeout: 5000 });
    await page.waitForTimeout(1000);

    const timeAfter = await page.evaluate(() => {
      return (document.querySelector('audio') as HTMLAudioElement).currentTime;
    });

    expect(timeAfter).toBeGreaterThanOrEqual(timeBefore);
  });

  test('audio does NOT go backwards when tapping close button', async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);

    await waitForAudioTime(page, 8, 30000);

    const timeBefore = await page.evaluate(() => {
      return (document.querySelector('audio') as HTMLAudioElement).currentTime;
    });

    await page.evaluate(() => {
      (document.querySelector('.full-player.active [data-testid="btn-close"]') as HTMLElement)?.click();
    });
    await page.waitForTimeout(1000);

    const timeAfter = await page.evaluate(() => {
      return (document.querySelector('audio') as HTMLAudioElement).currentTime;
    });

    expect(timeAfter).toBeGreaterThanOrEqual(timeBefore);
  });

  test('audio does NOT go backwards on repeated tap open/close', async ({ page }) => {
    await startPlayback(page);

    await waitForAudioTime(page, 8, 30000);

    for (let i = 0; i < 5; i++) {
      const timeBefore = await page.evaluate(() => {
        return (document.querySelector('audio') as HTMLAudioElement).currentTime;
      });

      await page.evaluate(() => {
        (document.querySelector('.player-bar') as HTMLElement)?.click();
      });
      await page.waitForFunction(() => {
        const fp = document.querySelector('.full-player.active');
        return fp && fp.getBoundingClientRect().top < 10;
      }, { timeout: 5000 });
      await page.waitForTimeout(500);

      const timeAfterOpen = await page.evaluate(() => {
        return (document.querySelector('audio') as HTMLAudioElement).currentTime;
      });
      expect(timeAfterOpen).toBeGreaterThanOrEqual(timeBefore);

      await page.evaluate(() => {
        (document.querySelector('.full-player.active [data-testid="btn-close"]') as HTMLElement)?.click();
      });
      await page.waitForTimeout(500);

      const timeAfterClose = await page.evaluate(() => {
        return (document.querySelector('audio') as HTMLAudioElement).currentTime;
      });
      expect(timeAfterClose).toBeGreaterThanOrEqual(timeAfterOpen);
    }
  });
});
