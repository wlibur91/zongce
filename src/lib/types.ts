export type ModuleId =
  | 'social-practice'
  | 'volunteer'
  | 'honor'
  | 'research'
  | 'culture-sports'
  | 'competition'
  | 'certificate'
  | 'publicity'
  | 'other';

export type Role = 'personal' | 'team';

export type AuditStatus = 'pending' | 'approved' | 'rejected';

export interface ActivityRecord {
  id: string;
  module: ModuleId;
  name: string;
  subType: string;
  grade?: string;
  role: Role;
  date: string;
  term?: string;
  hours?: number;
  customPoints?: number;
  status: AuditStatus;
  note?: string;
  createdAt: string;
}

export type CreateRecordInput = Omit<ActivityRecord, 'id' | 'status' | 'createdAt'>;

export interface ScoreOption {
  key: string;
  label: string;
  points: number;
  group?: string;
}

export interface MatrixLevel {
  key: string;
  label: string;
  grades: Record<string, number>;
}

export interface MatrixDef {
  levels: MatrixLevel[];
  grades: { key: string; label: string }[];
}

export type DedupStrategy = 'none' | 'name' | 'term' | 'optionGroup';

export interface ModuleRule {
  id: ModuleId;
  index: string;
  name: string;
  description: string;
  cap: number;
  teamHalved: boolean;
  dedup: DedupStrategy;
  scoring: 'option' | 'matrix' | 'hours' | 'custom';
  options?: ScoreOption[];
  matrix?: MatrixDef;
  perHour?: number;
  needsTerm?: boolean;
  needsHours?: boolean;
  needsCustomPoints?: boolean;
  namePlaceholder?: string;
  ruleNotes: string[];
}

export interface CountedDetail {
  record: ActivityRecord;
  basePoints: number;
  factor: number;
  points: number;
}

export interface ExcludedDetail {
  record: ActivityRecord;
  reason: string;
}

export interface ModuleScore {
  moduleId: ModuleId;
  name: string;
  index: string;
  score: number;
  raw: number;
  capped: boolean;
  cap: number;
  counted: CountedDetail[];
  excluded: ExcludedDetail[];
}

export interface ScoreResult {
  total: number;
  full: number;
  gradeLabel: string;
  gradeThreshold: string;
  modules: ModuleScore[];
  pendingCount: number;
}
