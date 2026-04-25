import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('[Server Error]', err);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
}
