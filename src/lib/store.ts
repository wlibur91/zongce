import { promises as fs } from 'fs';
import path from 'path';
import type { ActivityRecord, CreateRecordInput } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'records.json');

const SEED_RECORDS: ActivityRecord[] = [
  {
    id: 'seed-001',
    module: 'social-practice',
    name: '「三下乡」乡村振兴暑期社会实践',
    subType: 'school-team',
    role: 'team',
    date: '2025-07-20',
    term: '2025 暑假',
    status: 'approved',
    note: '校级重点团队，担任宣传组负责人',
    createdAt: '2025-10-20T09:00:00.000Z',
  },
  {
    id: 'seed-002',
    module: 'volunteer',
    name: '迎新志愿服务',
    subType: 'united-federation',
    role: 'personal',
    date: '2025-09-01',
    hours: 12,
    status: 'approved',
    createdAt: '2025-10-20T09:05:00.000Z',
  },
  {
    id: 'seed-003',
    module: 'honor',
    name: '校优秀共青团员',
    subType: 'school',
    role: 'personal',
    date: '2025-05-04',
    status: 'approved',
    createdAt: '2025-10-20T09:10:00.000Z',
  },
  {
    id: 'seed-004',
    module: 'competition',
    name: '全国大学生数学建模竞赛',
    subType: 'a',
    grade: 'second',
    role: 'team',
    date: '2025-11-15',
    status: 'approved',
    note: '省级二等奖（A 类二等）',
    createdAt: '2025-11-20T09:00:00.000Z',
  },
  {
    id: 'seed-005',
    module: 'publicity',
    name: '《曲园秋色》',
    subType: 'school-media',
    role: 'personal',
    date: '2025-10-30',
    status: 'pending',
    createdAt: '2025-11-01T09:00:00.000Z',
  },
];

// 串行化所有读-改-写操作，避免并发请求交叉写坏数据文件
let writeChain: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = writeChain.then(task, task);
  writeChain = next.catch(() => undefined);
  return next;
}

async function ensureDataFile(): Promise<ActivityRecord[]> {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(content) as ActivityRecord[];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    await saveRecords(SEED_RECORDS);
    return SEED_RECORDS;
  }
}

export async function getRecords(): Promise<ActivityRecord[]> {
  return ensureDataFile();
}

async function saveRecords(records: ActivityRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpFile = `${DATA_FILE}.${process.pid}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(records, null, 2), 'utf-8');
  await fs.rename(tmpFile, DATA_FILE);
}

export function addRecord(input: CreateRecordInput): Promise<ActivityRecord> {
  return serialize(async () => {
    const records = await ensureDataFile();
    const record: ActivityRecord = {
      ...input,
      id: `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    records.push(record);
    await saveRecords(records);
    return record;
  });
}

export function updateRecordStatus(
  id: string,
  status: ActivityRecord['status'],
): Promise<ActivityRecord | null> {
  return serialize(async () => {
    const records = await ensureDataFile();
    const record = records.find(item => item.id === id);
    if (!record) return null;
    record.status = status;
    await saveRecords(records);
    return record;
  });
}

export function deleteRecord(id: string): Promise<boolean> {
  return serialize(async () => {
    const records = await ensureDataFile();
    const index = records.findIndex(item => item.id === id);
    if (index === -1) return false;
    records.splice(index, 1);
    await saveRecords(records);
    return true;
  });
}
