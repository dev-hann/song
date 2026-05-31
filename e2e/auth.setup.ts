import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate via test credentials', async ({ page }) => {
  const testEmail = process.env.E2E_TEST_EMAIL;
  const testPassword = process.env.E2E_TEST_PASSWORD ?? 'e2e-test';

  if (!testEmail) {
    throw new Error('E2E_TEST_EMAIL environment variable is required');
  }

  const csrfResponse = await page.context().request.get('/api/auth/csrf');
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const loginResponse = await page.context().request.post('/api/auth/callback/test-credentials', {
    form: {
      email: testEmail,
      password: testPassword,
      csrfToken,
      callbackUrl: '/',
      json: 'true',
    },
  });

  expect(loginResponse.status()).toBe(200);

  await page.goto('/');
  await page.waitForURL(/\/home|\/$/);

  await expect(page.locator('body')).toBeVisible();

  await page.context().storageState({ path: authFile });
});
