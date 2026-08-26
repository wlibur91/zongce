'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { RecordForm } from '@/components/zongce/record-form';
import { RecordsTable } from '@/components/zongce/records-table';
import { RulesView } from '@/components/zongce/rules-view';
import { TranscriptView } from '@/components/zongce/transcript-view';
import { computeScore } from '@/lib/scoring';
import type { ActivityRecord } from '@/lib/types';

export default function Home() {
  const [records, setRecords] = useState<ActivityRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/records');
      if (!response.ok) throw new Error('加载失败');
      const data = (await response.json()) as { records: ActivityRecord[] };
      setRecords(data.records);
      setLoadError(null);
    } catch {
      setLoadError('记录加载失败，请刷新页面重试');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const score = useMemo(() => (records ? computeScore(records) : null), [records]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      <header className="border-b border-border/70 bg-card/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-[11px] tracking-[0.35em] text-ginkgo">智慧曲园 · 第二课堂成绩单</p>
            <h1 className="font-serif-cn mt-1.5 text-2xl font-bold text-ink sm:text-[28px]">
              综合测评计算器
            </h1>
            <p className="mt-1.5 max-w-xl text-xs leading-5 text-muted-foreground">
              按《第二课堂成绩单》制度整理的九大模块计分工具：录入活动 → 审核认定 → 自动生成成绩单。
            </p>
          </div>
          <div className="flex items-center gap-2 sm:pb-1">
            <span className="inline-flex size-11 items-center justify-center rounded-md border border-seal/40 bg-seal-soft">
              <span className="font-serif-cn text-sm font-bold leading-tight text-seal">
                曲园
                <br />
                制度
              </span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {loadError && (
          <p className="mb-4 rounded-md border border-seal/30 bg-seal-soft px-4 py-3 text-sm text-seal">{loadError}</p>
        )}

        {!records ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <Skeleton className="h-64 w-full" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="transcript" className="gap-5">
            <TabsList className="bg-secondary/80">
              <TabsTrigger value="transcript">成绩单</TabsTrigger>
              <TabsTrigger value="add">添加记录</TabsTrigger>
              <TabsTrigger value="records">
                记录管理
                {score && score.pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-[#b4653a] text-[10px] font-medium leading-none text-white tabular-nums">
                    {score.pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="rules">评分规则</TabsTrigger>
            </TabsList>

            <TabsContent value="transcript">
              {score && <TranscriptView score={score} />}
            </TabsContent>

            <TabsContent value="add">
              <RecordForm onCreated={() => void refresh()} />
            </TabsContent>

            <TabsContent value="records">
              <RecordsTable records={records} onChanged={() => void refresh()} />
            </TabsContent>

            <TabsContent value="rules">
              <RulesView />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="border-t border-border/70 py-6">
        <p className="mx-auto max-w-6xl px-4 text-center text-[11px] leading-5 text-muted-foreground sm:px-6">
          依据《关于依托「智慧曲园」系统实施「第二课堂成绩单」制度的通知》整理 · 分值为参考实现，正式认定以学校审核结果为准
        </p>
      </footer>
    </div>
  );
}
