import { NextResponse } from 'next/server';
import { computeScore } from '@/lib/scoring';
import { getRecords } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const records = await getRecords();
  const result = computeScore(records);
  return NextResponse.json(result);
}
