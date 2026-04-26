import cors from 'cors';
import type { CorsOptions } from 'cors';
import { env } from '../lib/env.js';

const corsOptions: CorsOptions = {
  origin: env.CORS_ORIGINS,
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
