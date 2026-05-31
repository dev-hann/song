import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('new user sees onboarding page after login', async ({ page }) => {
    await page.goto('/home');

    await page.waitForURL(/\/(onboarding|home)/);

    const url = page.url();
    if (url.includes('/onboarding')) {
      await expect(page.getByText('어떤 음악을 좋아하세요?')).toBeVisible({ timeout: 10000 });
    }
  });

  test('onboarding page has genre chips', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.getByText('어떤 음악을 좋아하세요?')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('발라드')).toBeVisible();
    await expect(page.getByText('댄스')).toBeVisible();
    await expect(page.getByText('랩/힙합')).toBeVisible();
    await expect(page.getByText('R&B/Soul')).toBeVisible();
    await expect(page.getByText('인디음악')).toBeVisible();
    await expect(page.getByText('CCM')).toBeVisible();
  });

  test('next button is disabled until minimum genres selected', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.getByText('어떤 음악을 좋아하세요?')).toBeVisible({ timeout: 10000 });

    const nextButton = page.getByRole('button', { name: /다음/ });
    await expect(nextButton).toBeDisabled();

    await page.getByText('발라드').click();
    await expect(nextButton).toBeDisabled();

    await page.getByText('댄스').click();
    await expect(nextButton).toBeEnabled();
  });

  test('skip button navigates to home and does not redirect back', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.getByText('어떤 음악을 좋아하세요?')).toBeVisible({ timeout: 10000 });

    await page.getByText('건너뛰기').click();

    await page.waitForURL('**/home', { timeout: 10000 });
    expect(page.url()).toContain('/home');

    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/home');
    expect(page.url()).not.toContain('/onboarding');
  });

  test('step 2 shows artists after genre selection', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.getByText('어떤 음악을 좋아하세요?')).toBeVisible({ timeout: 10000 });

    await page.getByText('발라드').click();
    await page.getByText('댄스').click();

    await page.getByRole('button', { name: /다음/ }).click();

    await expect(page.getByText('어떤 아티스트를 좋아하세요?')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('건너뛰기')).toBeVisible();
    await expect(page.getByText('장르 다시 선택')).toBeVisible();
  });

  test('start button is disabled until minimum artists selected', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.getByText('어떤 음악을 좋아하세요?')).toBeVisible({ timeout: 10000 });

    await page.getByText('발라드').click();
    await page.getByText('댄스').click();
    await page.getByRole('button', { name: /다음/ }).click();

    await expect(page.getByText('어떤 아티스트를 좋아하세요?')).toBeVisible({ timeout: 5000 });

    const startButton = page.getByRole('button', { name: /시작하기/ });
    await expect(startButton).toBeDisabled();
  });

  test('back button returns to genre selection', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.getByText('어떤 음악을 좋아하세요?')).toBeVisible({ timeout: 10000 });

    await page.getByText('발라드').click();
    await page.getByText('댄스').click();
    await page.getByRole('button', { name: /다음/ }).click();

    await expect(page.getByText('어떤 아티스트를 좋아하세요?')).toBeVisible({ timeout: 5000 });

    await page.getByText('장르 다시 선택').click();

    await expect(page.getByText('어떤 음악을 좋아하세요?')).toBeVisible({ timeout: 5000 });
  });

  test('full onboarding flow: select genres, artists, complete', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.getByText('어떤 음악을 좋아하세요?')).toBeVisible({ timeout: 10000 });

    await page.getByText('발라드').click();
    await page.getByText('댄스').click();
    await page.getByRole('button', { name: /다음/ }).click();

    await expect(page.getByText('어떤 아티스트를 좋아하세요?')).toBeVisible({ timeout: 5000 });

    const artistCheckboxes = page.locator('button:has(> svg)').first();
    const artists = page.locator('button.flex.min-h-14');
    const count = await artists.count();

    for (let i = 0; i < Math.min(3, count); i++) {
      await artists.nth(i).click();
    }

    const startButton = page.getByRole('button', { name: /시작하기/ });
    await expect(startButton).toBeEnabled();
    await startButton.click();

    await expect(page.getByText('취향에 맞는 음악을 찾고 있어요')).toBeVisible({ timeout: 5000 });

    await page.waitForURL('**/home', { timeout: 30000 });
    expect(page.url()).toContain('/home');

    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/onboarding');
  });

  test('completed user is not redirected to onboarding', async ({ page, request }) => {
    const statusResponse = await request.get('/api/onboarding/status');
    const statusData = await statusResponse.json();

    if (!statusData.needsOnboarding) {
      await page.goto('/home');
      await page.waitForURL('**/home', { timeout: 5000 });
      expect(page.url()).toContain('/home');
      expect(page.url()).not.toContain('/onboarding');
    }
  });
});

test.describe('Onboarding API', () => {
  test('GET /api/onboarding/status returns needsOnboarding', async ({ request }) => {
    const response = await request.get('/api/onboarding/status');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('needsOnboarding');
    expect(typeof data.needsOnboarding).toBe('boolean');
  });

  test('GET /api/onboarding/genres returns genres with artists', async ({ request }) => {
    const response = await request.get('/api/onboarding/genres');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('genres');
    expect(Array.isArray(data.genres)).toBeTruthy();
    expect(data.genres.length).toBeGreaterThan(0);

    const genre = data.genres[0];
    expect(genre).toHaveProperty('id');
    expect(genre).toHaveProperty('name');
    expect(genre).toHaveProperty('artists');
  });

  test('POST /api/onboarding with empty array marks skip', async ({ request }) => {
    const response = await request.post('/api/onboarding', {
      data: { artistNames: [] },
    });
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);

    const statusResponse = await request.get('/api/onboarding/status');
    const statusData = await statusResponse.json();
    expect(statusData.needsOnboarding).toBe(false);
  });
});
