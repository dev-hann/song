import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/device-control**'],
    },
    {
      name: 'android-real',
      testDir: './e2e/pwa/specs/android',
      testMatch: /device-control/,
      timeout: 90000,
      use: {
        storageState: 'e2e/.auth/user.json',
        ...(process.env.ANDROID_CDP_ENDPOINT
          ? { connectOptions: { wsEndpoint: process.env.ANDROID_CDP_ENDPOINT } }
          : {}),
      },
      dependencies: ['setup'],
      workers: 1,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
