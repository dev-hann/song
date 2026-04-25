import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  INVITE_CODE: process.env.INVITE_CODE || 'song2026',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  CLIENT_DIST_PATH: path.join(__dirname, '../../../../dist'),
};
