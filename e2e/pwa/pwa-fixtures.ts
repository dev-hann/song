import { test as base, expect } from '@playwright/test';
import { AndroidAdapter, type BaseDeviceAdapter } from './fixtures';

export interface PwaFixtures {
  device: BaseDeviceAdapter;
}

export const test = base.extend<PwaFixtures>({
  device: async ({ }, use) => {
    const adapter = new AndroidAdapter();

    const connected = await adapter.isConnected();
    if (!connected) {
      throw new Error(
        'No Android device connected. Run "adb devices" to verify.\n' +
        'Make sure USB debugging is enabled and device is authorized.',
      );
    }

    await use(adapter);
  },
});

export { expect };
