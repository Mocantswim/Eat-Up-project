import { getDb } from './database';

export interface UserProfile {
  id: number;
  weight: number | null;
  height: number | null;
  age: number | null;
  gender: 'male' | 'female' | null;
  updatedAt: string | null;
  weeklyGoalDays: number | null;
  weeklyGoalKcal: number | null;
}

interface UserProfileRow {
  id: number;
  weight: number | null;
  height: number | null;
  age: number | null;
  gender: 'male' | 'female' | null;
  updated_at: string | null;
  weekly_goal_days: number | null;
  weekly_goal_kcal: number | null;
}

function mapRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    weight: row.weight,
    height: row.height,
    age: row.age,
    gender: row.gender,
    updatedAt: row.updated_at,
    weeklyGoalDays: row.weekly_goal_days,
    weeklyGoalKcal: row.weekly_goal_kcal,
  };
}

export const DEFAULT_GOAL_DAYS = 3;
export const DEFAULT_GOAL_KCAL = 1000;

export async function getProfile(): Promise<UserProfile | null> {
  const db = getDb();
  const row = await db.getFirstAsync<UserProfileRow>(
    'SELECT id, weight, height, age, gender, updated_at, weekly_goal_days, weekly_goal_kcal FROM user_profile WHERE id = 1'
  );
  return row ? mapRow(row) : null;
}

export async function saveProfile(data: {
  weight: number | null;
  height: number | null;
  age: number | null;
  gender: 'male' | 'female' | null;
  weeklyGoalDays?: number | null;
  weeklyGoalKcal?: number | null;
}): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = await getProfile();
  const days = data.weeklyGoalDays ?? existing?.weeklyGoalDays ?? DEFAULT_GOAL_DAYS;
  const kcal = data.weeklyGoalKcal ?? existing?.weeklyGoalKcal ?? DEFAULT_GOAL_KCAL;
  if (existing) {
    await db.runAsync(
      `UPDATE user_profile SET weight=?, height=?, age=?, gender=?, weekly_goal_days=?, weekly_goal_kcal=?, updated_at=? WHERE id=1`,
      data.weight,
      data.height,
      data.age,
      data.gender,
      days,
      kcal,
      now
    );
  } else {
    await db.runAsync(
      `INSERT INTO user_profile (id, weight, height, age, gender, weekly_goal_days, weekly_goal_kcal, updated_at) VALUES (1,?,?,?,?,?,?,?)`,
      data.weight,
      data.height,
      data.age,
      data.gender,
      days,
      kcal,
      now
    );
  }
}

/** 首启引导是否完成：存在有效体重即视为完成 */
export async function hasProfile(): Promise<boolean> {
  const p = await getProfile();
  return p != null && p.weight != null && p.weight > 0;
}
