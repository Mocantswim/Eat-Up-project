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
      duration_min  REAL NOT NULL,   -- 分钟
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
  `);

  await migrateUserProfileGoals(database);
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
