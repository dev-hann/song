import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET environment variable is required'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID environment variable is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET environment variable is required'),
  DATABASE_URL: z.string().default('postgres://song:password@localhost:5432/song'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

let _env: z.infer<typeof envSchema> | null = null;

export function getEnv(): z.infer<typeof envSchema> {
  if (_env) {return _env;}

  const parsed = envSchema.safeParse({
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    AUTH_SECRET: process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    console.error('[ENV] Validation failed:');
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  _env = parsed.data;
  return _env;
}

export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop) {
    return getEnv()[prop as keyof z.infer<typeof envSchema>];
  },
});
