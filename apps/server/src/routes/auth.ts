import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../lib/env.js';
import { findUserByEmail, findUserById, createUser, updateLastLogin } from '../models/user.js';
import { createRefreshToken, validateRefreshToken, rotateRefreshToken, revokeAllRefreshTokens } from '../models/refresh-token.js';
import { authRateLimiter } from '../middleware/rate-limit.js';

const router = Router();
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const AuthSchema = z.object({
  credential: z.string().min(1),
});

async function verifyGoogleToken(credential: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

function signAccessToken(payload: { id: string; email: string; name: string }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
}

function setRefreshCookie(res: import('express').Response, refreshToken: string) {
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

router.post('/verify', authRateLimiter, async (req, res) => {
  const result = AuthSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  try {
    const payload = await verifyGoogleToken(result.data.credential);

    if (!payload?.email || !payload?.name) {
      res.status(400).json({ error: 'Google 계정 정보를 가져올 수 없습니다.' });
      return;
    }

    let user = findUserByEmail(payload.email);

    if (user && !user.isActive) {
      res.status(403).json({ error: '비활성화된 계정입니다.' });
      return;
    }

    if (!user) {
      user = createUser({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    } else {
      updateLastLogin(user.id);
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, name: user.name });
    const refreshToken = createRefreshToken(user.id);

    setRefreshCookie(res, refreshToken);

    res.json({
      registered: true,
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('[Auth Verify] Error:', error);
    res.status(401).json({ error: 'Google 인증에 실패했습니다.' });
  }
});

router.post('/refresh', authRateLimiter, async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    res.status(401).json({ error: '리프레시 토큰이 없습니다.' });
    return;
  }

  try {
    const validated = validateRefreshToken(refreshToken);
    if (!validated) {
      res.clearCookie('refresh_token', { path: '/api/auth' });
      res.status(401).json({ error: '유효하지 않은 리프레시 토큰입니다.' });
      return;
    }

    const user = findUserById(validated.userId);
    if (!user || !user.isActive) {
      res.clearCookie('refresh_token', { path: '/api/auth' });
      res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, name: user.name });
    const newRefreshToken = rotateRefreshToken(validated.tokenId, user.id);

    setRefreshCookie(res, newRefreshToken);

    res.json({ token: accessToken });
  } catch (error) {
    console.error('[Auth Refresh] Error:', error);
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.status(401).json({ error: '토큰 갱신에 실패했습니다.' });
  }
});

router.post('/logout', (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    const validated = validateRefreshToken(refreshToken);
    if (validated) {
      const user = findUserById(validated.userId);
      if (user) revokeAllRefreshTokens(user.id);
    }
  }
  res.clearCookie('refresh_token', { path: '/api/auth' });
  res.json({ success: true });
});

export default router;
