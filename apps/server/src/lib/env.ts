import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET environment variable is required'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID environment variable is required'),
  GITHUB_TOKEN: z.string().default(''),
  GITHUB_REPO: z.string().default('dev-hann/song'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
});

const parsed = envSchema.safeParse({
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO: process.env.GITHUB_REPO,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
});

if (!parsed.success) {
  console.error('[ENV] Validation failed:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CLIENT_DIST_PATH: path.join(__dirname, '../../../../dist'),
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(','),
};
