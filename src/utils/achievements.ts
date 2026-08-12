import { calcStreak, getStats, type Stats } from '../db/statsDao';

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  unlocked: boolean;
  progress: string;
}

interface Def {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  check: (s: Stats, streak: number) => boolean;
  progress: (s: Stats, streak: number) => string;
}

const DEFS: Def[] = [
  { id: 'first', emoji: '🎖️', title: '迈出第一步', desc: '记录第一条运动', check: (s) => s.totalRecords >= 1, progress: (s) => `${Math.min(s.totalRecords, 1)}/1` },
  { id: 'rec5', emoji: '💪', title: '小试牛刀', desc: '累计记录 5 条运动', check: (s) => s.totalRecords >= 5, progress: (s) => `${Math.min(s.totalRecords, 5)}/5` },
  { id: 'rec20', emoji: '🏃', title: '运动达人', desc: '累计记录 20 条运动', check: (s) => s.totalRecords >= 20, progress: (s) => `${Math.min(s.totalRecords, 20)}/20` },
  { id: 'rec100', emoji: '🗿', title: '百炼成钢', desc: '累计记录 100 条运动', check: (s) => s.totalRecords >= 100, progress: (s) => `${Math.min(s.totalRecords, 100)}/100` },
  { id: 'cal5k', emoji: '🔥', title: '热量新手', desc: '累计消耗 5000 千卡', check: (s) => s.totalCalories >= 5000, progress: (s) => `${Math.round(Math.min(s.totalCalories, 5000))}/5000` },
  { id: 'cal20k', emoji: '🏆', title: '燃烧机器', desc: '累计消耗 20000 千卡', check: (s) => s.totalCalories >= 20000, progress: (s) => `${Math.round(Math.min(s.totalCalories, 20000))}/20000` },
  { id: 'streak3', emoji: '📅', title: '坚持 3 天', desc: '连续运动 3 天', check: (_s, st) => st >= 3, progress: (_s, st) => `${Math.min(st, 3)}/3` },
  { id: 'streak7', emoji: '7️⃣', title: '一周挑战', desc: '连续运动 7 天', check: (_s, st) => st >= 7, progress: (_s, st) => `${Math.min(st, 7)}/7` },
  { id: 'streak30', emoji: '🏅', title: '月度传奇', desc: '连续运动 30 天', check: (_s, st) => st >= 30, progress: (_s, st) => `${Math.min(st, 30)}/30` },
  { id: 'sports5', emoji: '🧩', title: '全能选手', desc: '记录过 5 种不同运动', check: (s) => s.distinctSports >= 5, progress: (s) => `${Math.min(s.distinctSports, 5)}/5` },
  { id: 'weigh1', emoji: '⚖️', title: '上秤初体验', desc: '首次记录体重', check: (s) => s.weightRecordCount >= 1, progress: (s) => `${Math.min(s.weightRecordCount, 1)}/1` },
  { id: 'weigh3', emoji: '📉', title: '坚持上秤', desc: '累计记录体重 3 次', check: (s) => s.weightRecordCount >= 3, progress: (s) => `${Math.min(s.weightRecordCount, 3)}/3` },
];

export async function getAchievements(): Promise<Achievement[]> {
  const s = await getStats();
  const streak = calcStreak(s.activeDates);
  return DEFS.map((d) => ({
    id: d.id,
    emoji: d.emoji,
    title: d.title,
    desc: d.desc,
    unlocked: d.check(s, streak),
    progress: d.progress(s, streak),
  }));
}
