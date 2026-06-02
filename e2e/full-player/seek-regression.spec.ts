import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  clickTestId,
  waitForPlaying,
  waitForAudioTime,
} from '../scenarios/full-player';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Full Player Seek Regression', () => {
  test('audio does NOT go backwards when opening full player', async ({ page }) => {
    await startPlayback(page);

    await waitForAudioTime(page, 6, 30000);

    const timeBefore = await page.evaluate(() => {
      return (document.querySelector('audio') as HTMLAudioElement).currentTime;
    });

    await openFullPlayer(page);
    await page.waitForTimeout(1000);

    const timeAfter = await page.evaluate(() => {
      return (document.querySelector('audio') as HTMLAudioElement).currentTime;
    });

    expect(timeAfter).toBeGreaterThanOrEqual(timeBefore);
  });

  test('audio does NOT go backwards when closing full player', async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);

    await waitForAudioTime(page, 6, 30000);

    const timeBefore = await page.evaluate(() => {
      return (document.querySelector('audio') as HTMLAudioElement).currentTime;
    });

    await clickTestId(page, 'btn-close');
    await page.waitForTimeout(1000);

    const timeAfter = await page.evaluate(() => {
      return (document.querySelector('audio') as HTMLAudioElement).currentTime;
    });

    expect(timeAfter).toBeGreaterThanOrEqual(timeBefore);
  });

  test('audio does NOT go backwards on repeated open/close', async ({ page }) => {
    await startPlayback(page);

    await waitForAudioTime(page, 6, 30000);

    for (let i = 0; i < 5; i++) {
      const timeBefore = await page.evaluate(() => {
        return (document.querySelector('audio') as HTMLAudioElement).currentTime;
      });

      await openFullPlayer(page);
      await page.waitForTimeout(500);

      const timeAfterOpen = await page.evaluate(() => {
        return (document.querySelector('audio') as HTMLAudioElement).currentTime;
      });
      expect(timeAfterOpen).toBeGreaterThanOrEqual(timeBefore);

      await clickTestId(page, 'btn-close');
      await page.waitForTimeout(500);

      const timeAfterClose = await page.evaluate(() => {
        return (document.querySelector('audio') as HTMLAudioElement).currentTime;
      });
      expect(timeAfterClose).toBeGreaterThanOrEqual(timeAfterOpen);
    }
  });

  test('store currentTime stays in sync with audio element', async ({ page }) => {
    await startPlayback(page);

    await waitForAudioTime(page, 6, 30000);

    await openFullPlayer(page);
    await page.waitForTimeout(500);

    const { audioTime, sliderPct, duration } = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      const audioTime = audio.currentTime;
      const duration = audio.duration || 1;
      const thumb = document.querySelector('.full-player.active [data-slot="slider-thumb"]');
      const track = document.querySelector('.full-player.active [data-slot="slider-track"]');
      const thumbRect = thumb?.getBoundingClientRect();
      const trackRect = track?.getBoundingClientRect();
      const sliderPct = thumbRect && trackRect ? thumbRect.left / trackRect.width : -1;
      return { audioTime, sliderPct, duration };
    });

    const expectedPct = audioTime / duration;
    const diff = Math.abs(sliderPct - expectedPct);
    expect(diff).toBeLessThan(0.05);
  });
});
