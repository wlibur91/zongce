'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { MODULE_MAP } from '@/lib/rules';
import type { ModuleScore, ScoreResult } from '@/lib/types';

function useAnimatedNumber(target: number, duration = 300): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}

function optionLabel(moduleId: string, subType?: string): string {
  const rule = MODULE_MAP[moduleId];
  if (!rule) return subType ?? '';
  if (rule.scoring === 'matrix') {
    const level = rule.matrix?.levels.find(item => item.key === subType);
    return level?.label ?? subType ?? '';
  }
  const option = rule.options?.find(item => item.key === subType);
  return option?.label ?? subType ?? '';
}

function gradeLabel(moduleId: string, grade?: string): string {
  if (!grade) return '';
  const rule = MODULE_MAP[moduleId];
  const item = rule?.matrix?.grades.find(g => g.key === grade);
  return item?.label ?? grade;
}

function ModuleScoreBar({ module }: { module: ModuleScore }) {
  const [open, setOpen] = useState(false);
  const percent = Math.min((module.score / module.cap) * 100, 100);

  return (
    <Card className="dossier-card border-border/80 shadow-none">
      <CardContent className="px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="font-serif-cn text-sm font-semibold text-ginkgo tabular-nums">{module.index}</span>
            <span className="font-serif-cn text-base font-semibold text-ink">{module.name}</span>
            {module.capped && <Badge variant="outline" className="border-ginkgo/50 text-[11px] text-accent-foreground">已封顶</Badge>}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif-cn text-xl font-bold text-ink tabular-nums">{module.score.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">/ {module.cap} 分</span>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary" aria-label={`${module.name}得分进度`}>
          <div
            className="h-full rounded-full bg-ginkgo transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        {module.excluded.length > 0 && (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            另有 {module.excluded.length} 条记录未计入（
            {module.excluded.map(item => `${item.record.name}：${item.reason}`).join('；')}）
          </p>
        )}

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs text-muted-foreground hover:text-ink">
              计分明细（{module.counted.length} 条）
              <ChevronDown className={`ml-1 size-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {module.counted.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">暂无已认定的记录。</p>
            ) : (
              <ul className="mt-1 space-y-1.5 border-t border-border/60 pt-3">
                {module.counted.map(detail => (
                  <li key={detail.record.id} className="flex items-baseline justify-between gap-3 text-xs leading-5">
                    <span className="text-foreground">
                      {detail.record.name}
                      <span className="ml-2 text-muted-foreground">
                        {optionLabel(detail.record.module, detail.record.subType)}
                        {detail.record.grade ? ` · ${gradeLabel(detail.record.module, detail.record.grade)}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium text-ink tabular-nums">
                      {detail.basePoints.toFixed(1)}
                      {detail.factor === 0.5 && <span className="mx-1 text-muted-foreground">×</span>}
                      {detail.factor === 0.5 && <span>0.5（团体）</span>}
                      {detail.factor === 0.5 && <span className="mx-1 text-muted-foreground">=</span>}
                      {detail.factor === 0.5 ? (
                        <span className="font-semibold">{detail.points.toFixed(1)}</span>
                      ) : (
                        <span className="ml-1.5 font-semibold">{detail.points.toFixed(1)}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export function TranscriptView({ score }: { score: ScoreResult }) {
  const animatedTotal = useAnimatedNumber(score.total);
  const ordered = [...score.modules].sort((a, b) => b.score / b.cap - a.score / a.cap);
  const earned = score.modules.filter(m => m.score > 0).length;

  return (
    <div className="tab-fade grid gap-5 lg:grid-cols-[320px_1fr]">
      <div className="flex flex-col gap-4">
        <Card className="border-seal/25 bg-card shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-8">
            <p className="text-xs tracking-[0.3em] text-muted-foreground">综合测评总分</p>
            <div className="flex items-center gap-2">
              <span className="font-serif-cn text-6xl font-bold leading-none text-seal tabular-nums">
                {animatedTotal.toFixed(1)}
              </span>
              <span className="self-end pb-1.5 text-sm text-muted-foreground">/ {score.full}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 border-t border-dashed border-seal/30 pt-3">
              <span className="font-serif-cn text-lg font-semibold text-seal">{score.gradeLabel}</span>
              <span className="text-xs text-muted-foreground">（{score.gradeThreshold}）</span>
            </div>
            {score.pendingCount > 0 && (
              <p className="text-xs text-accent-foreground/90">另有 {score.pendingCount} 条记录待审核，暂未计入</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-2 px-6 py-5 text-sm">
            <p className="font-serif-cn font-semibold text-ink">成绩单说明</p>
            <ul className="space-y-1.5 text-xs leading-5 text-muted-foreground">
              <li>· 仅「已认定」状态的记录计入总分；</li>
              <li>· 团体荣誉按细则个人加分减半；</li>
              <li>· 同一事项 / 同一假期 / 同类证书按最高档计一次；</li>
              <li>· 各模块得分封顶，超出部分不计；</li>
              <li>· 已认定模块 {earned} / {score.modules.length}。</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {ordered.map(module => (
          <ModuleScoreBar key={module.moduleId} module={module} />
        ))}
      </div>
    </div>
  );
}
