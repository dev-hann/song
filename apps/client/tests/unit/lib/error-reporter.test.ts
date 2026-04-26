import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportError, initErrorReporter } from '@/lib/error-reporter';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

describe('reportError', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockResolvedValue({ ok: true } as Response);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('extracts message from Error instances', () => {
    reportError(new Error('test error'));
    expect(apiFetch).toHaveBeenCalledWith('/api/errors', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"message":"test error"'),
    }));
  });

  it('converts non-Error to string message', () => {
    reportError('string error');
    expect(apiFetch).toHaveBeenCalledWith('/api/errors', expect.objectContaining({
      body: expect.stringContaining('"message":"string error"'),
    }));
  });

  it('calls apiFetch to POST to /api/errors', () => {
    reportError(new Error('msg'), { route: '/test', metadata: { key: 'val' } });
    expect(apiFetch).toHaveBeenCalledWith('/api/errors', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));
  });
});

describe('initErrorReporter', () => {
  it('returns a cleanup function', () => {
    const cleanup = initErrorReporter();
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('handles error events on window', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const cleanup = initErrorReporter();

    expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function));
    cleanup();
  });

  it('handles unhandledrejection events on window', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const cleanup = initErrorReporter();

    expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    cleanup();
  });

  it('cleanup removes event listeners', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const cleanup = initErrorReporter();

    cleanup();

    expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
  });
});
