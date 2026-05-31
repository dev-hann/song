import { execSync } from 'child_process';
import { BaseDeviceAdapter, type MediaSessionAction } from './base';
import type { Page } from '@playwright/test';

function adb(command: string): string {
  try {
    return execSync(`adb shell ${command}`, { encoding: 'utf-8', timeout: 10000 }).trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('svc') && msg.includes('phone')) {
      throw new Error(
        'Network control requires root. Use "adb root" or run on a rooted device.',
      );
    }
    throw err;
  }
}

function detectBrowserPackage(): string {
  const packages = execSync('adb shell pm list packages', { encoding: 'utf-8' });

  if (packages.includes('com.android.chrome')) {return 'com.android.chrome';}
  if (packages.includes('org.chromium.chrome')) {return 'org.chromium.chrome';}
  if (packages.includes('org.lineageos.jelly')) {return 'org.lineageos.jelly/org.lineageos.jelly.MainActivity';}
  if (packages.includes('org.mozilla.firefox')) {return 'org.mozilla.firefox';}

  return 'com.android.chrome';
}

export class AndroidAdapter extends BaseDeviceAdapter {
  private browserPackage: string;

  constructor() {
    super();
    this.browserPackage = detectBrowserPackage();
  }

  async goToBackground(): Promise<void> {
    adb('input keyevent KEYCODE_HOME');
  }

  async bringToForeground(): Promise<void> {
    if (this.browserPackage.includes('jelly')) {
      adb('am start -n org.lineageos.jelly/.MainActivity');
    } else if (this.browserPackage.includes('chrome')) {
      adb(`am start -a android.intent.action.VIEW -d "http://localhost:3000" ${this.browserPackage}`);
    } else {
      adb(`am start -a android.intent.action.VIEW -d "http://localhost:3000"`);
    }
    await new Promise((r) => { setTimeout(r, 1500); });
  }

  async pressMediaButton(action: MediaSessionAction): Promise<void> {
    switch (action) {
      case 'play':
        adb('input keyevent KEYCODE_MEDIA_PLAY');
        break;
      case 'pause':
        adb('input keyevent KEYCODE_MEDIA_PAUSE');
        break;
      case 'nexttrack':
        adb('input keyevent KEYCODE_MEDIA_NEXT');
        break;
      case 'previoustrack':
        adb('input keyevent KEYCODE_MEDIA_PREVIOUS');
        break;
      case 'stop':
        adb('input keyevent KEYCODE_MEDIA_STOP');
        break;
    }
  }

  async setNetwork(enabled: boolean): Promise<void> {
    if (enabled) {
      adb('svc wifi enable');
    } else {
      adb('svc wifi disable');
    }
    await new Promise((r) => { setTimeout(r, 2000); });
  }

  async isScreenOn(): Promise<boolean> {
    const result = adb('dumpsys power | grep "Display Power"');
    return result.includes('state=ON');
  }

  async wakeScreen(): Promise<void> {
    adb('input keyevent KEYCODE_WAKEUP');
    await new Promise((r) => { setTimeout(r, 500); });
  }

  async isConnected(): Promise<boolean> {
    try {
      const result = execSync('adb devices', { encoding: 'utf-8' });
      const lines = result.split('\n').filter((l: string) => l.includes('\tdevice'));
      return lines.length > 0;
    } catch {
      return false;
    }
  }
}
