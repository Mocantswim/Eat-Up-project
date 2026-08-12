import { getDb } from './database';
import { calcCalories, calcRepsCalories, calcWeightCalories } from '../utils/calc';
import { getSportKindByName, type SportKind } from '../constants/sports';

export interface ExerciseLog {
  id: number;
  date: string;
  sportType: string;
  kind: SportKind;
  durationMin: number; // 时长型分钟（次数/重量型为 0）
  reps: number | null; // 次数（次数/重量型）
  loadKg: number | null; // 重量（重量型）
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
  rep_count: number | null;
  load_weight: number | null;
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
    kind: getSportKindByName(r.sport_type),
    durationMin: r.duration_min,
    reps: r.rep_count ?? null,
    loadKg: r.load_weight ?? null,
    metValue: r.met_value,
    weightUsed: r.weight_used,
    calories: r.calories,
    createdAt: r.created_at,
  };
}

/** 运动输入参数（支持 时长/次数/重量 三种模式） */
export interface ExerciseInput {
  date: string;
  sportType: string;
  kind: SportKind;
  durationMin?: number | null;
  reps?: number | null;
  loadKg?: number | null;
  met: number;
  factor?: number; // 次数/重量型的换算系数
  weightKg: number;
}

/** 根据运动模式计算热量 */
export function calcExerciseCalories(input: ExerciseInput): number {
  if (input.kind === 'reps') {
    return calcRepsCalories(input.reps ?? 0, input.weightKg, input.factor ?? 0);
  }
  if (input.kind === 'weight') {
    return calcWeightCalories(input.loadKg ?? 0, input.reps ?? 0, input.factor ?? 0);
  }
  return calcCalories(input.met, input.weightKg, input.durationMin ?? 0);
}

/** 新增运动：以当前体重为快照计算并写入（决策 #12 数据流原则） */
export async function addExercise(params: ExerciseInput): Promise<number> {
  const calories = calcExerciseCalories(params);
  const durationMin = params.kind === 'duration' ? params.durationMin ?? 0 : 0;
  const db = getDb();
  const result = await db.runAsync(
    `INSERT INTO exercise_log (date, sport_type, duration_min, rep_count, load_weight, met_value, weight_used, calories, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params.date,
    params.sportType,
    durationMin,
    params.reps ?? null,
    params.loadKg ?? null,
    params.met,
    params.weightKg,
    calories,
    new Date().toISOString()
  );
  return result.lastInsertRowId;
}

/** 编辑运动：重新计算热量，weight_used 更新为编辑时当前体重 */
export async function updateExercise(id: number, params: ExerciseInput): Promise<void> {
  const calories = calcExerciseCalories(params);
  const durationMin = params.kind === 'duration' ? params.durationMin ?? 0 : 0;
  const db = getDb();
  await db.runAsync(
    `UPDATE exercise_log SET sport_type=?, duration_min=?, rep_count=?, load_weight=?, met_value=?, weight_used=?, calories=? WHERE id=?`,
    params.sportType,
    durationMin,
    params.reps ?? null,
    params.loadKg ?? null,
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
