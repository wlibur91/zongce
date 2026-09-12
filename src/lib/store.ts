import pool from './db';
import type { ActivityRecord, CreateRecordInput } from './types';

function rowToRecord(row: Record<string, unknown>): ActivityRecord {
  return {
    id: String(row.id),
    module: String(row.module) as ActivityRecord['module'],
    name: String(row.name),
    subType: String(row.sub_type),
    grade: row.grade ? String(row.grade) : undefined,
    role: String(row.role) as ActivityRecord['role'],
    date: String(row.date).slice(0, 10),
    term: row.term ? String(row.term) : undefined,
    hours: row.hours != null ? Number(row.hours) : undefined,
    customPoints: row.custom_points != null ? Number(row.custom_points) : undefined,
    status: String(row.status) as ActivityRecord['status'],
    note: row.note ? String(row.note) : undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

export async function getRecords(): Promise<ActivityRecord[]> {
  const [rows] = await pool.query('SELECT * FROM records ORDER BY created_at DESC');
  const records = (rows as Record<string, unknown>[]).map(rowToRecord);
  if (records.length === 0) {
    await seedIfEmpty();
    return getRecords();
  }
  return records;
}

export async function addRecord(input: CreateRecordInput): Promise<ActivityRecord> {
  const id = `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await pool.query(
    `INSERT INTO records (id, module, name, sub_type, grade, role, date, term, hours, custom_points, status, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      id,
      input.module,
      input.name,
      input.subType,
      input.grade || null,
      input.role,
      input.date,
      input.term || null,
      input.hours || null,
      input.customPoints || null,
      input.note || null,
    ],
  );
  const [rows] = await pool.query('SELECT * FROM records WHERE id = ?', [id]);
  return rowToRecord((rows as Record<string, unknown>[])[0]);
}

export async function updateRecordStatus(
  id: string,
  status: ActivityRecord['status'],
): Promise<ActivityRecord | null> {
  await pool.query('UPDATE records SET status = ? WHERE id = ?', [status, id]);
  const [rows] = await pool.query('SELECT * FROM records WHERE id = ?', [id]);
  const rows_arr = rows as Record<string, unknown>[];
  return rows_arr.length > 0 ? rowToRecord(rows_arr[0]) : null;
}

export async function deleteRecord(id: string): Promise<boolean> {
  const [result] = await pool.query('DELETE FROM records WHERE id = ?', [id]);
  return (result as { affectedRows: number }).affectedRows > 0;
}

const SEED_RECORDS: Omit<ActivityRecord, 'id' | 'createdAt'>[] = [
  {
    module: 'social-practice',
    name: '「三下乡」乡村振兴暑期社会实践',
    subType: 'school-team',
    role: 'team',
    date: '2025-07-20',
    term: '2025 暑假',
    status: 'approved',
    note: '校级重点团队，担任宣传组负责人',
  },
  {
    module: 'volunteer',
    name: '迎新志愿服务',
    subType: 'united-federation',
    role: 'personal',
    date: '2025-09-01',
    hours: 12,
    status: 'approved',
  },
  {
    module: 'honor',
    name: '校优秀共青团员',
    subType: 'school',
    role: 'personal',
    date: '2025-05-04',
    status: 'pending',
  },
  {
    module: 'publicity',
    name: '《曲园秋色》',
    subType: 'school-media',
    role: 'personal',
    date: '2025-10-30',
    status: 'approved',
  },
];

async function seedIfEmpty() {
  for (const seed of SEED_RECORDS) {
    const id = `seed-${Math.random().toString(36).slice(2, 8)}`;
    await pool.query(
      `INSERT IGNORE INTO records (id, module, name, sub_type, grade, role, date, term, hours, custom_points, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        seed.module,
        seed.name,
        seed.subType,
        seed.grade || null,
        seed.role,
        seed.date,
        seed.term || null,
        seed.hours || null,
        seed.customPoints || null,
        seed.status,
        seed.note || null,
      ],
    );
  }
}
