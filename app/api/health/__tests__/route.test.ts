// @vitest-environment node
import { describe, it, expect } from 'vitest';

import { GET } from '../route';

describe('GET /api/health', () => {
  it('returns ok status with timestamp and uptime', async () => {
    const response = await GET();
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe('ok');
    expect(typeof result.timestamp).toBe('string');
    expect(typeof result.uptime).toBe('number');
  });

  it('returns valid ISO timestamp', async () => {
    const response = await GET();
    const result = await response.json();

    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('returns positive uptime', async () => {
    const response = await GET();
    const result = await response.json();

    expect(result.uptime).toBeGreaterThan(0);
  });
});
