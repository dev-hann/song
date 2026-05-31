import { test, expect } from '../../pwa-fixtures';
import {
  backgroundPlaybackScenario,
  mediaSessionPauseScenario,
  mediaSessionPlayScenario,
  mediaSessionNextTrackScenario,
  networkDisconnectScenario,
} from '../../scenarios';

test.describe('Background Playback (Real Device)', () => {
  test('audio continues playing when app goes to background', async ({ page, device }) => {
    const result = await backgroundPlaybackScenario(page, device);

    expect(result.backgroundStillPlaying).toBe(true);
    expect(result.foregroundStateMatches).toBe(true);
  });

  test('UI syncs with actual playback state after foreground return', async ({ page, device }) => {
    const result = await backgroundPlaybackScenario(page, device);
    expect(result.foregroundStateMatches).toBe(true);
  });
});

test.describe('MediaSession Controls (Real Device)', () => {
  test('notification pause reflects in app', async ({ page, device }) => {
    const paused = await mediaSessionPauseScenario(page, device);
    expect(paused).toBe(true);
  });

  test('notification play reflects in app', async ({ page, device }) => {
    const playing = await mediaSessionPlayScenario(page, device);
    expect(playing).toBe(true);
  });

  test('notification next track changes current track', async ({ page, device }) => {
    const changed = await mediaSessionNextTrackScenario(page, device);
    expect(changed).toBe(true);
  });
});

test.describe('Network (Real Device)', () => {
  test('audio continues when network disconnects during playback', async ({ page, device }) => {
    const stillPlaying = await networkDisconnectScenario(page, device);
    expect(stillPlaying).toBe(true);
  });
});
