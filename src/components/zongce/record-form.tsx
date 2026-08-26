'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MODULE_RULES, MODULE_MAP } from '@/lib/rules';
import { recordPoints } from '@/lib/scoring';
import type { ModuleId } from '@/lib/types';

interface FormState {
  subType: string;
  grade: string;
  name: string;
  role: 'personal' | 'team';
  date: string;
  term: string;
  hours: string;
  customPoints: string;
  note: string;
}

const emptyForm: FormState = {
  subType: '',
  grade: '',
  name: '',
  role: 'personal',
  date: '',
  term: '',
  hours: '',
  customPoints: '',
  note: '',
};

export function RecordForm({ onCreated }: { onCreated: () => void }) {
  const [moduleId, setModuleId] = useState<ModuleId | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const rule = moduleId ? MODULE_MAP[moduleId] : undefined;

  const estimate = useMemo(() => {
    if (!rule || !form.subType) return null;
    if (rule.scoring === 'matrix' && !form.grade) return null;
    if (rule.needsHours && !form.hours) return null;
    if (rule.needsCustomPoints && !form.customPoints) return null;
    const points = recordPoints(
      {
        id: 'draft',
        module: rule.id,
        name: form.name,
        subType: form.subType,
        grade: form.grade || undefined,
        role: form.role,
        date: form.date || '1970-01-01',
        term: form.term || undefined,
        hours: form.hours ? Number(form.hours) : undefined,
        customPoints: form.customPoints ? Number(form.customPoints) : undefined,
        status: 'pending',
        createdAt: '',
      },
      rule,
    );
    return points;
  }, [rule, form]);

  function selectModule(id: ModuleId) {
    setModuleId(id);
    setForm({ ...emptyForm, role: form.role });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rule) return;

    const errors: string[] = [];
    if (!form.name.trim()) errors.push('请填写名称');
    if (!form.subType) errors.push(rule.scoring === 'matrix' ? '请选择活动级别' : '请选择奖励项目');
    if (rule.scoring === 'matrix' && !form.grade) errors.push('请选择获奖等次');
    if (!form.date) errors.push('请选择证书落款日期');
    if (rule.needsTerm && !form.term.trim()) errors.push('请填写所属假期');
    if (rule.needsHours && !(Number(form.hours) > 0)) errors.push('请填写有效服务时长');
    if (rule.needsCustomPoints && !(Number(form.customPoints) > 0)) errors.push('请填写活动设定分值');

    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: rule.id,
          name: form.name.trim(),
          subType: form.subType,
          grade: form.grade || undefined,
          role: form.role,
          date: form.date,
          term: form.term.trim() || undefined,
          hours: rule.needsHours ? Number(form.hours) : undefined,
          customPoints: rule.needsCustomPoints ? Number(form.customPoints) : undefined,
          note: form.note.trim() || undefined,
        }),
      });
      const data = (await response.json()) as { record?: unknown; error?: string };
      if (!response.ok) {
        const issues = (data as { issues?: string[] }).issues?.join('；');
        toast.error(issues ?? data.error ?? '提交失败');
        return;
      }
      toast.success('已提交，等待审核认定');
      setForm({ ...emptyForm, role: form.role });
      onCreated();
    } catch {
      toast.error('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tab-fade space-y-4">
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 lg:grid-cols-9 lg:gap-2">
        {MODULE_RULES.map(item => {
          const active = item.id === moduleId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectModule(item.id)}
              className={`flex flex-col items-center gap-1 rounded-md border px-2 py-3 text-center transition-colors duration-150 ${
                active
                  ? 'border-ginkgo bg-ginkgo-soft text-ink'
                  : 'border-border/70 bg-card text-foreground hover:border-ginkgo/50'
              }`}
            >
              <span className={`font-serif-cn text-xs tabular-nums ${active ? 'text-ginkgo' : 'text-muted-foreground'}`}>
                {item.index}
              </span>
              <span className="text-xs font-medium lg:text-[13px]">{item.name}</span>
            </button>
          );
        })}
      </div>

      {!rule ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <p className="font-serif-cn text-base font-semibold text-ink">请选择要录入的模块</p>
            <p className="max-w-md text-xs leading-5 text-muted-foreground">
              按照操作手册，学生应在活动结束或收到证书一周内，将对应模块的信息如实录入并上传证明材料（本工具线下留档）。
            </p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card className="border-border/80 shadow-sm">
            <CardContent className="space-y-5 px-6 py-6">
              <div className="flex items-baseline justify-between border-b border-border/60 pb-3">
                <div>
                  <p className="font-serif-cn text-lg font-semibold text-ink">
                    <span className="mr-2 text-sm text-ginkgo tabular-nums">{rule.index}</span>
                    {rule.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{rule.description}</p>
                </div>
                {estimate !== null && (
                  <p className="shrink-0 text-xs text-muted-foreground">
                    预估得分
                    <span className="ml-1.5 font-serif-cn text-lg font-bold text-seal tabular-nums">
                      {estimate.toFixed(1)}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="subType">{rule.scoring === 'matrix' ? '活动级别' : '奖励项目'}</Label>
                  <Select value={form.subType} onValueChange={value => setForm(prev => ({ ...prev, subType: value }))}>
                    <SelectTrigger id="subType" className="w-full bg-card">
                      <SelectValue placeholder={`请选择${rule.scoring === 'matrix' ? '级别' : '奖励项目'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {rule.scoring === 'matrix'
                        ? rule.matrix?.levels.map(level => (
                            <SelectItem key={level.key} value={level.key}>
                              {level.label}
                            </SelectItem>
                          ))
                        : rule.options?.map(option => (
                            <SelectItem key={option.key} value={option.key}>
                              {option.label}
                              {option.points > 0 && <span className="ml-2 text-xs text-ginkgo">{option.points} 分</span>}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>

                {rule.scoring === 'matrix' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="grade">获奖等次</Label>
                    <Select value={form.grade} onValueChange={value => setForm(prev => ({ ...prev, grade: value }))}>
                      <SelectTrigger id="grade" className="w-full bg-card">
                        <SelectValue placeholder="请选择等次" />
                      </SelectTrigger>
                      <SelectContent>
                        {rule.matrix?.grades.map(grade => (
                          <SelectItem key={grade.key} value={grade.key}>
                            {grade.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {rule.needsTerm && (
                  <div className="space-y-1.5">
                    <Label htmlFor="term">所属假期</Label>
                    <Input
                      id="term"
                      value={form.term}
                      onChange={event => setForm(prev => ({ ...prev, term: event.target.value }))}
                      placeholder="如：2025 暑假 / 2025 寒假"
                      className="bg-card"
                    />
                    <p className="text-[11px] text-muted-foreground">一个假期原则上只记一次社会实践</p>
                  </div>
                )}

                {rule.needsHours && (
                  <div className="space-y-1.5">
                    <Label htmlFor="hours">服务时长（小时）</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.hours}
                      onChange={event => setForm(prev => ({ ...prev, hours: event.target.value }))}
                      placeholder="如：12"
                      className="bg-card"
                    />
                    <p className="text-[11px] text-muted-foreground">每 1 小时计 {rule.perHour} 分</p>
                  </div>
                )}

                {rule.needsCustomPoints && (
                  <div className="space-y-1.5">
                    <Label htmlFor="customPoints">活动设定分值</Label>
                    <Input
                      id="customPoints"
                      type="number"
                      min="0"
                      max="5"
                      step="0.5"
                      value={form.customPoints}
                      onChange={event => setForm(prev => ({ ...prev, customPoints: event.target.value }))}
                      placeholder="按学校/学院发布活动时设定的分值填写"
                      className="bg-card"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="date">证书落款日期</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={event => setForm(prev => ({ ...prev, date: event.target.value }))}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>个人 / 团体</Label>
                  <RadioGroup
                    value={form.role}
                    onValueChange={value => setForm(prev => ({ ...prev, role: value as 'personal' | 'team' }))}
                    className="flex h-9 items-center gap-5"
                  >
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <RadioGroupItem value="personal" id="role-personal" />
                      个人
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <RadioGroupItem value="team" id="role-team" />
                      团体{rule.teamHalved && <span className="text-[11px] text-muted-foreground">（个人加分减半）</span>}
                    </label>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">
                  {rule.id === 'honor' || rule.id === 'competition' ? '事项 / 比赛名称' : '具体名称'}
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">（50 字以内，必填）</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  maxLength={50}
                  onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
                  placeholder={rule.namePlaceholder}
                  className="bg-card"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">
                  备注
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">（100 字以内，选填）</span>
                </Label>
                <Textarea
                  id="note"
                  value={form.note}
                  maxLength={100}
                  onChange={event => setForm(prev => ({ ...prev, note: event.target.value }))}
                  placeholder="如：担任团队负责人 / 指导老师：XXX"
                  className="min-h-16 bg-card"
                />
              </div>

              {rule.ruleNotes.length > 0 && (
                <div className="rounded-md bg-secondary/70 px-4 py-3">
                  <ul className="space-y-1 text-xs leading-5 text-muted-foreground">
                    {rule.ruleNotes.map(note => (
                      <li key={note}>· {note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-4">
                <Button type="button" variant="ghost" onClick={() => setForm({ ...emptyForm, role: form.role })}>
                  重置
                </Button>
                <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {submitting ? '提交中…' : '提交录入'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
