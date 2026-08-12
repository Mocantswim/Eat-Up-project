import { getDb } from './database';
import { calcCalories } from '../utils/calc';

export interface ExerciseLog {
  id: number;
  date: string;
  sportType: string;
  durationMin: number;
  metValue: number;
  weightUsed: number;
  calories: number;
  createdAt: string;
}

interface ExerciseLogRow {
  id: number;
  date: string;
  sport_type: string;
  duration_min: number;
  met_value: number;
  weight_used: number;
  calories: number;
  created_at: string;
}

function mapRow(r: ExerciseLogRow): ExerciseLog {
  return {
    id: r.id,
    date: r.date,
    sportType: r.sport_type,
    durationMin: r.duration_min,
    metValue: r.met_value,
    weightUsed: r.weight_used,
    calories: r.calories,
    createdAt: r.created_at,
  };
}

/** 新增运动：以当前体重为快照计算并写入（决策 #12 数据流原则） */
export async function addExercise(params: {
  date: string;
  sportType: string;
  durationMin: number;
  met: number;
  weightKg: number;
}): Promise<number> {
  const calories = calcCalories(params.met, params.weightKg, params.durationMin);
  const db = getDb();
  const result = await db.runAsync(
    `INSERT INTO exercise_log (date, sport_type, duration_min, met_value, weight_used, calories, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params.date,
    params.sportType,
    params.durationMin,
    params.met,
    params.weightKg,
    calories,
    new Date().toISOString()
  );
  return result.lastInsertRowId;
}

/** 编辑运动：重新计算热量，weight_used 更新为编辑时当前体重 */
export async function updateExercise(
  id: number,
  params: { sportType: string; durationMin: number; met: number; weightKg: number }
): Promise<void> {
  const calories = calcCalories(params.met, params.weightKg, params.durationMin);
  const db = getDb();
  await db.runAsync(
    'UPDATE exercise_log SET sport_type = ?, duration_min = ?, met_value = ?, weight_used = ?, calories = ? WHERE id = ?',
    params.sportType,
    params.durationMin,
    params.met,
    params.weightKg,
    calories,
    id
  );
}

export async function deleteExercise(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM exercise_log WHERE id = ?', id);
}

export async function getExercisesByDate(date: string): Promise<ExerciseLog[]> {
  const db = getDb();
  const rows = await db.getAllAsync<ExerciseLogRow>(
    'SELECT * FROM exercise_log WHERE date = ? ORDER BY created_at ASC',
    date
  );
  return rows.map(mapRow);
}

/** 按 id 查询单条记录（编辑模式预填用） */
export async function getExerciseById(id: number): Promise<ExerciseLog | null> {
  const db = getDb();
  const row = await db.getFirstAsync<ExerciseLogRow>(
    'SELECT * FROM exercise_log WHERE id = ?',
    id
  );
  return row ? mapRow(row) : null;
}

/** 当日总消耗 kcal（无记录为 0） */
export async function getDailyTotal(date: string): Promise<number> {
  const db = getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(calories), 0) AS total FROM exercise_log WHERE date = ?',
    date
  );
  return row?.total ?? 0;
}

export async function getExercisesBetween(
  startDate: string,
  endDate: string
): Promise<ExerciseLog[]> {
  const db = getDb();
  const rows = await db.getAllAsync<ExerciseLogRow>(
    'SELECT * FROM exercise_log WHERE date BETWEEN ? AND ? ORDER BY date ASC, created_at ASC',
    startDate,
    endDate
  );
  return rows.map(mapRow);
}

/** 月历圆点标记：所有有记录日期 */
export async function getDatesWithRecords(): Promise<string[]> {
  const db = getDb();
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT DISTINCT date FROM exercise_log'
  );
  return rows.map((r) => r.date);
}
