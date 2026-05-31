import { BaseDeviceAdapter, type MediaSessionAction } from './base';
import type { Page } from '@playwright/test';

export class IOSAdapter extends BaseDeviceAdapter {
  async goToBackground(): Promise<void> {
    throw new Error('iOS testing requires macOS with Xcode installed');
  }

  async bringToForeground(): Promise<void> {
    throw new Error('iOS testing requires macOS with Xcode installed');
  }

  async pressMediaButton(_action: MediaSessionAction): Promise<void> {
    throw new Error('iOS testing requires macOS with Xcode installed');
  }

  async setNetwork(_enabled: boolean): Promise<void> {
    throw new Error('iOS testing requires macOS with Xcode installed');
  }
}
