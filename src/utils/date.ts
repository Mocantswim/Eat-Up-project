/** 日期工具：全部基于本地时区，键格式 YYYY-MM-DD */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 某年某月（0 基月）的天数 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** 周一到周日 */
export const WEEK_NAMES = ['一', '二', '三', '四', '五', '六', '日'] as const;

/** 某日星期（0=周一 … 6=周日），用于月历网格定位 */
export function weekdayIndex(y: number, m: number, d: number): number {
  const wd = new Date(y, m, d).getDay(); // 0=周日
  return wd === 0 ? 6 : wd - 1;
}

export function monthKeyOf(year: number, month: number): string {
  return `${year}-${pad2(month + 1)}`;
}

export function monthTitle(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

/** 详情页标题，如 { month: 8, day: 11, weekName: '周二' } */
export function dayTitle(key: string): { month: number; day: number; weekName: string } {
  const d = fromDateKey(key);
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return { month: d.getMonth() + 1, day: d.getDate(), weekName: names[d.getDay()] };
}

/** 近 N 个月区间（含当月），返回 [startKey, endKey]，endKey 为今天 */
export function recentRange(months: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
  return { start, end };
}

/** 本周起始日（周一为起点） */
export function getWeekStartDate(d: Date = new Date()): Date {
  const day = d.getDay(); // 0=周日
  const offset = day === 0 ? 6 : day - 1;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
}
