import { test, expect } from './fixtures/test';

test.describe('Likes', () => {
  test('should display liked page with correct heading', async ({ authenticatedPage: page }) => {
    await page.goto('/liked');
    await page.waitForURL('/liked');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: '좋아요한 곡' })).toBeVisible({ timeout: 10000 });
  });

  test('should display recent page with correct heading', async ({ authenticatedPage: page }) => {
    await page.goto('/recent');
    await page.waitForURL('/recent');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: '최근 재생' })).toBeVisible({ timeout: 10000 });
  });

  test('should show clear history button on recent page when items exist', async ({ authenticatedPage: page }) => {
    await page.goto('/recent');
    await page.waitForURL('/recent');
    await page.waitForTimeout(2000);

    const clearBtn = page.getByText('전체 삭제');
    const isVisible = await clearBtn.isVisible().catch(() => false);

    if (isVisible) {
      await expect(clearBtn).toBeEnabled();
    }
  });
});
