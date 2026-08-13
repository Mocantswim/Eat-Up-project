import { getDb } from './database';
import { calcCalories, calcDistanceCalories, calcRepsCalories, calcWeightCalories, round1 } from '../utils/calc';
import { getSportKindByName, type SportKind } from '../constants/sports';

export interface ExerciseLog {
  id: number;
  date: string;
  sportType: string;
  kind: SportKind;
  durationMin: number; // 时长型分钟（次数/重量型为 0）
  reps: number | null; // 次数（次数/重量型）
  loadKg: number | null; // 重量（重量型）
  distance: number | null; // 距离 km（距离型）
  metValue: number;
  weightUsed: number;
  perUnitKcal: number | null; // 次数型自定义：每 1 个消耗 kcal
  note: string | null; // 运动笔记（选填）
  calories: number;
  createdAt: string;
}

interface ExerciseLogRow {
  id: number;
  date: string;
  sport_type: string;
  kind: SportKind;
  duration_min: number;
  rep_count: number | null;
  load_weight: number | null;
  distance: number | null;
  met_value: number;
  weight_used: number;
  per_unit_kcal: number | null;
  note: string | null;
  calories: number;
  created_at: string;
}

function mapRow(r: ExerciseLogRow): ExerciseLog {
  return {
    id: r.id,
    date: r.date,
    sportType: r.sport_type,
    kind: (r.kind as SportKind) || getSportKindByName(r.sport_type),
    durationMin: r.duration_min,
    reps: r.rep_count ?? null,
    loadKg: r.load_weight ?? null,
    distance: r.distance ?? null,
    metValue: r.met_value,
    weightUsed: r.weight_used,
    perUnitKcal: r.per_unit_kcal ?? null,
    note: r.note ?? null,
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
  distance?: number | null; // 距离 km（距离型）
  met: number;
  factor?: number; // 次数/重量型的换算系数
  perUnitKcal?: number | null; // 次数型自定义：每 1 个消耗 kcal
  addBodyWeight?: boolean; // 重量型：是否计入体重（如深蹲含自重）
  note?: string | null; // 运动笔记（选填，≤100字）
  weightKg: number;
}

/** 根据运动模式计算热量 */
export function calcExerciseCalories(input: ExerciseInput): number {
  if (input.kind === 'reps') {
    // 自定义次数型：次数 × 每单位 kcal；内置次数型：次数 × 体重 × 系数
    if (input.perUnitKcal) return round1((input.reps ?? 0) * input.perUnitKcal);
    return calcRepsCalories(input.reps ?? 0, input.weightKg, input.factor ?? 0);
  }
  if (input.kind === 'weight') {
    // 深蹲等含自重：总重量 = 配重 + 体重
    const base = input.addBodyWeight
      ? (input.loadKg ?? 0) + input.weightKg
      : (input.loadKg ?? 0);
    return calcWeightCalories(base, input.reps ?? 0, input.factor ?? 0);
  }
  if (input.kind === 'distance') {
    return calcDistanceCalories(input.distance ?? 0, input.weightKg, input.factor ?? 0);
  }
  return calcCalories(input.met, input.weightKg, input.durationMin ?? 0);
}

/** 新增运动：以当前体重为快照计算并写入（决策 #12 数据流原则） */
export async function addExercise(params: ExerciseInput): Promise<number> {
  const calories = calcExerciseCalories(params);
  const durationMin = params.kind === 'duration' ? params.durationMin ?? 0 : 0;
  const db = getDb();
  const result = await db.runAsync(
    `INSERT INTO exercise_log (date, sport_type, kind, duration_min, rep_count, load_weight, distance, met_value, weight_used, per_unit_kcal, note, calories, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params.date,
    params.sportType,
    params.kind,
    durationMin,
    params.reps ?? null,
    params.loadKg ?? null,
    params.distance ?? null,
    params.met,
    params.weightKg,
    params.perUnitKcal ?? null,
    params.note ?? null,
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
    `UPDATE exercise_log SET sport_type=?, kind=?, duration_min=?, rep_count=?, load_weight=?, distance=?, met_value=?, weight_used=?, per_unit_kcal=?, note=?, calories=? WHERE id=?`,
    params.sportType,
    params.kind,
    durationMin,
    params.reps ?? null,
    params.loadKg ?? null,
    params.distance ?? null,
    params.met,
    params.weightKg,
    params.perUnitKcal ?? null,
    params.note ?? null,
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
