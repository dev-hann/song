import type { Request, Response, NextFunction } from 'express';
import { reportError } from '../services/error-reporter.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('[Server Error]', err);

  reportError(err, {
    source: 'server',
    route: `${req.method} ${req.path}`,
    method: req.method,
    userAgent: req.headers['user-agent'],
    metadata: {
      query: req.query,
      body: req.body ? Object.keys(req.body) : [],
    },
  }).catch((reportErr) => {
    console.error('[ErrorReporter] Failed to report:', reportErr);
  });

  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
}
