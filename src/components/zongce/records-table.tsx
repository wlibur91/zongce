'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Check, Undo2, X } from 'lucide-react';
import { MODULE_MAP, MODULE_RULES } from '@/lib/rules';
import { recordPoints } from '@/lib/scoring';
import type { ActivityRecord, AuditStatus } from '@/lib/types';

const STATUS_META: Record<AuditStatus, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'border-[#b4653a]/40 bg-[#b4653a]/8 text-[#8a4d29]' },
  approved: { label: '已认定', className: 'border-approve/40 bg-approve/10 text-approve' },
  rejected: { label: '已驳回', className: 'border-seal/40 bg-seal/10 text-seal' },
};

function optionLabel(record: ActivityRecord): string {
  const rule = MODULE_MAP[record.module];
  if (!rule) return record.subType;
  if (rule.scoring === 'matrix') {
    const level = rule.matrix?.levels.find(item => item.key === record.subType);
    const grade = rule.matrix?.grades.find(item => item.key === record.grade);
    return [level?.label, grade?.label].filter(Boolean).join(' · ');
  }
  const option = rule.options?.find(item => item.key === record.subType);
  return option?.label ?? record.subType;
}

export function RecordsTable({
  records,
  onChanged,
}: {
  records: ActivityRecord[];
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = filter === 'all' ? records : records.filter(record => record.module === filter);
  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function patchStatus(id: string, status: AuditStatus) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? '操作失败');
        return;
      }
      toast.success(status === 'approved' ? '已认定，计入总分' : status === 'rejected' ? '已驳回' : '已重置为待审核');
      onChanged();
    } catch {
      toast.error('网络错误，请重试');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, name: string) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? '删除失败');
        return;
      }
      toast.success(`已删除「${name}」`);
      onChanged();
    } catch {
      toast.error('网络错误，请重试');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="tab-fade space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          共 {records.length} 条记录，已认定 {records.filter(r => r.status === 'approved').length} 条
        </p>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部模块</SelectItem>
            {MODULE_RULES.map(rule => (
              <SelectItem key={rule.id} value={rule.id}>
                {rule.index} {rule.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/80 shadow-none">
        <CardContent className="px-4 py-2 sm:px-6">
          {sorted.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">暂无记录，去「添加记录」录入第一条吧。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead className="w-24">模块</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="hidden md:table-cell">项目 / 等次</TableHead>
                  <TableHead className="hidden sm:table-cell">日期</TableHead>
                  <TableHead className="text-right">分值</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="w-36 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(record => {
                  const rule = MODULE_MAP[record.module];
                  const meta = STATUS_META[record.status];
                  const points = rule ? recordPoints(record, rule) : 0;
                  const busy = busyId === record.id;
                  return (
                    <TableRow key={record.id} className="border-border/50">
                      <TableCell className="text-xs text-muted-foreground">
                        {rule?.index} {rule?.name}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-56 truncate font-medium sm:max-w-none" title={record.name}>
                          {record.name}
                        </p>
                        {record.term && <p className="text-[11px] text-muted-foreground">{record.term}</p>}
                        {record.hours !== undefined && (
                          <p className="text-[11px] text-muted-foreground">{record.hours} 小时</p>
                        )}
                      </TableCell>
                      <TableCell className="hidden max-w-52 truncate text-xs text-muted-foreground md:table-cell" >
                        {optionLabel(record)}
                        {record.role === 'team' && <span className="ml-1.5 text-[11px] text-ginkgo">团体</span>}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{record.date}</TableCell>
                      <TableCell className="text-right font-serif-cn text-sm font-semibold text-ink tabular-nums">
                        {record.status === 'approved' ? points.toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[11px] ${meta.className}`}>
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {record.status !== 'approved' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-approve hover:text-approve"
                              title="认定通过"
                              disabled={busy}
                              onClick={() => patchStatus(record.id, 'approved')}
                            >
                              <Check className="size-3.5" />
                            </Button>
                          )}
                          {record.status !== 'rejected' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-seal hover:text-seal"
                              title="驳回"
                              disabled={busy}
                              onClick={() => patchStatus(record.id, 'rejected')}
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                          {record.status !== 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground"
                              title="重置为待审核"
                              disabled={busy}
                              onClick={() => patchStatus(record.id, 'pending')}
                            >
                              <Undo2 className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-seal"
                            title="删除"
                            disabled={busy}
                            onClick={() => remove(record.id, record.name)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5" aria-hidden="true">
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs leading-5 text-muted-foreground">
        按「谁主办、谁审核、谁负责」原则，模拟审核操作：通过后计入总分，驳回后不计分。正式认定以学院 / 学校在智慧曲园系统中的审核结果为准。
      </p>
    </div>
  );
}
