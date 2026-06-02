import { test, expect } from '@playwright/test';
import {
  startPlayback,
  openFullPlayer,
  getFullPlayer,
  waitForPlaying,
  clickTestId,
} from '../scenarios/full-player';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Dropdown Menu', () => {
  test.beforeEach(async ({ page }) => {
    await startPlayback(page);
    await openFullPlayer(page);
    await waitForPlaying(page);
  });

  test('opens and closes dropdown menu', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);
    await expect(fullPlayer.locator('h2')).toBeVisible();

    await clickTestId(page, 'btn-menu');

    const menuItem = page.getByText('YouTube에서 보기');
    await expect(menuItem).toBeVisible();

    const shareItem = page.getByText('공유');
    await expect(shareItem).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await expect(menuItem).not.toBeVisible();
  });

  test('share button copies YouTube URL to clipboard', async ({ page }) => {
    const fullPlayer = getFullPlayer(page);
    await expect(fullPlayer.locator('h2')).toBeVisible();

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await clickTestId(page, 'btn-menu');

    const shareItem = page.getByText('공유');
    await expect(shareItem).toBeVisible();
    await shareItem.click();

    await page.waitForTimeout(500);

    await expect(page.getByText('YouTube에서 보기')).not.toBeVisible();
  });
});
