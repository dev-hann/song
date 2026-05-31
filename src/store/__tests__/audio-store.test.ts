import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useAudioStore } from '../audio-store';
import { AudioStatus, RepeatMode } from '@/constants';

const { mocks } = vi.hoisted(() => {
  const mocks = {
    load: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    seek: vi.fn(),
    setRepeatMode: vi.fn(),
    setOnPlayNext: vi.fn(),
    onStatus: vi.fn(() => () => undefined),
    onTime: vi.fn(() => () => undefined),
    fetchAudioInfo: vi.fn(),
    fetchRelatedTracks: vi.fn(),
    addLike: vi.fn(),
    removeLike: vi.fn(),
    searchResultToAudio: vi.fn((r: { id: string }) => ({ ...mockAudio, id: r.id })),
  };
  return { mocks };
});

vi.mock('@/lib/audio-player', () => ({
  audioPlayer: {
    load: mocks.load,
    play: mocks.play,
    pause: mocks.pause,
    seek: mocks.seek,
    setRepeatMode: mocks.setRepeatMode,
    setOnPlayNext: mocks.setOnPlayNext,
    onStatus: mocks.onStatus,
    onTime: mocks.onTime,
  },
}));

vi.mock('@/services/api', () => ({
  fetchAudioInfo: mocks.fetchAudioInfo,
  fetchRelatedTracks: mocks.fetchRelatedTracks,
  addLike: mocks.addLike,
  removeLike: mocks.removeLike,
}));

vi.mock('@/lib/track-adapters', () => ({
  searchResultToAudio: mocks.searchResultToAudio,
}));

const mockAudio = {
  id: 'v1',
  type: 'video' as const,
  title: 'Test Song',
  description: 'desc',
  duration: 200,
  viewCount: 100,
  thumbnail: 'https://img.test/thumb.jpg',
  channel: { name: 'Artist' },
};

const track = (id: string) => ({ ...mockAudio, id });

beforeEach(() => {
  vi.clearAllMocks();
  useAudioStore.setState({
    audio: null,
    playback: { currentTime: 0, duration: 0, speed: 1 },
    status: AudioStatus.IDLE,
    showFullPlayer: false,
    repeatMode: RepeatMode.OFF,
    shuffle: false,
    liked: false,
    queue: [],
    recommendedQueue: [],
    currentIndex: -1,
    autoplay: true,
  });
});

describe('initial state', () => {
  it('has correct defaults', () => {
    const state = useAudioStore.getState();
    expect(state.audio).toBeNull();
    expect(state.status).toBe(AudioStatus.IDLE);
    expect(state.queue).toEqual([]);
    expect(state.currentIndex).toBe(-1);
    expect(state.repeatMode).toBe(RepeatMode.OFF);
    expect(state.shuffle).toBe(false);
    expect(state.autoplay).toBe(true);
    expect(state.liked).toBe(false);
  });
});

describe('setAudio', () => {
  it('sets audio and status to loading, calls audioPlayer.load', () => {
    useAudioStore.getState().setAudio(mockAudio);

    expect(useAudioStore.getState().audio).toEqual(mockAudio);
    expect(useAudioStore.getState().status).toBe(AudioStatus.LOADING);
    expect(mocks.load).toHaveBeenCalledWith('v1', mockAudio);
  });
});

describe('clearAudio', () => {
  it('resets audio, status, and playback', () => {
    useAudioStore.getState().setAudio(mockAudio);
    useAudioStore.getState().clearAudio();

    const state = useAudioStore.getState();
    expect(state.audio).toBeNull();
    expect(state.status).toBe(AudioStatus.IDLE);
    expect(state.playback).toEqual({ currentTime: 0, duration: 0, speed: 1 });
  });
});

describe('togglePlay', () => {
  it('pauses when playing', () => {
    useAudioStore.setState({ status: AudioStatus.PLAYING });
    useAudioStore.getState().togglePlay();
    expect(mocks.pause).toHaveBeenCalled();
  });

  it('plays when paused', () => {
    useAudioStore.setState({ status: AudioStatus.PAUSED });
    useAudioStore.getState().togglePlay();
    expect(mocks.play).toHaveBeenCalled();
  });
});

describe('playback updates', () => {
  it('updatePlaybackTime', () => {
    useAudioStore.getState().updatePlaybackTime(30);
    expect(useAudioStore.getState().playback.currentTime).toBe(30);
  });

  it('updatePlaybackDuration', () => {
    useAudioStore.getState().updatePlaybackDuration(200);
    expect(useAudioStore.getState().playback.duration).toBe(200);
  });

  it('updatePlaybackSpeed', () => {
    useAudioStore.getState().updatePlaybackSpeed(1.5);
    expect(useAudioStore.getState().playback.speed).toBe(1.5);
  });
});

describe('toggleRepeatMode', () => {
  it('cycles OFF → ALL → ONE → OFF', () => {
    expect(useAudioStore.getState().repeatMode).toBe(RepeatMode.OFF);
    useAudioStore.getState().toggleRepeatMode();
    expect(useAudioStore.getState().repeatMode).toBe(RepeatMode.ALL);
    useAudioStore.getState().toggleRepeatMode();
    expect(useAudioStore.getState().repeatMode).toBe(RepeatMode.ONE);
    useAudioStore.getState().toggleRepeatMode();
    expect(useAudioStore.getState().repeatMode).toBe(RepeatMode.OFF);
  });
});

describe('toggleShuffle', () => {
  it('toggles', () => {
    useAudioStore.getState().toggleShuffle();
    expect(useAudioStore.getState().shuffle).toBe(true);
  });
});

describe('toggleAutoplay', () => {
  it('toggles', () => {
    useAudioStore.getState().toggleAutoplay();
    expect(useAudioStore.getState().autoplay).toBe(false);
  });
});

describe('setQueue', () => {
  it('sets queue, index, audio, loads track', () => {
    const tracks = [track('v1'), track('v2'), track('v3')];
    useAudioStore.getState().setQueue(tracks, 1);

    expect(useAudioStore.getState().queue).toEqual(tracks);
    expect(useAudioStore.getState().currentIndex).toBe(1);
    expect(useAudioStore.getState().audio!.id).toBe('v2');
    expect(mocks.load).toHaveBeenCalledWith('v2', tracks[1]);
  });

  it('defaults to index 0', () => {
    useAudioStore.getState().setQueue([track('v1'), track('v2')]);
    expect(useAudioStore.getState().currentIndex).toBe(0);
  });

  it('clamps startIndex', () => {
    useAudioStore.getState().setQueue([track('v1'), track('v2')], 99);
    expect(useAudioStore.getState().currentIndex).toBe(1);
  });

  it('ignores empty array', () => {
    useAudioStore.getState().setQueue([]);
    expect(useAudioStore.getState().audio).toBeNull();
  });
});

describe('addToQueue / addNext', () => {
  it('addToQueue appends', () => {
    useAudioStore.setState({ queue: [track('v1')] });
    useAudioStore.getState().addToQueue(track('v2'));
    expect(useAudioStore.getState().queue).toHaveLength(2);
  });

  it('addNext inserts after current', () => {
    useAudioStore.setState({ queue: [track('v1'), track('v3')], currentIndex: 0 });
    useAudioStore.getState().addNext(track('v2'));
    expect(useAudioStore.getState().queue[1].id).toBe('v2');
  });
});

describe('removeFromQueue', () => {
  it('adjusts index when item before current is removed', () => {
    const tracks = [track('v1'), track('v2'), track('v3')];
    useAudioStore.setState({ queue: tracks, currentIndex: 2 });
    useAudioStore.getState().removeFromQueue(0);
    expect(useAudioStore.getState().currentIndex).toBe(1);
  });

  it('replaces current when removed', () => {
    const tracks = [track('v1'), track('v2'), track('v3')];
    useAudioStore.setState({ queue: tracks, currentIndex: 1, audio: tracks[1] });
    useAudioStore.getState().removeFromQueue(1);
    expect(useAudioStore.getState().audio!.id).toBe('v3');
  });

  it('clears when last track removed', () => {
    useAudioStore.setState({ queue: [track('v1')], currentIndex: 0, audio: track('v1') });
    useAudioStore.getState().removeFromQueue(0);
    expect(useAudioStore.getState().audio).toBeNull();
    expect(useAudioStore.getState().status).toBe(AudioStatus.IDLE);
  });
});

describe('clearQueue', () => {
  it('resets everything', () => {
    useAudioStore.getState().setQueue([track('v1')]);
    useAudioStore.getState().clearQueue();
    expect(useAudioStore.getState().queue).toEqual([]);
    expect(useAudioStore.getState().audio).toBeNull();
  });
});

describe('playNext', () => {
  it('advances to next track', () => {
    const tracks = [track('v1'), track('v2')];
    useAudioStore.setState({ queue: tracks, currentIndex: 0, audio: tracks[0] });
    useAudioStore.getState().playNext();
    expect(useAudioStore.getState().currentIndex).toBe(1);
  });

  it('wraps with RepeatMode.ALL', () => {
    const tracks = [track('v1'), track('v2')];
    useAudioStore.setState({ queue: tracks, currentIndex: 1, audio: tracks[1], repeatMode: RepeatMode.ALL });
    useAudioStore.getState().playNext();
    expect(useAudioStore.getState().currentIndex).toBe(0);
  });

  it('stays at end without repeat', () => {
    const tracks = [track('v1'), track('v2')];
    useAudioStore.setState({ queue: tracks, currentIndex: 1, audio: tracks[1], autoplay: false });
    useAudioStore.getState().playNext();
    expect(useAudioStore.getState().currentIndex).toBe(1);
  });

  it('does nothing with empty queue', () => {
    useAudioStore.getState().playNext();
    expect(useAudioStore.getState().audio).toBeNull();
  });
});

describe('playPrevious', () => {
  it('seeks to 0 when currentTime > 3s', () => {
    useAudioStore.setState({ playback: { currentTime: 10, duration: 200, speed: 1 } });
    useAudioStore.getState().playPrevious();
    expect(mocks.seek).toHaveBeenCalledWith(0);
  });

  it('goes to previous track', () => {
    const tracks = [track('v1'), track('v2')];
    useAudioStore.setState({ queue: tracks, currentIndex: 1, audio: tracks[1], playback: { currentTime: 0, duration: 200, speed: 1 } });
    useAudioStore.getState().playPrevious();
    expect(useAudioStore.getState().currentIndex).toBe(0);
  });

  it('wraps with RepeatMode.ALL', () => {
    const tracks = [track('v1'), track('v2')];
    useAudioStore.setState({ queue: tracks, currentIndex: 0, audio: tracks[0], playback: { currentTime: 0, duration: 200, speed: 1 }, repeatMode: RepeatMode.ALL });
    useAudioStore.getState().playPrevious();
    expect(useAudioStore.getState().currentIndex).toBe(1);
  });
});

describe('setAudioById', () => {
  it('fetches and loads audio', async () => {
    mocks.fetchAudioInfo.mockResolvedValueOnce({
      id: 'v1', type: 'video', title: 'Full', description: 'd',
      duration: 200, viewCount: 0, thumbnail: 't', channel: { name: 'A' },
    });

    await useAudioStore.getState().setAudioById('v1');
    expect(useAudioStore.getState().audio!.id).toBe('v1');
    expect(useAudioStore.getState().status).toBe(AudioStatus.LOADING);
  });

  it('sets error on failure', async () => {
    mocks.fetchAudioInfo.mockRejectedValueOnce(new Error('fail'));
    await useAudioStore.getState().setAudioById('bad');
    expect(useAudioStore.getState().status).toBe(AudioStatus.ERROR);
  });
});

describe('recommendedQueue', () => {
  it('initializes empty', () => {
    expect(useAudioStore.getState().recommendedQueue).toEqual([]);
  });

  it('setQueue clears recommendedQueue', () => {
    useAudioStore.setState({ recommendedQueue: [track('r1')] });
    useAudioStore.getState().setQueue([track('v1'), track('v2')]);
    expect(useAudioStore.getState().recommendedQueue).toEqual([]);
  });

  it('autoplay appends to recommendedQueue instead of replacing queue', async () => {
    const tracks = [track('v1')];
    useAudioStore.setState({
      queue: tracks,
      currentIndex: 0,
      audio: tracks[0],
      autoplay: true,
      repeatMode: RepeatMode.OFF,
      recommendedQueue: [],
    });

    const relatedResult = {
      results: [
        { id: 'rel1', type: 'video', title: 'Related 1', channel: { name: 'Artist' }, duration: 100 },
        { id: 'rel2', type: 'video', title: 'Related 2', channel: { name: 'Artist' }, duration: 100 },
      ],
    };
    mocks.fetchRelatedTracks.mockResolvedValueOnce(relatedResult);

    useAudioStore.getState().playNext();

    await vi.waitFor(() => {
      expect(mocks.fetchRelatedTracks).toHaveBeenCalledWith('v1');
    });

    await vi.waitFor(() => {
      const state = useAudioStore.getState();
      expect(state.queue).toEqual(tracks);
      expect(state.recommendedQueue.length).toBeGreaterThan(0);
      expect(state.audio!.id).toBe('rel1');
    });
  });

  it('does not autoplay when autoplay is off', () => {
    const tracks = [track('v1')];
    useAudioStore.setState({
      queue: tracks,
      currentIndex: 0,
      audio: tracks[0],
      autoplay: false,
      repeatMode: RepeatMode.OFF,
      recommendedQueue: [],
    });

    useAudioStore.getState().playNext();
    expect(mocks.fetchRelatedTracks).not.toHaveBeenCalled();
    expect(useAudioStore.getState().queue).toEqual(tracks);
  });

  it('plays through recommendedQueue after user queue ends', async () => {
    const recommended = [track('r1'), track('r2')];
    useAudioStore.setState({
      queue: [track('v1')],
      currentIndex: 0,
      audio: track('v1'),
      recommendedQueue: recommended,
      autoplay: true,
      repeatMode: RepeatMode.OFF,
    });

    useAudioStore.getState().playNext();

    const state = useAudioStore.getState();
    expect(state.audio!.id).toBe('r1');
    expect(state.recommendedQueue).toEqual([track('r2')]);
  });

  it('removeFromRecommendedQueue removes from recommended', () => {
    const recommended = [track('r1'), track('r2')];
    useAudioStore.setState({ recommendedQueue: recommended });

    useAudioStore.getState().removeFromRecommendedQueue(0);
    expect(useAudioStore.getState().recommendedQueue).toEqual([track('r2')]);
  });

  it('clearRecommendedQueue empties recommended queue', () => {
    useAudioStore.setState({ recommendedQueue: [track('r1'), track('r2')] });
    useAudioStore.getState().clearRecommendedQueue();
    expect(useAudioStore.getState().recommendedQueue).toEqual([]);
  });

  it('addToRecommendedQueue appends to recommended', () => {
    useAudioStore.setState({ recommendedQueue: [track('r1')] });
    useAudioStore.getState().addToRecommendedQueue(track('r2'));
    expect(useAudioStore.getState().recommendedQueue).toEqual([track('r1'), track('r2')]);
  });

  it('fetches more recommendations when recommendedQueue is exhausted', async () => {
    useAudioStore.setState({
      queue: [track('v1')],
      currentIndex: 0,
      audio: track('v1'),
      recommendedQueue: [track('r1')],
      autoplay: true,
      repeatMode: RepeatMode.OFF,
    });

    const relatedResult = {
      results: [
        { id: 'new1', type: 'video', title: 'New 1', channel: { name: 'Artist' }, duration: 100 },
      ],
    };
    mocks.fetchRelatedTracks.mockResolvedValueOnce(relatedResult);

    useAudioStore.getState().playNext();
    expect(useAudioStore.getState().audio!.id).toBe('r1');

    mocks.fetchRelatedTracks.mockResolvedValueOnce(relatedResult);
    useAudioStore.getState().playNext();

    await vi.waitFor(() => {
      expect(mocks.fetchRelatedTracks).toHaveBeenCalled();
    });
  });
});
