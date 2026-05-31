import type { Page } from '@playwright/test';

export interface DeviceAdapter {
  goToBackground(): Promise<void>;
  bringToForeground(): Promise<void>;
  pressMediaButton(action: MediaSessionAction): Promise<void>;
  setNetwork(enabled: boolean): Promise<void>;
  getMediaSessionPlaybackState(page: Page): Promise<MediaSessionPlaybackState>;
  getAudioPlaybackState(page: Page): Promise<'playing' | 'paused' | 'idle' | 'loading' | 'error'>;
}

export type MediaSessionAction = 'play' | 'pause' | 'previoustrack' | 'nexttrack' | 'stop' | 'seekto';
export type MediaSessionPlaybackState = 'playing' | 'paused' | 'none';

export abstract class BaseDeviceAdapter implements DeviceAdapter {
  abstract goToBackground(): Promise<void>;
  abstract bringToForeground(): Promise<void>;
  abstract pressMediaButton(action: MediaSessionAction): Promise<void>;
  abstract setNetwork(enabled: boolean): Promise<void>;

  async getMediaSessionPlaybackState(page: Page): Promise<MediaSessionPlaybackState> {
    return page.evaluate(() => {
      if (!('mediaSession' in navigator)) {return 'none' as const;}
      return (navigator.mediaSession.playbackState ?? 'none') as 'playing' | 'paused' | 'none';
    });
  }

  async getAudioPlaybackState(page: Page): Promise<'playing' | 'paused' | 'idle' | 'loading' | 'error'> {
    return page.evaluate(() => {
      const store = (window as unknown as { __AUDIO_STORE__?: { getState: () => { status: string } } }).__AUDIO_STORE__;
      if (store) {
        return store.getState().status as 'playing' | 'paused' | 'idle' | 'loading' | 'error';
      }
      return 'idle' as const;
    });
  }

  protected async dispatchMediaSessionAction(page: Page, action: MediaSessionAction): Promise<void> {
    await page.evaluate((act) => {
      const ms = navigator.mediaSession as MediaSession & {
        actionHandlers?: Record<string, ((details: MediaSessionActionDetails) => void) | null>;
      };
      const handler = ms?.actionHandlers?.[act];
      if (handler) {
        handler({ action: act, seekTime: undefined } as MediaSessionActionDetails);
      }
    }, action);
  }
}
