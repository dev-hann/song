import { AudioStatus, RepeatMode } from '@/constants';
import type { Audio } from '@/types';

type StatusListener = (status: AudioStatus) => void;
type TimeListener = (time: { currentTime: number; duration: number }) => void;
type BufferedListener = (buffered: number) => void;
type EndedListener = () => void;

const SILENT_SRC = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

async function fetchStreamUrl(audioId: string): Promise<string> {
  const res = await fetch(`/api/youtube/audio/stream?id=${encodeURIComponent(audioId)}`);
  if (!res.ok) throw new Error(`Stream URL fetch failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

export class AudioPlayer {
  private static instance: AudioPlayer | null = null;

  private el: HTMLAudioElement;
  private statusListeners = new Set<StatusListener>();
  private timeListeners = new Set<TimeListener>();
  private bufferedListeners = new Set<BufferedListener>();
  private endedListeners = new Set<EndedListener>();

  private _currentTime = 0;
  private _duration = 0;
  private _buffered = 0;
  private _status: AudioStatus = AudioStatus.IDLE;
  private currentAudioId: string | null = null;
  private currentAudio: Audio | null = null;
  private repeatMode: RepeatMode = RepeatMode.OFF;
  private errorCount = 0;
  private lastPosUpdate = 0;
  private onPlayNext: (() => void) | null = null;
  private streamUrlCache = new Map<string, { url: string; expires: number }>();
  private unlocked = false;

  static getInstance(): AudioPlayer {
    if (!AudioPlayer.instance) {
      AudioPlayer.instance = new AudioPlayer();
    }
    return AudioPlayer.instance;
  }

  private constructor() {
    this.el = document.createElement('audio');
    this.el.setAttribute('preload', 'metadata');
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
    this.bindEvents();
    this.setupMediaSessionHandlers();
    this.bindUnlock();
  }

  get currentTime() { return this._currentTime; }
  get duration() { return this._duration; }
  get buffered() { return this._buffered; }
  get audio() { return this.currentAudio; }
  get status() { return this._status; }

  setRepeatMode(mode: RepeatMode) { this.repeatMode = mode; }

  setOnPlayNext(fn: (() => void) | null) { this.onPlayNext = fn; }

  onStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  onTime(fn: TimeListener): () => void {
    this.timeListeners.add(fn);
    return () => this.timeListeners.delete(fn);
  }

  onBuffered(fn: BufferedListener): () => void {
    this.bufferedListeners.add(fn);
    return () => this.bufferedListeners.delete(fn);
  }

  onEnded(fn: EndedListener): () => void {
    this.endedListeners.add(fn);
    return () => this.endedListeners.delete(fn);
  }

  async load(audioId: string, audio: Audio) {
    this.currentAudio = audio;
    this.currentAudioId = audioId;
    this.errorCount = 0;
    this.emitStatus(AudioStatus.LOADING);
    this.applyMediaSessionMetadata(audio);

    try {
      const url = await this.getStreamUrl(audioId);
      this.el.src = url;
    } catch {
      this.el.src = `/api/youtube/audio/play/${audioId}`;
    }
    this.el.load();
  }

  play() {
    this.el.play()?.catch((err) => this.handlePlayError(err));
  }

  pause() {
    this.el.pause();
  }

  seek(time: number) {
    if (this.el.fastSeek) {
      this.el.fastSeek(time);
    } else {
      this.el.currentTime = time;
    }
    this._currentTime = time;
    this.emitTime({ currentTime: time, duration: this._duration });
    this.updateMediaSessionPosition();
  }

  setSpeed(speed: number) {
    this.el.playbackRate = speed;
  }

  getAudioElement(): HTMLAudioElement {
    return this.el;
  }

  tryResumeOnVisible() {
    if (document.visibilityState === 'visible' && this.el.paused && this._status === AudioStatus.PLAYING && this.currentAudioId) {
      this.el.play()?.catch(() => {});
    }
  }

  private bindUnlock() {
    const unlock = () => {
      if (this.unlocked) return;
      this.el.src = SILENT_SRC;
      this.el.play().then(() => {
        this.unlocked = true;
        this.el.pause();
        this.el.removeAttribute('src');
        this.el.load();
      }).catch(() => {});
    };

    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchend', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }

  private async getStreamUrl(audioId: string): Promise<string> {
    const cached = this.streamUrlCache.get(audioId);
    if (cached && cached.expires > Date.now()) return cached.url;

    const url = await fetchStreamUrl(audioId);
    this.streamUrlCache.set(audioId, { url, expires: Date.now() + 3 * 60 * 60 * 1000 });
    return url;
  }

  private handlePlayError(err: unknown) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      console.warn('[AudioPlayer] Autoplay blocked');
      this.emitStatus(AudioStatus.PAUSED);
      return;
    }
    console.warn('[AudioPlayer] Play error:', err);
  }

  private emitStatus(status: AudioStatus) {
    if (this._status === status) return;
    this._status = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  private emitTime(payload: { currentTime: number; duration: number }) {
    this.timeListeners.forEach((fn) => fn(payload));
  }

  private applyMediaSessionMetadata(audio: Audio) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: audio.title,
      artist: audio.channel?.name || '',
      artwork: [
        { src: audio.thumbnail, sizes: '96x96', type: 'image/jpeg' },
        { src: audio.thumbnail, sizes: '128x128', type: 'image/jpeg' },
        { src: audio.thumbnail, sizes: '192x192', type: 'image/jpeg' },
        { src: audio.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: audio.thumbnail, sizes: '384x384', type: 'image/jpeg' },
        { src: audio.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ],
    });
  }

  private updateMediaSessionPosition() {
    if (!('mediaSession' in navigator)) return;
    if (!this.el.duration || !isFinite(this.el.duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: this.el.duration,
        playbackRate: this.el.playbackRate,
        position: this.el.currentTime,
      });
    } catch {}
  }

  private bindEvents() {
    const el = this.el;

    el.addEventListener('timeupdate', () => {
      this._currentTime = el.currentTime;
      this.emitTime({ currentTime: el.currentTime, duration: this._duration });

      if (Date.now() - this.lastPosUpdate > 1000) {
        this.lastPosUpdate = Date.now();
        this.updateMediaSessionPosition();
      }
    });

    el.addEventListener('loadedmetadata', () => {
      this._duration = el.duration;
      this.emitTime({ currentTime: this._currentTime, duration: el.duration });
    });

    el.addEventListener('canplay', () => {
      if (this._status === AudioStatus.LOADING) {
        this.el.play()?.catch((err) => this.handlePlayError(err));
      }
    });

    el.addEventListener('progress', () => {
      if (el.buffered.length > 0) {
        this._buffered = el.buffered.end(el.buffered.length - 1);
        this.bufferedListeners.forEach((fn) => fn(this._buffered));
      }
    });

    el.addEventListener('playing', () => {
      this.errorCount = 0;
      if (this.currentAudio) {
        this.applyMediaSessionMetadata(this.currentAudio);
      }
      this.emitStatus(AudioStatus.PLAYING);
    });

    el.addEventListener('pause', () => {
      if (this._status === AudioStatus.PLAYING) {
        this.emitStatus(AudioStatus.PAUSED);
      }
    });

    el.addEventListener('ended', () => {
      if (this.repeatMode === RepeatMode.ONE) {
        el.currentTime = 0;
        el.play()?.catch(() => {});
      } else {
        this.emitStatus(AudioStatus.IDLE);
        this.endedListeners.forEach((fn) => fn());
        this.onPlayNext?.();
      }
    });

    el.addEventListener('error', () => {
      if (this.currentAudioId && this.errorCount < 2) {
        console.warn('[AudioPlayer] Playback error, retrying...');
        this.errorCount++;
        this.el.load();
      } else {
        console.error('[AudioPlayer] Playback error');
        this.emitStatus(AudioStatus.ERROR);
      }
    });
  }

  private setupMediaSessionHandlers() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => this.play());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('stop', () => {
      this.pause();
      navigator.mediaSession.metadata = null;
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => this.onPlayNext?.());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.onPlayNext?.());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime == null) return;
      this.seek(details.seekTime);
    });
  }
}

export const audioPlayer = AudioPlayer.getInstance();
