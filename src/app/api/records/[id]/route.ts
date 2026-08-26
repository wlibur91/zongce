import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteRecord, updateRecordStatus } from '@/lib/store';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '参数校验失败', issues: ['status: 只能为 pending/approved/rejected'] }, { status: 400 });
  }

  const record = await updateRecordStatus(id, parsed.data.status);
  if (!record) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 });
  }
  return NextResponse.json({ record });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteRecord(id);
  if (!ok) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
