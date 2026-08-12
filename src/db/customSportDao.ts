import { getDb } from './database';
import type { SportKind } from '../constants/sports';

export interface CustomSport {
  id: number;
  name: string;
  metValue: number;
  kind: SportKind;
  perUnitKcal: number | null; // 次数型：每 1 个消耗 kcal
}

interface CustomSportRow {
  id: number;
  name: string;
  met_value: number;
  kind: SportKind;
  per_unit_kcal: number | null;
}

function mapRow(r: CustomSportRow): CustomSport {
  return {
    id: r.id,
    name: r.name,
    metValue: r.met_value,
    kind: r.kind ?? 'duration',
    perUnitKcal: r.per_unit_kcal ?? null,
  };
}

export async function getAllCustomSports(): Promise<CustomSport[]> {
  const db = getDb();
  const rows = await db.getAllAsync<CustomSportRow>(
    'SELECT id, name, met_value, kind, per_unit_kcal FROM custom_sports ORDER BY name ASC'
  );
  return rows.map(mapRow);
}

export async function addCustomSport(
  name: string,
  metValue: number,
  kind: SportKind = 'duration',
  perUnitKcal?: number | null
): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    'INSERT INTO custom_sports (name, met_value, kind, per_unit_kcal) VALUES (?, ?, ?, ?)',
    name,
    metValue,
    kind,
    perUnitKcal ?? null
  );
  return result.lastInsertRowId;
}

export async function updateCustomSport(
  id: number,
  name: string,
  metValue: number,
  kind: SportKind = 'duration',
  perUnitKcal?: number | null
): Promise<void> {
  const db = getDb();
  await db.runAsync(
    'UPDATE custom_sports SET name = ?, met_value = ?, kind = ?, per_unit_kcal = ? WHERE id = ?',
    name,
    metValue,
    kind,
    perUnitKcal ?? null,
    id
  );
}

/** 删除自定义运动：仅移除选择列表，历史运动记录保留（快照机制） */
export async function deleteCustomSport(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM custom_sports WHERE id = ?', id);
}

/** 名称唯一性校验（编辑时排除自身） */
export async function customSportNameExists(name: string, excludeId?: number): Promise<boolean> {
  const db = getDb();
  const rows = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM custom_sports WHERE name = ? AND id != ?',
    name,
    excludeId ?? -1
  );
  return rows.length > 0;
}
