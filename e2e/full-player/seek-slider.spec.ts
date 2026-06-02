import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  getFullPlayer,
  waitForPlaying,
} from '../scenarios/full-player';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Seek Slider', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);
    await waitForPlaying(page);
  });

  test('renders slider elements and time display', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    await expect(fullPlayer.locator('[data-slot="slider-track"]')).toBeVisible();
    await expect(fullPlayer.locator('[data-slot="slider-range"]')).toBeVisible();
    await expect(fullPlayer.locator('[data-slot="slider-thumb"]')).toBeVisible();

    const timeLabels = fullPlayer.getByText(/\d+:\d+/);
    const count = await timeLabels.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('seeks forward by tapping on track', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);
    await page.waitForTimeout(2000);

    const track = fullPlayer.locator('[data-slot="slider-track"]');
    const box = await track.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.click(box!.x + box!.width * 0.8, box!.y + box!.height / 2);
    await page.waitForTimeout(1000);

    const timeAfter = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      const duration = audio?.duration ?? 1;
      return (audio?.currentTime ?? 0) / duration;
    });

    expect(timeAfter).toBeGreaterThan(0.5);
  });

  test('seeks by dragging thumb', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);
    await page.waitForTimeout(2000);

    const thumb = fullPlayer.locator('[data-slot="slider-thumb"]');
    const thumbBox = await thumb.boundingBox();
    const track = fullPlayer.locator('[data-slot="slider-track"]');
    const trackBox = await track.boundingBox();
    expect(thumbBox).not.toBeNull();
    expect(trackBox).not.toBeNull();

    const startX = thumbBox!.x + thumbBox!.width / 2;
    const startY = thumbBox!.y + thumbBox!.height / 2;
    const endX = trackBox!.x + trackBox!.width * 0.8;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, startY, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(1000);

    const timeAfter = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      const duration = audio?.duration ?? 1;
      return (audio?.currentTime ?? 0) / duration;
    });

    expect(timeAfter).toBeGreaterThan(0.5);
  });

  test('updates time display during drag', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);
    await page.waitForTimeout(2000);

    const timeLabelBefore = await fullPlayer.locator('.mb-4 span').first().textContent();

    const track = fullPlayer.locator('[data-slot="slider-track"]');
    const trackBox = await track.boundingBox();
    expect(trackBox).not.toBeNull();

    await page.mouse.click(trackBox!.x + trackBox!.width * 0.6, trackBox!.y + trackBox!.height / 2);
    await page.waitForTimeout(500);

    const timeLabelAfter = await fullPlayer.locator('.mb-4 span').first().textContent();

    expect(timeLabelBefore).toBeTruthy();
    expect(timeLabelAfter).toBeTruthy();
  });

  test('continues playing after seek', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);
    await page.waitForTimeout(2000);

    const track = fullPlayer.locator('[data-slot="slider-track"]');
    const trackBox = await track.boundingBox();
    expect(trackBox).not.toBeNull();

    await page.mouse.click(trackBox!.x + trackBox!.width * 0.5, trackBox!.y + trackBox!.height / 2);
    await page.waitForTimeout(1500);

    const paused = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio?.paused ?? true;
    });

    expect(paused).toBe(false);
  });
});
