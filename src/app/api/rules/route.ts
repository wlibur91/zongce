import { NextResponse } from 'next/server';
import { FULL_SCORE, MODULE_RULES } from '@/lib/rules';

export async function GET() {
  return NextResponse.json({ modules: MODULE_RULES, fullScore: FULL_SCORE });
}
