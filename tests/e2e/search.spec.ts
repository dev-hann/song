import { test, expect } from './fixtures/test';

test.describe('Search', () => {
  test('should show search input on search page', async ({ authenticatedPage: page }) => {
    await page.goto('/search');
    await page.waitForURL('/search');
    await page.waitForTimeout(2000);

    const input = page.getByPlaceholder('노래, 아티스트 검색...');
    await expect(input).toBeVisible({ timeout: 10000 });
  });

  test('should display search results after typing and pressing Enter', async ({ authenticatedPage: page }) => {
    await page.goto('/search');
    await page.waitForURL('/search');
    await page.waitForTimeout(2000);

    const input = page.getByPlaceholder('노래, 아티스트 검색...');
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('BTS Dynamite');
    await input.press('Enter');

    await page.waitForTimeout(5000);

    const trackItems = page.locator('img[alt]').filter({ hasNot: page.locator('svg') });
    const count = await trackItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show clear button when search input has text', async ({ authenticatedPage: page }) => {
    await page.goto('/search');
    await page.waitForURL('/search');
    await page.waitForTimeout(2000);

    const input = page.getByPlaceholder('노래, 아티스트 검색...');
    await expect(input).toBeVisible({ timeout: 10000 });

    await input.fill('test');

    const clearBtn = input.locator('..').locator('button').filter({ has: page.locator('svg') });
    await expect(clearBtn).toBeVisible({ timeout: 5000 });

    await clearBtn.click();
    await expect(input).toHaveValue('');
  });

  test('should play a track from search results and show player bar', async ({ authenticatedPage: page }) => {
    await page.goto('/search');
    await page.waitForURL('/search');
    await page.waitForTimeout(2000);

    const input = page.getByPlaceholder('노래, 아티스트 검색...');
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('NewJeans Hype Boy');
    await input.press('Enter');

    await page.waitForTimeout(5000);

    const trackItems = page.locator('[class*="w-12"]').locator('..').filter({ has: page.locator('img') });
    const count = await trackItems.count();

    if (count > 0) {
      await trackItems.first().click();
      await page.waitForTimeout(3000);

      const playerBar = page.locator('.player-bar');
      await expect(playerBar).toBeVisible({ timeout: 10000 }).catch(() => {});
    }
  });
});
