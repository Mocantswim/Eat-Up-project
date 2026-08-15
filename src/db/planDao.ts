import { getDb } from './database';
import type { SportKind } from '../constants/sports';
import { round1 } from '../utils/calc';
import { addExercise, type ExerciseInput } from './exerciseLogDao';

export interface WorkoutPlan {
  id: number;
  name: string;
  days: number[] | null; // 绑定星期 [1,3,5]（1=周一），null=通用模板
  createdAt: string;
  updatedAt: string;
}

export interface PlanItem {
  id: number;
  planId: number;
  sportName: string;
  kind: SportKind;
  met: number;
  factor: number | null;
  sets: number;
  target: number; // 单组目标：次数/分钟/距离km
  loadKg: number | null;
  estMinutes: number | null;
  sortOrder: number;
}

interface PlanRow { id: number; name: string; days: string | null; created_at: string; updated_at: string; }
interface PlanItemRow {
  id: number; plan_id: number; sport_name: string; kind: SportKind;
  met: number; factor: number | null; sets: number; target: number;
  load_kg: number | null; est_minutes: number | null; sort_order: number;
}

function mapPlan(r: PlanRow): WorkoutPlan {
  return {
    id: r.id,
    name: r.name,
    days: r.days ? r.days.split(',').map(Number) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
function mapItem(r: PlanItemRow): PlanItem {
  return {
    id: r.id, planId: r.plan_id, sportName: r.sport_name, kind: r.kind,
    met: r.met, factor: r.factor, sets: r.sets, target: r.target,
    loadKg: r.load_kg, estMinutes: r.est_minutes, sortOrder: r.sort_order,
  };
}

export async function getAllPlans(): Promise<WorkoutPlan[]> {
  const rows = await getDb().getAllAsync<PlanRow>(
    'SELECT * FROM workout_plans ORDER BY updated_at DESC'
  );
  return rows.map(mapPlan);
}

export async function getPlanItems(planId: number): Promise<PlanItem[]> {
  const rows = await getDb().getAllAsync<PlanItemRow>(
    'SELECT * FROM workout_plan_items WHERE plan_id = ? ORDER BY sort_order',
    planId
  );
  return rows.map(mapItem);
}

export async function addPlan(name: string, days: number[] | null): Promise<number> {
  const now = new Date().toISOString();
  const r = await getDb().runAsync(
    'INSERT INTO workout_plans (name, days, created_at, updated_at) VALUES (?,?,?,?)',
    name,
    days && days.length ? days.join(',') : null,
    now,
    now
  );
  return r.lastInsertRowId;
}

export async function updatePlan(id: number, name: string, days: number[] | null): Promise<void> {
  await getDb().runAsync(
    'UPDATE workout_plans SET name=?, days=?, updated_at=? WHERE id=?',
    name,
    days && days.length ? days.join(',') : null,
    new Date().toISOString(),
    id
  );
}

export async function deletePlan(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM workout_plan_items WHERE plan_id = ?', id);
  await db.runAsync('DELETE FROM workout_plans WHERE id = ?', id);
}

export async function replacePlanItems(planId: number, items: Omit<PlanItem, 'id' | 'planId'>[]): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM workout_plan_items WHERE plan_id = ?', planId);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await db.runAsync(
      `INSERT INTO workout_plan_items (plan_id, sport_name, kind, met, factor, sets, target, load_kg, est_minutes, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      planId, it.sportName, it.kind, it.met, it.factor, it.sets, it.target,
      it.loadKg, it.estMinutes, i
    );
  }
}

/** 预估单动作热量（组数折算：次数/时长/距离/重量 均 × 组数） */
export function estimateItemCalories(item: PlanItem, weightKg: number): number {
  const s = item.sets || 1;
  if (item.kind === 'reps') return round1(s * item.target * weightKg * (item.factor ?? 0));
  if (item.kind === 'duration') return round1(item.met * weightKg * ((item.estMinutes ?? item.target) / 60));
  if (item.kind === 'distance') return round1(s * item.target * weightKg * (item.factor ?? 0));
  // weight：重量 × (组数×次数) × 系数
  return round1((item.loadKg ?? 0) * s * item.target * (item.factor ?? 0));
}

/** 一键添加：把计划动作批量转为当天普通运动记录（组数折算） */
export async function applyPlanToDate(planId: number, date: string, weightKg: number): Promise<number> {
  const items = await getPlanItems(planId);
  for (const it of items) {
    const s = it.sets || 1;
    let input: ExerciseInput;
    if (it.kind === 'reps') {
      input = { date, sportType: it.sportName, kind: 'reps', reps: s * it.target, met: it.met, factor: it.factor ?? 0, weightKg };
    } else if (it.kind === 'duration') {
      input = { date, sportType: it.sportName, kind: 'duration', durationMin: s * (it.estMinutes ?? it.target), met: it.met, weightKg };
    } else if (it.kind === 'distance') {
      input = { date, sportType: it.sportName, kind: 'distance', distance: s * it.target, met: it.met, factor: it.factor ?? 0, weightKg };
    } else {
      input = { date, sportType: it.sportName, kind: 'weight', loadKg: it.loadKg ?? 0, reps: s * it.target, met: it.met, factor: it.factor ?? 0, weightKg };
    }
    await addExercise(input);
  }
  return items.length;
}
