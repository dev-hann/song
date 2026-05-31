import type { ZodSchema } from 'zod';
import { auth } from '../auth';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user.id) {
    return { session: null, error: NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 }) };
  }
  return { session, error: null };
}

export function validateBody<T>(schema: ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { data: null, error: NextResponse.json({ error: result.error.issues[0].message }, { status: 400 }) };
  }
  return { data: result.data, error: null };
}

export function validateParams<T extends Record<string, string>>(schema: ZodSchema<T>, params: T) {
  const result = schema.safeParse(params);
  if (!result.success) {
    return { data: null, error: NextResponse.json({ error: result.error.issues[0].message }, { status: 400 }) };
  }
  return { data: result.data, error: null };
}

export function handleErrors<T extends Record<string, string>>(
  fn: (request: Request, context: { params: Promise<T> }) => Promise<Response>,
): (request: Request, context: { params: Promise<T> }) => Promise<Response> {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      console.error('[API Error]', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
