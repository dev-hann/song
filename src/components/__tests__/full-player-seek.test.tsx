import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useAudioStore } from '@/store';
import { AudioStatus, RepeatMode } from '@/constants';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    seek: vi.fn(),
    setSpeed: vi.fn(),
    load: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    setRepeatMode: vi.fn(),
    setOnPlayNext: vi.fn(),
  },
}));

vi.mock('@/lib/audio-player', () => ({
  audioPlayer: {
    seek: mocks.seek,
    setSpeed: mocks.setSpeed,
    load: mocks.load,
    play: mocks.play,
    pause: mocks.pause,
    onStatus: () => () => {},
    onTime: () => () => {},
    onBuffered: () => () => {},
    onEnded: () => () => {},
    setOnPlayNext: mocks.setOnPlayNext,
    setRepeatMode: mocks.setRepeatMode,
    getAudioElement: () => ({ play: vi.fn(), pause: vi.fn() }),
  },
  AudioPlayer: { getInstance: () => ({}) },
}));

vi.mock('@/queries', () => ({
  useRelatedTracks: () => ({ data: null, isLoading: false }),
  useLyricsQuery: () => ({ data: null, isLoading: false }),
}));

vi.mock('@/hooks/use-like-toggle', () => ({
  useLikeToggle: () => ({ isLiked: false, isPending: false, toggle: vi.fn() }),
}));

vi.mock('@/context/audio-context', () => ({
  useAudioElement: () => ({
    seek: mocks.seek,
    setSpeed: mocks.setSpeed,
    currentTime: 5.0,
    duration: 195,
    buffered: 100,
  }),
}));

const mockAudio = {
  id: 'test-id',
  title: 'Test Song',
  channel: { name: 'Test Artist' },
  thumbnail: 'https://example.com/thumb.jpg',
  duration: 195,
};

describe('FullPlayer seek behavior', () => {
  beforeEach(() => {
    mocks.seek.mockClear();
    useAudioStore.setState({
      audio: mockAudio,
      status: AudioStatus.PLAYING,
      playback: { currentTime: 5.0, duration: 195, speed: 1 },
      queue: [mockAudio],
      currentIndex: 0,
      repeatMode: RepeatMode.OFF,
      shuffle: false,
      autoplay: false,
      showFullPlayer: false,
    });
  });

  it('does NOT call seek when opening (show=true)', async () => {
    const { FullPlayer } = await import('@/components/full-player');
    const onClose = vi.fn();

    const { rerender } = render(<FullPlayer show={false} onClose={onClose} />);
    expect(mocks.seek).not.toHaveBeenCalled();

    rerender(<FullPlayer show={true} onClose={onClose} />);
    expect(mocks.seek).not.toHaveBeenCalled();
  });

  it('does NOT call seek when closing (show=false)', async () => {
    const { FullPlayer } = await import('@/components/full-player');
    const onClose = vi.fn();

    const { rerender } = render(<FullPlayer show={true} onClose={onClose} />);
    mocks.seek.mockClear();

    rerender(<FullPlayer show={false} onClose={onClose} />);
    expect(mocks.seek).not.toHaveBeenCalled();
  });

  it('does NOT call seek on repeated open/close cycles', async () => {
    const { FullPlayer } = await import('@/components/full-player');
    const onClose = vi.fn();

    const { rerender } = render(<FullPlayer show={false} onClose={onClose} />);

    for (let i = 0; i < 5; i++) {
      rerender(<FullPlayer show={true} onClose={onClose} />);
      rerender(<FullPlayer show={false} onClose={onClose} />);
    }

    expect(mocks.seek).not.toHaveBeenCalled();
  });
});
