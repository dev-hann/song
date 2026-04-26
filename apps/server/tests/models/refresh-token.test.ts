import { getTestDb, cleanupDb } from '../setup.js';
import {
  createRefreshToken,
  validateRefreshToken,
  rotateRefreshToken,
  revokeAllRefreshTokens,
} from '../../src/models/refresh-token.js';

vi.mock('../../src/lib/db.js', () => ({
  getDb: () => getTestDb(),
}));

const userId = 'usr_refresh-test-001';

function insertUser(id: string, email: string, name: string) {
  getTestDb()
    .prepare('INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)')
    .run(id, email, name);
}

beforeEach(() => {
  cleanupDb();
  insertUser(userId, 'refresh-test@example.com', 'Test User');
});

describe('createRefreshToken', () => {
  it('returns token string', () => {
    const token = createRefreshToken(userId);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('stores hash in DB', () => {
    const token = createRefreshToken(userId);

    const rows = getTestDb()
      .prepare('SELECT * FROM refresh_tokens WHERE user_id = ?')
      .all(userId) as { token_hash: string; user_id: string }[];

    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(token);
    expect(rows[0].user_id).toBe(userId);
  });

  it('creates different tokens each call', () => {
    const t1 = createRefreshToken(userId);
    const t2 = createRefreshToken(userId);
    expect(t1).not.toBe(t2);
  });
});

describe('validateRefreshToken', () => {
  it('returns userId and tokenId for valid token', () => {
    const token = createRefreshToken(userId);
    const result = validateRefreshToken(token);

    expect(result).not.toBeNull();
    expect(result!.userId).toBe(userId);
    expect(result!.tokenId).toMatch(/^rt_/);
  });

  it('returns null for invalid token', () => {
    const result = validateRefreshToken('invalid_token_value');
    expect(result).toBeNull();
  });

  it('returns null for expired token', () => {
    const token = createRefreshToken(userId);

    getTestDb()
      .prepare('UPDATE refresh_tokens SET expires_at = ? WHERE user_id = ?')
      .run('2000-01-01T00:00:00.000Z', userId);

    const result = validateRefreshToken(token);
    expect(result).toBeNull();
  });

  it('deletes expired token on validation', () => {
    const token = createRefreshToken(userId);

    getTestDb()
      .prepare('UPDATE refresh_tokens SET expires_at = ? WHERE user_id = ?')
      .run('2000-01-01T00:00:00.000Z', userId);

    validateRefreshToken(token);

    const rows = getTestDb()
      .prepare('SELECT * FROM refresh_tokens WHERE user_id = ?')
      .all(userId);
    expect(rows).toHaveLength(0);
  });
});

describe('rotateRefreshToken', () => {
  it('deletes old token and creates new one', () => {
    const oldToken = createRefreshToken(userId);
    const oldResult = validateRefreshToken(oldToken);
    expect(oldResult).not.toBeNull();

    const newToken = rotateRefreshToken(oldResult!.tokenId, userId);

    expect(validateRefreshToken(oldToken)).toBeNull();
    expect(validateRefreshToken(newToken)).not.toBeNull();
    expect(validateRefreshToken(newToken)!.userId).toBe(userId);
  });
});

describe('revokeAllRefreshTokens', () => {
  it('deletes all tokens for user', () => {
    createRefreshToken(userId);
    createRefreshToken(userId);
    createRefreshToken(userId);

    revokeAllRefreshTokens(userId);

    const rows = getTestDb()
      .prepare('SELECT * FROM refresh_tokens WHERE user_id = ?')
      .all(userId);
    expect(rows).toHaveLength(0);
  });

  it('does not affect tokens of other users', () => {
    const otherUserId = 'usr_refresh-other-002';
    insertUser(otherUserId, 'other-refresh@example.com', 'Other User');
    createRefreshToken(userId);
    const otherToken = createRefreshToken(otherUserId);

    revokeAllRefreshTokens(userId);

    expect(validateRefreshToken(otherToken)).not.toBeNull();
  });
});
