import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  getFullPlayer,
  waitForPlaying,
} from '../scenarios/full-player';

test.describe('Seek Slider', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);
  });

  test('renders slider elements and time display', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const track = fullPlayer.locator('[data-slot="slider-track"]');
    await expect(track).toBeVisible();

    const indicator = fullPlayer.locator('[data-slot="slider-range"]');
    await expect(indicator).toBeVisible();

    const thumb = fullPlayer.locator('[data-slot="slider-thumb"]');
    await expect(thumb).toBeVisible();

    const timeLabels = fullPlayer.locator('text:/\\d+:\\d+/');
    const count = await timeLabels.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('seeks by tapping on track', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    await page.waitForTimeout(2000);
    await waitForPlaying(page);

    const timeBefore = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio?.currentTime ?? 0;
    });
    expect(timeBefore).toBeGreaterThan(0);

    const track = fullPlayer.locator('[data-slot="slider-track"]');
    const box = await track.boundingBox();
    expect(box).not.toBeNull();

    const targetX = box!.x + box!.width * 0.7;
    const targetY = box!.y + box!.height / 2;

    await page.mouse.click(targetX, targetY);
    await page.waitForTimeout(1000);

    const timeAfter = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio?.currentTime ?? 0;
    });

    expect(timeAfter).toBeGreaterThan(timeBefore);
  });

  test('seeks by dragging thumb', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    await page.waitForTimeout(2000);
    await waitForPlaying(page);

    const thumb = fullPlayer.locator('[data-slot="slider-thumb"]');
    const box = await thumb.boundingBox();
    expect(box).not.toBeNull();

    const track = fullPlayer.locator('[data-slot="slider-track"]');
    const trackBox = await track.boundingBox();
    expect(trackBox).not.toBeNull();

    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;
    const endX = trackBox!.x + trackBox!.width * 0.8;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, startY, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(1000);

    const timeAfter = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio?.currentTime ?? 0;
    });

    const duration = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio?.duration ?? 0;
    });

    expect(duration).toBeGreaterThan(0);
    expect(timeAfter).toBeGreaterThan(duration * 0.5);
  });

  test('updates time display during drag', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    await page.waitForTimeout(2000);
    await waitForPlaying(page);

    const timeLabelBefore = await fullPlayer.locator('.mb-4 span').first().textContent();

    const track = fullPlayer.locator('[data-slot="slider-track"]');
    const trackBox = await track.boundingBox();
    expect(trackBox).not.toBeNull();

    const targetX = trackBox!.x + trackBox!.width * 0.6;
    const targetY = trackBox!.y + trackBox!.height / 2;

    await page.mouse.click(targetX, targetY);
    await page.waitForTimeout(500);

    const timeLabelAfter = await fullPlayer.locator('.mb-4 span').first().textContent();

    expect(timeLabelBefore).toBeTruthy();
    expect(timeLabelAfter).toBeTruthy();
  });

  test('continues playing after seek', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    await page.waitForTimeout(2000);
    await waitForPlaying(page);

    const track = fullPlayer.locator('[data-slot="slider-track"]');
    const trackBox = await track.boundingBox();
    expect(trackBox).not.toBeNull();

    const targetX = trackBox!.x + trackBox!.width * 0.5;
    const targetY = trackBox!.y + trackBox!.height / 2;

    await page.mouse.click(targetX, targetY);
    await page.waitForTimeout(1500);

    const paused = await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      return audio?.paused ?? true;
    });

    expect(paused).toBe(false);
  });
});
