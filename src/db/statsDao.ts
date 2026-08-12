import { getDb } from './database';
import { getExercisesBetween } from './exerciseLogDao';
import { getWeekStartDate, toDateKey, todayKey } from '../utils/date';
import { round1 } from '../utils/calc';

export interface Stats {
  totalRecords: number;
  totalCalories: number;
  distinctSports: number;
  activeDates: Set<string>;
  weightRecordCount: number;
  firstRecordDate: string | null;
}

/** 成就 / 统计汇总数据 */
export async function getStats(): Promise<Stats> {
  const db = getDb();
  const rec = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM exercise_log'
  );
  const cal = await db.getFirstAsync<{ s: number }>(
    'SELECT COALESCE(SUM(calories),0) AS s FROM exercise_log'
  );
  const sports = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(DISTINCT sport_type) AS c FROM exercise_log'
  );
  const dates = await db.getAllAsync<{ date: string }>(
    'SELECT DISTINCT date FROM exercise_log'
  );
  const wc = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM weight_records'
  );
  const first = await db.getFirstAsync<{ d: string }>(
    'SELECT MIN(date) AS d FROM exercise_log'
  );
  return {
    totalRecords: rec?.c ?? 0,
    totalCalories: cal?.s ?? 0,
    distinctSports: sports?.c ?? 0,
    activeDates: new Set(dates.map((r) => r.date)),
    weightRecordCount: wc?.c ?? 0,
    firstRecordDate: first?.d ?? null,
  };
}

/** 连续运动天数：从今天（或昨天）往前数 */
export function calcStreak(activeDates: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  if (!activeDates.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (activeDates.has(toDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** 本周（周一起）运动天数与总消耗 */
export async function getWeekStats(): Promise<{ days: number; kcal: number }> {
  const start = getWeekStartDate();
  const logs = await getExercisesBetween(toDateKey(start), todayKey());
  const days = new Set(logs.map((l) => l.date)).size;
  const kcal = round1(logs.reduce((s, l) => s + l.calories, 0));
  return { days, kcal };
}

/** 清空全部业务数据（个人资料/体重/运动/自定义运动） */
export async function clearAllData(): Promise<void> {
  const db = getDb();
  await db.execAsync(
    'DELETE FROM user_profile; DELETE FROM weight_records; DELETE FROM exercise_log; DELETE FROM custom_sports;'
  );
}
