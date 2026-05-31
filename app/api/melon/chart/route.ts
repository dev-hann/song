import { NextResponse } from 'next/server';
import { getMelonChart, type MelonChartType } from '@/server/services/melon';

const VALID_TYPES: MelonChartType[] = ['realtime', 'hot100', 'daily'];

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get('type') ?? undefined;
    const type: MelonChartType = VALID_TYPES.includes(raw as MelonChartType)
      ? (raw as MelonChartType)
      : 'realtime';
    const chart = await getMelonChart(type);
    return NextResponse.json(chart);
  } catch (error) {
    console.error('[Melon] Chart Error:', error);
    return NextResponse.json({ error: 'Failed to fetch chart' }, { status: 500 });
  }
}
