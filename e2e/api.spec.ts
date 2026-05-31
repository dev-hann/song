import { test, expect } from '@playwright/test';

test('health check returns ok', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();

  const data: { status: string } = await response.json();
  expect(data.status).toBe('ok');
});
