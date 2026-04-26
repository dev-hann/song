import { mock, afterEach } from 'node:test';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock('../../src/lib/env.js', () => ({
  env: { JWT_SECRET: 'test-secret' },
}));

import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../src/middleware/auth.js';

function createMockReq(overrides = {}) {
  return {
    headers: {},
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
  };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockImplementation((data) => {
    res.body = data;
    return res;
  });
  return res;
}

describe('authMiddleware', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no Authorization header', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: '인증이 필요합니다.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with "Bearer "', () => {
    const req = createMockReq({ headers: { authorization: 'Token abc123' } });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: '인증이 필요합니다.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid/expired', () => {
    (jwt.verify as any).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req = createMockReq({ headers: { authorization: 'Bearer bad-token' } });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('bad-token', 'test-secret');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: '유효하지 않은 토큰입니다.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.user when token is valid', () => {
    const payload = { id: 'user1', email: 'test@test.com', name: 'Test' };
    (jwt.verify as any).mockReturnValue(payload);

    const req = createMockReq({ headers: { authorization: 'Bearer valid-token' } });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalled();
  });

  it('uses env.JWT_SECRET for verification', () => {
    (jwt.verify as any).mockReturnValue({ id: '1', email: 'a@b.c', name: 'n' });

    const req = createMockReq({ headers: { authorization: 'Bearer tok' } });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('tok', 'test-secret');
  });
});
