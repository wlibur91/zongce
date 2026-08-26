import { FULL_SCORE, GRADE_SCALE, MODULE_RULES, MODULE_MAP } from './rules';
import type {
  ActivityRecord,
  CountedDetail,
  ExcludedDetail,
  ModuleScore,
  ModuleRule,
  ScoreResult,
} from './types';

export function recordBasePoints(record: ActivityRecord, rule: ModuleRule): number {
  switch (rule.scoring) {
    case 'option': {
      const option = rule.options?.find(opt => opt.key === record.subType);
      return option?.points ?? 0;
    }
    case 'matrix': {
      const level = rule.matrix?.levels.find(lv => lv.key === record.subType);
      if (!level || !record.grade) return 0;
      return level.grades[record.grade] ?? 0;
    }
    case 'hours':
      return Math.max(0, record.hours ?? 0) * (rule.perHour ?? 0);
    case 'custom':
      return Math.min(Math.max(record.customPoints ?? 0, 0), rule.cap);
  }
}

export function recordPoints(record: ActivityRecord, rule: ModuleRule): number {
  const base = recordBasePoints(record, rule);
  if (rule.teamHalved && record.role === 'team') {
    return Math.round(base * 0.5 * 100) / 100;
  }
  return Math.round(base * 100) / 100;
}

export function isTeamHalved(record: ActivityRecord, rule: ModuleRule): boolean {
  return rule.teamHalved && record.role === 'team';
}

function dedupKey(record: ActivityRecord, rule: ModuleRule): string | null {
  switch (rule.dedup) {
    case 'name':
      return record.name.trim();
    case 'term':
      return (record.term ?? record.name).trim();
    case 'optionGroup': {
      const option = rule.options?.find(opt => opt.key === record.subType);
      return option?.group ?? record.subType;
    }
    case 'none':
    default:
      return null;
  }
}

function computeModule(records: ActivityRecord[], rule: ModuleRule): ModuleScore {
  const excluded: ExcludedDetail[] = [];
  const pending: ActivityRecord[] = [];
  const approved: ActivityRecord[] = [];

  for (const record of records) {
    if (record.module !== rule.id) continue;
    if (record.status === 'approved') {
      approved.push(record);
    } else {
      pending.push(record);
    }
  }

  const scored = approved.map(record => ({
    record,
    points: recordPoints(record, rule),
    basePoints: recordBasePoints(record, rule),
    factor: isTeamHalved(record, rule) ? 0.5 : 1,
  }));

  const groups = new Map<string, typeof scored>();
  for (const item of scored) {
    const key = dedupKey(item.record, rule);
    if (key === null) continue;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  const kept = new Set<string>();
  for (const group of groups.values()) {
    const best = group.reduce((top, item) => (item.points > top.points ? item : top));
    kept.add(best.record.id);
    for (const item of group) {
      if (item.record.id !== best.record.id) {
        excluded.push({
          record: item.record,
          reason:
            rule.dedup === 'term'
              ? `同一假期（${item.record.term ?? ''}）仅计一次，按最高档计分`
              : rule.dedup === 'optionGroup'
                ? '同类证书按最高档次计一次'
                : '同一事项不累计加分，按最高档计分',
        });
      }
    }
  }

  const counted: CountedDetail[] = [];
  let raw = 0;
  for (const item of scored) {
    if (kept.has(item.record.id) || kept.size === 0 || dedupKey(item.record, rule) === null) {
      counted.push({
        record: item.record,
        basePoints: item.basePoints,
        factor: item.factor,
        points: item.points,
      });
      raw += item.points;
    }
  }

  for (const record of pending) {
    excluded.push({
      record,
      reason: record.status === 'pending' ? '待审核，暂不计分' : '已驳回，不计分',
    });
  }

  raw = Math.round(raw * 100) / 100;
  const capped = raw > rule.cap;
  const score = Math.min(raw, rule.cap);

  return {
    moduleId: rule.id,
    name: rule.name,
    index: rule.index,
    score: Math.round(score * 100) / 100,
    raw,
    capped,
    cap: rule.cap,
    counted,
    excluded,
  };
}

export function computeScore(records: ActivityRecord[]): ScoreResult {
  const modules = MODULE_RULES.map(rule => computeModule(records, rule));
  const total = Math.round(modules.reduce((sum, m) => sum + m.score, 0) * 100) / 100;
  const scale = GRADE_SCALE.find(g => total >= FULL_SCORE * g.threshold) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
  const pendingCount = records.filter(r => r.status === 'pending').length;

  return {
    total,
    full: FULL_SCORE,
    gradeLabel: scale.label,
    gradeThreshold:
      scale.threshold > 0 ? `${Math.round(FULL_SCORE * scale.threshold)} 分及以上` : `低于 ${Math.round(FULL_SCORE * 0.4)} 分`,
    modules,
    pendingCount,
  };
}

export function findRule(moduleId: string): ModuleRule | undefined {
  return MODULE_MAP[moduleId];
}
