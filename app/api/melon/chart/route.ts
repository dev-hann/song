import { NextResponse } from 'next/server';
import { melonProvider } from '@/server/application/wiring';
import type { MelonChartType } from '@/server/domain/ports/providers';
import { MelonChartResponseSchema } from '@/server/application/schemas/response';

const VALID_TYPES: MelonChartType[] = ['realtime', 'hot100', 'daily'];

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get('type') ?? undefined;
    const type: MelonChartType = VALID_TYPES.includes(raw as MelonChartType)
      ? (raw as MelonChartType)
      : 'realtime';
    const chart = await melonProvider.getChart(type);
    return NextResponse.json(MelonChartResponseSchema.parse(chart));
  } catch (error) {
    console.error('[Melon] Chart Error:', error);
    return NextResponse.json({ error: 'Failed to fetch chart' }, { status: 500 });
  }
}
