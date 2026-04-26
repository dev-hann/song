import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import { corsMiddleware } from './middleware/cors.js';
import { rateLimiter } from './middleware/rate-limit.js';
import { loggerMiddleware } from './middleware/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { env } from './lib/env.js';
import { getDb } from './lib/db.js';
import healthRouter from './routes/health.js';
import youtubeRouter from './routes/youtube.js';
import playlistsRouter from './routes/playlists.js';
import likesRouter from './routes/likes.js';
import historyRouter from './routes/history.js';
import channelsRouter from './routes/channels.js';
import homeRouter from './routes/home.js';
import melonRouter from './routes/melon.js';
import recommendationsRouter from './routes/recommendations.js';
import errorsRouter from './routes/errors.js';
import authRouter from './routes/auth.js';

getDb();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(loggerMiddleware);
app.use(rateLimiter);

app.use('/api/auth', authRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/likes', likesRouter);
app.use('/api/history', historyRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/home', homeRouter);
app.use('/api/melon', melonRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/errors', errorsRouter);
app.use('/health', healthRouter);

const clientPath = env.CLIENT_DIST_PATH;

app.use('/sw.js', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

app.use('/registerSW.js', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

app.use(express.static(clientPath));

app.get('*', (_req, res, next) => {
  if (_req.path.startsWith('/api/') || _req.path.startsWith('/health')) {
    return next();
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.use(errorHandler);

app.listen(env.PORT, env.HOST, () => {
  console.log(`Server running on http://${env.HOST}:${env.PORT}`);
});
