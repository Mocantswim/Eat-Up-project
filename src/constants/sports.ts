/** 内置运动清单（策划书 §2.1.1，固定 10 种，不可删除） */
export interface SportInfo {
  name: string;
  met: number;
  emoji: string; // 运动图标（扁平可爱风格，V1 用 emoji 零资源成本）
  note?: string;
}

export const BUILTIN_SPORTS: SportInfo[] = [
  { name: '跑步', met: 8.0, emoji: '🏃', note: '约 8km/h 慢跑' },
  { name: '快走', met: 5.0, emoji: '🚶', note: '约 6km/h' },
  { name: '游泳', met: 6.0, emoji: '🏊', note: '慢速自由泳' },
  { name: '骑行', met: 6.8, emoji: '🚴', note: '16-19km/h' },
  { name: '跳绳', met: 8.0, emoji: '🤸', note: '中等速度' },
  { name: '瑜伽', met: 2.5, emoji: '🧘', note: '哈他瑜伽' },
  { name: '爬楼梯', met: 4.0, emoji: '🪜', note: '一般上楼梯' },
  { name: '健身操', met: 5.0, emoji: '💃', note: '中等强度有氧操' },
  { name: '仰卧起坐', met: 3.8, emoji: '🧍', note: '中等强度' },
  { name: '俯卧撑', met: 3.8, emoji: '🙌', note: '中等强度' },
];

export function builtinMetByName(name: string): number | undefined {
  return BUILTIN_SPORTS.find((s) => s.name === name)?.met;
}

export function builtinEmojiByName(name: string): string {
  return BUILTIN_SPORTS.find((s) => s.name === name)?.emoji ?? '🏅';
}

export function getMetForSport(name: string, custom: { name: string; met: number }[]): number {
  const builtin = builtinMetByName(name);
  if (builtin !== undefined) return builtin;
  return custom.find((c) => c.name === name)?.met ?? 0;
}
