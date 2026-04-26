import { test, expect } from './fixtures/test';

test.describe('Authentication', () => {
  test('should redirect to /login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('should show login page with SONG title and Google login button', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: 'SONG' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Google 계정으로 로그인하세요')).toBeVisible();
  });

  test('should redirect to /home when already authenticated', async ({ page }) => {
    const testUser = {
      id: 'test-user',
      email: 'test@song.local',
      name: 'Test User',
    };

    await page.goto('/login');
    await page.evaluate((user) => {
      localStorage.setItem('song_user', JSON.stringify(user));
    }, testUser);

    await page.goto('/login');
    await page.waitForURL(/\/home/, { timeout: 10000 });
    expect(page.url()).toContain('/home');
  });

  test('should protect routes from unauthenticated access', async ({ page }) => {
    for (const path of ['/library', '/search', '/liked', '/recent']) {
      await page.goto(path);
      await page.waitForURL(/\/login/, { timeout: 10000 });
      expect(page.url()).toContain('/login');
    }
  });
});
