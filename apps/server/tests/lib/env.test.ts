import 'dotenv/config';
import { z } from 'zod';
import { env } from '../../src/lib/env.js';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET environment variable is required'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID environment variable is required'),
  GITHUB_TOKEN: z.string().default(''),
  GITHUB_REPO: z.string().default('dev-hann/song'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
});

describe('env', () => {
  describe('exported config', () => {
    it('has PORT as a number', () => {
      expect(env.PORT).toBeTypeOf('number');
    });

    it('has required JWT_SECRET as a non-empty string', () => {
      expect(env.JWT_SECRET).toBeTypeOf('string');
      expect(env.JWT_SECRET.length).toBeGreaterThan(0);
    });

    it('has required GOOGLE_CLIENT_ID as a non-empty string', () => {
      expect(env.GOOGLE_CLIENT_ID).toBeTypeOf('string');
      expect(env.GOOGLE_CLIENT_ID.length).toBeGreaterThan(0);
    });

    it('splits CORS_ORIGINS into an array', () => {
      expect(Array.isArray(env.CORS_ORIGINS)).toBe(true);
      expect(env.CORS_ORIGINS.length).toBeGreaterThan(0);
    });

    it('has GITHUB_TOKEN as a string', () => {
      expect(env.GITHUB_TOKEN).toBeTypeOf('string');
    });

    it('has GITHUB_REPO as a non-empty string', () => {
      expect(env.GITHUB_REPO).toBeTypeOf('string');
      expect(env.GITHUB_REPO.length).toBeGreaterThan(0);
    });

    it('has CLIENT_DIST_PATH containing dist', () => {
      expect(env.CLIENT_DIST_PATH).toBeTypeOf('string');
      expect(env.CLIENT_DIST_PATH).toContain('dist');
    });
  });

  describe('envSchema validation', () => {
    it('accepts valid env vars', () => {
      const result = envSchema.safeParse({
        PORT: '4000',
        JWT_SECRET: 'my-secret',
        GOOGLE_CLIENT_ID: 'client-id',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(4000);
        expect(result.data.JWT_SECRET).toBe('my-secret');
      }
    });

    it('applies defaults for optional vars', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'secret',
        GOOGLE_CLIENT_ID: 'id',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(4000);
        expect(result.data.HOST).toBe('0.0.0.0');
        expect(result.data.GITHUB_TOKEN).toBe('');
        expect(result.data.GITHUB_REPO).toBe('dev-hann/song');
        expect(result.data.CORS_ORIGINS).toBe('http://localhost:5173,http://localhost:3000');
      }
    });

    it('coerces PORT string to number', () => {
      const result = envSchema.safeParse({
        PORT: '3000',
        JWT_SECRET: 'secret',
        GOOGLE_CLIENT_ID: 'id',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(3000);
      }
    });

    it('rejects missing JWT_SECRET', () => {
      const result = envSchema.safeParse({
        GOOGLE_CLIENT_ID: 'valid-id',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty JWT_SECRET', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: '',
        GOOGLE_CLIENT_ID: 'valid-id',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing GOOGLE_CLIENT_ID', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'valid-secret',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty GOOGLE_CLIENT_ID', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'valid-secret',
        GOOGLE_CLIENT_ID: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('process.exit on invalid env', () => {
    afterEach(async () => {
      vi.restoreAllMocks();
      vi.resetModules();
      await import('../../src/lib/env.js');
    });

    it('calls process.exit(1) when JWT_SECRET is missing', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('exit:1');
      }) as never);

      const original = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      vi.resetModules();

      try {
        await expect(import('../../src/lib/env.js')).rejects.toThrow('exit:1');
        expect(exitSpy).toHaveBeenCalledWith(1);
      } finally {
        process.env.JWT_SECRET = original;
      }
    });

    it('calls process.exit(1) when GOOGLE_CLIENT_ID is missing', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('exit:1');
      }) as never);

      const original = process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_ID;

      vi.resetModules();

      try {
        await expect(import('../../src/lib/env.js')).rejects.toThrow('exit:1');
        expect(exitSpy).toHaveBeenCalledWith(1);
      } finally {
        process.env.GOOGLE_CLIENT_ID = original;
      }
    });
  });
});
