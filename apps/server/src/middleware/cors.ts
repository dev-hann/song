import cors from 'cors';
import type { CorsOptions } from 'cors';

const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
