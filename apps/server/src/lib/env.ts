import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  JWT_SECRET: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required'); })(),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  GITHUB_REPO: process.env.GITHUB_REPO || 'dev-hann/song',
  CLIENT_DIST_PATH: path.join(__dirname, '../../../../dist'),
};
