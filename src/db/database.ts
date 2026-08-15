import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('shiguang.db');
  }
  return db;
}

/** 初始化建表（幂等，兼容重复启动） */
export async function initDatabase(): Promise<void> {
  const database = getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    -- 用户资料（单行，id 恒为 1）
    CREATE TABLE IF NOT EXISTS user_profile (
      id          INTEGER PRIMARY KEY CHECK (id = 1),
      weight      REAL,              -- 当前体重 kg（新增运动时使用）
      height      REAL,              -- 身高 cm（BMI/BMR）
      age         INTEGER,
      gender      TEXT,              -- 'male' | 'female' | NULL
      updated_at  TEXT
    );

    -- 体重记录（趋势图用，与当前体重解耦；date 唯一，同日 upsert 覆盖）
    CREATE TABLE IF NOT EXISTS weight_records (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      date    TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD
      weight  REAL NOT NULL
    );

    -- 运动记录（全字段快照：修改体重/自定义运动不影响历史数据）
    CREATE TABLE IF NOT EXISTS exercise_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      date          TEXT NOT NULL,   -- YYYY-MM-DD
      sport_type    TEXT NOT NULL,   -- 运动名称（自定义删除后历史仍显示）
      duration_min  REAL NOT NULL,   -- 分钟（时长型运动）
      met_value     REAL NOT NULL,   -- 计算时 MET 快照
      weight_used   REAL NOT NULL,   -- 计算时体重快照
      calories      REAL NOT NULL,   -- 消耗 kcal（1 位小数）
      created_at    TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_exercise_log_date ON exercise_log (date);

    -- 自定义运动
    CREATE TABLE IF NOT EXISTS custom_sports (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      met_value  REAL NOT NULL
    );

    -- 训练计划（批量添加快捷方式，非独立模块）
    CREATE TABLE IF NOT EXISTS workout_plans (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      days        TEXT,              -- 绑定星期 '1,3,5'（1=周一）；NULL=通用模板
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    -- 计划动作
    CREATE TABLE IF NOT EXISTS workout_plan_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id     INTEGER NOT NULL,
      sport_name  TEXT NOT NULL,     -- 动作名
      kind        TEXT NOT NULL,     -- duration/reps/weight/distance
      met         REAL NOT NULL,     -- 系数快照（预估热量）
      factor      REAL,              -- rep/weight/distance 系数
      sets        INTEGER NOT NULL DEFAULT 1, -- 组数
      target      REAL NOT NULL,     -- 单组目标：次数/分钟/距离km
      load_kg     REAL,              -- 重量型
      est_minutes REAL,              -- 预计时长（分钟）
      sort_order  INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_plan_items_plan ON workout_plan_items (plan_id);
  `);

  await migrateUserProfileGoals(database);
  await migrateExerciseLogFields(database);
  await migrateCustomSportsKind(database);
  await migrateExerciseLogKind(database);
  await migrateExerciseLogNote(database);
  await migrateExerciseLogDistance(database);
  await migrateCustomSportsParams(database);
}

/** V2 迁移：user_profile 增加每周目标列（幂等） */
async function migrateUserProfileGoals(database: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(user_profile)'
  );
  if (!cols.some((c) => c.name === 'weekly_goal_days')) {
    await database.execAsync('ALTER TABLE user_profile ADD COLUMN weekly_goal_days INTEGER');
  }
  if (!cols.some((c) => c.name === 'weekly_goal_kcal')) {
    await database.execAsync('ALTER TABLE user_profile ADD COLUMN weekly_goal_kcal REAL');
  }
}

/** V2 迁移：custom_sports 增加计算模式与每单位热量列 */
async function migrateCustomSportsKind(database: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(custom_sports)'
  );
  if (!cols.some((c) => c.name === 'kind')) {
    await database.execAsync(
      "ALTER TABLE custom_sports ADD COLUMN kind TEXT DEFAULT 'duration'"
    );
  }
  if (!cols.some((c) => c.name === 'per_unit_kcal')) {
    await database.execAsync('ALTER TABLE custom_sports ADD COLUMN per_unit_kcal REAL');
  }
}

/** V2 迁移：exercise_log 增加次数/重量列（次数型、重量型运动，幂等） */
async function migrateExerciseLogFields(database: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(exercise_log)'
  );
  if (!cols.some((c) => c.name === 'rep_count')) {
    await database.execAsync('ALTER TABLE exercise_log ADD COLUMN rep_count REAL');
  }
  if (!cols.some((c) => c.name === 'load_weight')) {
    await database.execAsync('ALTER TABLE exercise_log ADD COLUMN load_weight REAL');
  }
}

/** V2 迁移：exercise_log 增加模式与每单位热量列（历史数据快照） */
async function migrateExerciseLogKind(database: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(exercise_log)'
  );
  if (!cols.some((c) => c.name === 'kind')) {
    await database.execAsync(
      "ALTER TABLE exercise_log ADD COLUMN kind TEXT DEFAULT 'duration'"
    );
  }
  if (!cols.some((c) => c.name === 'per_unit_kcal')) {
    await database.execAsync('ALTER TABLE exercise_log ADD COLUMN per_unit_kcal REAL');
  }
}

/** V2 迁移：exercise_log 增加备注列（运动笔记） */
async function migrateExerciseLogNote(database: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(exercise_log)'
  );
  if (!cols.some((c) => c.name === 'note')) {
    await database.execAsync('ALTER TABLE exercise_log ADD COLUMN note TEXT');
  }
}

/** V2 迁移：exercise_log 增加距离列（距离型运动，如跑步按 km） */
async function migrateExerciseLogDistance(database: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(exercise_log)'
  );
  if (!cols.some((c) => c.name === 'distance')) {
    await database.execAsync('ALTER TABLE exercise_log ADD COLUMN distance REAL');
  }
}

/** V2 迁移：custom_sports 增加距离/重量换算参数 */
async function migrateCustomSportsParams(database: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(custom_sports)'
  );
  if (!cols.some((c) => c.name === 'distance_kcal')) {
    await database.execAsync('ALTER TABLE custom_sports ADD COLUMN distance_kcal REAL');
  }
  if (!cols.some((c) => c.name === 'weight_factor')) {
    await database.execAsync('ALTER TABLE custom_sports ADD COLUMN weight_factor REAL');
  }
}
