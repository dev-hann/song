import { Router } from 'express';
import { reportError } from '../services/error-reporter.js';

const router = Router();

router.post('/', async (req, res) => {
  const { message, stack, route, metadata } = req.body;

  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

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
