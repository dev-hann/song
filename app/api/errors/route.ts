import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { reportError } from '@/server/services/error-reporter';

const ErrorReportSchema = z.object({
  message: z.string().min(1).max(500),
  stack: z.string().max(3000).optional(),
  route: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = handleErrors(async (request: Request) => {
  const { error } = await requireAuth();
  if (error) {return error;}

  const { data, error: bodyError } = validateBody(ErrorReportSchema, await request.json());
  if (bodyError) {return bodyError;}

  const { message, stack, route, metadata } = data;
  await reportError(
    { message, stack },
    {
      source: 'client',
      route,
      method: 'CLIENT',
      userAgent: request.headers.get('user-agent') ?? undefined,
      metadata,
    },
  );
  return NextResponse.json({ success: true });
});
