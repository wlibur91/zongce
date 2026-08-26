import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MODULE_MAP } from '@/lib/rules';
import { addRecord, getRecords } from '@/lib/store';
import type { ActivityRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  module: z.string().refine(value => value in MODULE_MAP, { message: '未知的活动模块' }),
  name: z.string().trim().min(1, { message: '名称不能为空' }).max(50, { message: '名称限 50 字以内' }),
  subType: z.string().min(1, { message: '请选择奖励项目' }),
  grade: z.string().optional(),
  role: z.enum(['personal', 'team']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式应为 YYYY-MM-DD' }),
  term: z.string().trim().max(30).optional(),
  hours: z.number().min(0).max(1000).optional(),
  customPoints: z.number().min(0).max(5).optional(),
  note: z.string().trim().max(100).optional(),
});

export async function GET() {
  const records = await getRecords();
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '参数校验失败', issues: parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`) },
      { status: 400 },
    );
  }

  const rule = MODULE_MAP[parsed.data.module];
  if (rule.scoring === 'matrix' && !parsed.data.grade) {
    return NextResponse.json({ error: '参数校验失败', issues: ['grade: 该模块必须选择获奖等次'] }, { status: 400 });
  }
  if (rule.needsTerm && !parsed.data.term) {
    return NextResponse.json({ error: '参数校验失败', issues: ['term: 社会实践必须填写所属假期'] }, { status: 400 });
  }
  if (rule.needsHours && typeof parsed.data.hours !== 'number') {
    return NextResponse.json({ error: '参数校验失败', issues: ['hours: 志愿服务必须填写时长'] }, { status: 400 });
  }
  if (rule.needsCustomPoints && typeof parsed.data.customPoints !== 'number') {
    return NextResponse.json({ error: '参数校验失败', issues: ['customPoints: 其他加分项必须填写活动设定分值'] }, { status: 400 });
  }

  const record = await addRecord({
    ...parsed.data,
    module: parsed.data.module as ActivityRecord['module'],
  });
  return NextResponse.json({ record }, { status: 201 });
}
