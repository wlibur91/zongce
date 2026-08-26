import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils, APIError } from 'coze-coding-dev-sdk';
import { MODULE_RULES, FULL_SCORE, GRADE_SCALE } from '@/lib/rules';
import { computeScore } from '@/lib/scoring';
import { getRecords } from '@/lib/store';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SCORING_LABELS: Record<string, string> = {
  option: '按档位取分',
  hours: '按时长折算',
  matrix: '按等级×级别矩阵取分',
  custom: '按固定规则取分',
};

function buildRulesBriefing(): string {
  const lines = MODULE_RULES.map((rule) => {
    const head = `${rule.index} ${rule.name}（模块满分 ${rule.cap} 分，计分方式：${SCORING_LABELS[rule.scoring] ?? rule.scoring}）`;
    const notes = rule.ruleNotes.map((n) => `  - ${n}`).join('\n');
    const extra = [
      rule.dedup === 'term' ? '  - 同一假期只计最高一次' : '',
      rule.teamHalved ? '  - 团体荣誉个人加分减半' : '',
    ]
      .filter(Boolean)
      .join('\n');
    return `${head}\n${notes}${extra ? '\n' + extra : ''}`;
  });
  const scale = GRADE_SCALE.map(
    (g) => `${g.label}：${Math.round(FULL_SCORE * g.threshold)} 分及以上`
  ).join('；');
  return `${lines.join('\n\n')}\n\n总分满分 ${FULL_SCORE} 分。等级线：${scale}。只有审核通过的记录参与计分。`;
}

async function buildScoreBriefing(): Promise<string> {
  const records = await getRecords();
  const result = computeScore(records);
  const moduleLines = result.modules
    .map((m) => `${m.name} ${m.score}/${m.cap} 分`)
    .join('，');
  const excludedCount = result.modules.reduce((sum, m) => sum + m.excluded.length, 0);
  const pendingCount = records.filter((r) => r.status === 'pending').length;
  return [
    `当前总分：${result.total} / ${result.full} 分，等级：${result.gradeLabel}（${result.gradeThreshold}）。`,
    `各模块得分：${moduleLines}。`,
    `被去重或封顶剔除的记录共 ${excludedCount} 条，待审核记录 ${pendingCount} 条（待审核记录不计分）。`,
  ].join('\n');
}

export async function POST(request: NextRequest) {
  let history: ChatMessage[];
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    history = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  } catch {
    return NextResponse.json({ error: '请求体必须是合法 JSON' }, { status: 400 });
  }

  const trimmed = history
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20);
  if (trimmed.length === 0 || trimmed[trimmed.length - 1].role !== 'user') {
    return NextResponse.json({ error: '请提供有效的提问内容' }, { status: 400 });
  }

  const systemPrompt = [
    '你是曲阜师范大学「智慧曲园」第二课堂综合测评系统的 AI 助手，熟悉《第二课堂成绩单制度》，负责解答学生关于综测计分、录入、审核的问题。',
    '回答要求：使用简体中文；简洁准确，先给结论再给依据；涉及计分时引用下方规则原文；引用学生数据时以「成绩快照」为准；与综测无关的问题礼貌拉回主题。',
    '',
    '【计分规则】',
    buildRulesBriefing(),
    '',
    '【该生当前成绩快照】',
    await buildScoreBriefing(),
  ].join('\n');

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(new Config(), customHeaders);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...trimmed.map((m) => ({ role: m.role, content: m.content })),
    ];

    const stream = client.stream(messages, {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.5,
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              controller.enqueue(encoder.encode(chunk.content.toString()));
            }
          }
        } catch (error) {
          const raw = error instanceof Error ? error.message : 'AI 服务异常';
          const msg = raw.includes('积分余额不足')
            ? '当前环境的 AI 服务积分余额不足，暂无法生成回答。请联系平台管理员增购积分或升级套餐后重试；接口与接入代码均已就绪。'
            : `AI 回答中断：${raw}`;
          controller.enqueue(encoder.encode(msg));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json({ error: `AI 服务错误：${error.message}` }, { status: 502 });
    }
    return NextResponse.json({ error: 'AI 服务暂时不可用，请稍后重试' }, { status: 502 });
  }
}
