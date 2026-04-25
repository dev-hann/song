import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../lib/env.js';
import { findUser, registerUser } from '../lib/users.js';
import { authRateLimiter } from '../middleware/rate-limit.js';

const router = Router();
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const VerifySchema = z.object({
  credential: z.string().min(1),
});

const RegisterSchema = z.object({
  credential: z.string().min(1),
  inviteCode: z.string().min(1),
});

async function verifyGoogleToken(credential: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

function signToken(payload: { email: string; name: string }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/verify', authRateLimiter, async (req, res) => {
  const result = VerifySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  try {
    const payload = await verifyGoogleToken(result.data.credential);

    if (!payload?.email) {
      res
        .status(400)
        .json({ error: 'Google 계정 정보를 가져올 수 없습니다.' });
      return;
    }

    const user = findUser(payload.email);

    if (!user) {
      res.json({ registered: false, email: payload.email });
      return;
    }

    const token = signToken({ email: user.email, name: user.name });

    res.json({
      registered: true,
      token,
      user: {
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

router.post('/register', authRateLimiter, async (req, res) => {
  const result = RegisterSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { credential, inviteCode } = result.data;

  if (inviteCode !== env.INVITE_CODE) {
    res.status(403).json({ error: '유효하지 않은 초대 코드입니다.' });
    return;
  }

  try {
    const payload = await verifyGoogleToken(credential);

    if (!payload?.email || !payload?.name) {
      res
        .status(400)
        .json({ error: 'Google 계정 정보를 가져올 수 없습니다.' });
      return;
    }

    const existingUser = findUser(payload.email);

    if (existingUser) {
      const token = signToken({
        email: existingUser.email,
        name: existingUser.name,
      });

      res.json({
        registered: true,
        token,
        user: {
          email: existingUser.email,
          name: existingUser.name,
          picture: existingUser.picture,
        },
      });
      return;
    }

    const newUser = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      registeredAt: new Date().toISOString(),
    };

    registerUser(newUser);

    const token = signToken({ email: newUser.email, name: newUser.name });

    res.json({
      registered: true,
      token,
      user: {
        email: newUser.email,
        name: newUser.name,
        picture: newUser.picture,
      },
    });
  } catch (error) {
    console.error('[Auth Register] Error:', error);
    res.status(401).json({ error: 'Google 인증에 실패했습니다.' });
  }
});

export default router;
