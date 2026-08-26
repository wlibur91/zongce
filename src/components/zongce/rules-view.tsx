'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FULL_SCORE, MODULE_RULES } from '@/lib/rules';

function MatrixTable({ rule }: { rule: (typeof MODULE_RULES)[number] }) {
  if (!rule.matrix) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[430px] text-left text-xs">
        <thead>
          <tr className="border-b border-border/70 text-muted-foreground">
            <th className="py-1.5 pr-4 font-medium">级别</th>
            {rule.matrix.grades.map(grade => (
              <th key={grade.key} className="py-1.5 pr-4 font-medium">
                {grade.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rule.matrix.levels.map(level => (
            <tr key={level.key} className="border-b border-border/40 last:border-0">
              <td className="py-1.5 pr-4 font-medium text-ink">{level.label}</td>
              {rule.matrix?.grades.map(grade => (
                <td key={grade.key} className="py-1.5 pr-4 tabular-nums text-foreground">
                  {level.grades[grade.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RulesView() {
  return (
    <div className="tab-fade space-y-4">
      <Card className="border-ginkgo/40 bg-ginkgo-soft/60 shadow-none">
        <CardContent className="space-y-1.5 px-6 py-4">
          <p className="font-serif-cn text-sm font-semibold text-ink">关于本评分体系</p>
          <p className="text-xs leading-5 text-muted-foreground">
            九大模块、审核流程、时限与计分口径依据《关于依托「智慧曲园」系统实施「第二课堂成绩单」制度的通知》整理；因原始文件未附具体分值表，
            各项分值与模块上限为<b className="text-accent-foreground">参考实现</b>（满分 {FULL_SCORE} 分），实际以学校当年度发布的正式细则为准。
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {MODULE_RULES.map(rule => (
          <Card key={rule.id} className="dossier-card border-border/80 shadow-none">
            <CardContent className="space-y-3 px-5 py-4">
              <div className="flex items-baseline justify-between">
                <p className="font-serif-cn text-base font-semibold text-ink">
                  <span className="mr-2 text-xs text-ginkgo tabular-nums">{rule.index}</span>
                  {rule.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  上限 <span className="font-serif-cn text-sm font-bold text-ink tabular-nums">{rule.cap}</span> 分
                </p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{rule.description}</p>

              <Separator className="bg-border/60" />

              {rule.scoring === 'option' && rule.options && rule.options.some(option => option.points > 0) && (
                <ul className="space-y-1 text-xs">
                  {rule.options
                    .filter(option => option.points > 0)
                    .map(option => (
                      <li key={option.key} className="flex items-baseline justify-between gap-3">
                        <span className="leading-5 text-foreground">{option.label}</span>
                        <span className="shrink-0 font-serif-cn font-semibold text-ink tabular-nums">{option.points} 分</span>
                      </li>
                    ))}
                </ul>
              )}

              {rule.scoring === 'matrix' && <MatrixTable rule={rule} />}

              {rule.scoring === 'hours' && (
                <p className="rounded-md bg-secondary/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
                  按 {rule.perHour} 分 / 小时累计（证明认定的时长），模块上限 {rule.cap} 分。
                </p>
              )}

              {rule.scoring === 'custom' && (
                <p className="rounded-md bg-secondary/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
                  按学校 / 学院发布活动时设定的分值填写并录入，单条不超过 {rule.cap} 分，模块上限 {rule.cap} 分。
                </p>
              )}

              <div className="rounded-md bg-secondary/50 px-3 py-2">
                <ul className="space-y-0.5 text-[11px] leading-5 text-muted-foreground">
                  {rule.ruleNotes.map(note => (
                    <li key={note}>· {note}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/80 shadow-none">
        <CardContent className="space-y-2 px-5 py-4">
          <p className="font-serif-cn text-sm font-semibold text-ink">录入与审核时限（摘自通知）</p>
          <ul className="space-y-1 text-xs leading-5 text-muted-foreground">
            <li>· 学生原则上本人录入：已开展活动于活动结束后一周内录入；获奖自收到证书之日起一周内录入。</li>
            <li>· 未在规定时间内录入的，审核单位可以不予审核和认定。</li>
            <li>· 校级及以上活动由校级主办或组织单位审核，学院活动由学院负责审核。</li>
            <li>· 未经审核的项目，在综合测评和各类评比表彰中原则上不予认可。</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
