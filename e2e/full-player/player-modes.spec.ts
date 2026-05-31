import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  getFullPlayer,
  waitForPlaying,
} from '../scenarios/full-player';

test.describe('Player Modes', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);
  });

  test('toggles shuffle on and off', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const shuffleButton = fullPlayer.locator('svg.lucide-shuffle').locator('..');
    const classBefore = await shuffleButton.locator('svg').getAttribute('class');

    await shuffleButton.click();

    const classAfter = await shuffleButton.locator('svg').getAttribute('class');

    expect(classBefore).not.toBe(classAfter);

    await shuffleButton.click();

    const classRestored = await shuffleButton.locator('svg').getAttribute('class');
    expect(classRestored).toBe(classBefore);
  });

  test('cycles repeat mode: OFF -> ALL -> ONE -> OFF', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const repeatButton = fullPlayer.locator('[class*="relative"]').filter({
      has: page.locator('svg.lucide-repeat, svg.lucide-repeat-1'),
    });

    await repeatButton.click();
    await page.waitForTimeout(300);

    const hasRepeatIcon = await fullPlayer.locator('svg.lucide-repeat').count();
    expect(hasRepeatIcon).toBeGreaterThanOrEqual(1);

    await repeatButton.click();
    await page.waitForTimeout(300);

    const hasRepeat1Icon = await fullPlayer.locator('svg.lucide-repeat-1').count();
    expect(hasRepeat1Icon).toBe(1);

    await repeatButton.click();
    await page.waitForTimeout(300);

    const mutedClass = await fullPlayer.locator('svg.lucide-repeat').first().getAttribute('class');
    expect(mutedClass).toContain('text-muted');
  });

  test('opens speed picker and changes speed', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const speedButton = fullPlayer.locator('svg.lucide-gauge').locator('..');
    await speedButton.click();

    const speed15 = fullPlayer.locator('button', { hasText: '1.5x' });
    await expect(speed15).toBeVisible();

    await speed15.click();

    await page.waitForTimeout(300);

    const activeSpeed = fullPlayer.locator('button[class*="bg-foreground"][class*="text-background"]').filter({ hasText: '1.5x' });
    await expect(activeSpeed).toBeVisible();

    const gaugeHidden = await fullPlayer.locator('svg.lucide-gauge').count();
    expect(gaugeHidden).toBe(1);
  });

  test('toggles autoplay on and off', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const autoplayButton = fullPlayer.locator('svg.lucide-infinity').locator('..');
    const classBefore = await autoplayButton.locator('svg').getAttribute('class');

    await autoplayButton.click();

    const classAfter = await autoplayButton.locator('svg').getAttribute('class');
    expect(classBefore).not.toBe(classAfter);

    await autoplayButton.click();

    const classRestored = await autoplayButton.locator('svg').getAttribute('class');
    expect(classRestored).toBe(classBefore);
  });

  test('all speed options are available', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const speedButton = fullPlayer.locator('svg.lucide-gauge').locator('..');
    await speedButton.click();

    const expectedSpeeds = ['0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x'];

    for (const speed of expectedSpeeds) {
      const btn = fullPlayer.locator('button', { hasText: speed });
      await expect(btn).toBeVisible();
    }
  });

  test('speed picker closes after selection', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);

    const speedButton = fullPlayer.locator('svg.lucide-gauge').locator('..');
    await speedButton.click();

    const speed2 = fullPlayer.locator('button', { hasText: '2x' });
    await speed2.click();

    await page.waitForTimeout(300);

    const speedPicker = fullPlayer.locator('button', { hasText: '0.5x' });
    await expect(speedPicker).not.toBeVisible();

    const gaugeVisible = await fullPlayer.locator('svg.lucide-gauge').count();
    expect(gaugeVisible).toBe(1);
  });
});
