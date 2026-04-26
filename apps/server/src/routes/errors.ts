import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { reportError } from '../services/error-reporter.js';

const router = Router();
router.use(authMiddleware);

const ErrorReportSchema = z.object({
  message: z.string().min(1).max(500),
  stack: z.string().max(3000).optional(),
  route: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

router.post('/', async (req, res) => {
  const result = ErrorReportSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { message, stack, route, metadata } = result.data;

  try {
    await reportError(
      { message, stack },
      {
        source: 'client',
        route,
        method: 'CLIENT',
        userAgent: req.headers['user-agent'],
        metadata,
      },
    );
    res.json({ success: true });
  } catch (error) {
    console.error('[Errors] Report Error:', error);
    res.status(500).json({ error: 'Failed to report error' });
  }
});

export default router;
