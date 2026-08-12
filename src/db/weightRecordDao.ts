import { getDb } from './database';

export interface WeightRecord {
  id: number;
  date: string;
  weight: number;
}

interface WeightRecordRow {
  id: number;
  date: string;
  weight: number;
}

/** 同日体重 upsert 覆盖（决策 #3：weight_records.date UNIQUE） */
export async function upsertWeight(date: string, weight: number): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO weight_records (date, weight) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET weight = excluded.weight`,
    date,
    weight
  );
}

export async function getWeightByDate(date: string): Promise<number | null> {
  const db = getDb();
  const row = await db.getFirstAsync<WeightRecordRow>(
    'SELECT id, date, weight FROM weight_records WHERE date = ?',
    date
  );
  return row?.weight ?? null;
}

export async function getAllWeightRecords(): Promise<WeightRecord[]> {
  const db = getDb();
  const rows = await db.getAllAsync<WeightRecordRow>(
    'SELECT id, date, weight FROM weight_records ORDER BY date ASC'
  );
  return rows;
}

export async function getWeightRecordsBetween(
  startDate: string,
  endDate: string
): Promise<WeightRecord[]> {
  const db = getDb();
  const rows = await db.getAllAsync<WeightRecordRow>(
    'SELECT id, date, weight FROM weight_records WHERE date BETWEEN ? AND ? ORDER BY date ASC',
    startDate,
    endDate
  );
  return rows;
}
