/** 运动计算模式 */
export type SportKind = 'duration' | 'reps' | 'weight';

/** 内置运动清单（策划书 §2.1.1，固定，不可删除） */
export interface SportInfo {
  name: string;
  met: number; // 时长型用（MET）
  kind: SportKind;
  emoji: string; // 运动图标（扁平可爱风格，V1 用 emoji 零资源成本）
  note?: string;
  repFactor?: number; // 次数型：kcal = 次数 × 体重(kg) × repFactor
  weightFactor?: number; // 重量型：kcal = 重量(kg) × 次数 × weightFactor
  addBodyWeight?: boolean; // 重量型：是否计入体重（如深蹲含自重）
}

export const BUILTIN_SPORTS: SportInfo[] = [
  // ── 有氧（按时长）──
  { name: '跑步', met: 8.0, kind: 'duration', emoji: '🏃', note: '约 8km/h 慢跑' },
  { name: '快走', met: 5.0, kind: 'duration', emoji: '🚶', note: '约 6km/h' },
  { name: '游泳', met: 6.0, kind: 'duration', emoji: '🏊', note: '慢速自由泳' },
  { name: '骑行', met: 6.8, kind: 'duration', emoji: '🚴', note: '16-19km/h' },
  { name: '跳绳', met: 8.0, kind: 'duration', emoji: '🤸', note: '中等速度' },
  { name: '瑜伽', met: 2.5, kind: 'duration', emoji: '🧘', note: '哈他瑜伽' },
  { name: '爬楼梯', met: 4.0, kind: 'duration', emoji: '🪜', note: '一般上楼梯' },
  { name: '健身操', met: 5.0, kind: 'duration', emoji: '💃', note: '中等强度有氧操' },
  { name: '开合跳', met: 6.0, kind: 'duration', emoji: '🤾', note: '中高强度' },
  { name: '拉伸', met: 2.3, kind: 'duration', emoji: '🧘‍♂️', note: '全身拉伸放松' },
  // ── 静力（按时长）──
  { name: '平板支撑', met: 3.0, kind: 'duration', emoji: '🧎', note: '核心训练' },
  // ── 次数（自重训练）──
  { name: '仰卧起坐', met: 3.8, kind: 'reps', repFactor: 0.02, emoji: '🧍', note: '按次数' },
  { name: '俯卧撑', met: 3.8, kind: 'reps', repFactor: 0.04, emoji: '🙌', note: '按次数' },
  { name: '卷腹', met: 3.8, kind: 'reps', repFactor: 0.02, emoji: '🧘‍♀️', note: '按次数' },
  { name: '引体向上', met: 8.0, kind: 'reps', repFactor: 0.03, emoji: '💪', note: '按次数' },
  { name: '哑铃弯举', met: 3.5, kind: 'reps', repFactor: 0.01, emoji: '🏋️', note: '按次数' },
  // ── 次数（可选配重）──
  { name: '卧推', met: 3.8, kind: 'weight', weightFactor: 0.02, emoji: '🏋️', note: '可选重量' },
  { name: '深蹲', met: 5.0, kind: 'weight', weightFactor: 0.02, addBodyWeight: true, emoji: '🦵', note: '含自重+可选配重' },
  { name: '硬拉', met: 5.0, kind: 'weight', weightFactor: 0.02, emoji: '🏋️', note: '可选重量' },
];

export function builtinMetByName(name: string): number | undefined {
  return BUILTIN_SPORTS.find((s) => s.name === name)?.met;
}

export function builtinEmojiByName(name: string): string {
  return BUILTIN_SPORTS.find((s) => s.name === name)?.emoji ?? '🏅';
}

/** 按名称返回计算模式（自定义运动默认为时长型） */
export function getSportKindByName(name: string): SportKind {
  return BUILTIN_SPORTS.find((s) => s.name === name)?.kind ?? 'duration';
}

/** 按名称返回次数型/重量型系数 */
export function getSportFactor(name: string): number {
  const s = BUILTIN_SPORTS.find((x) => x.name === name);
  if (s?.kind === 'reps') return s.repFactor ?? 0;
  if (s?.kind === 'weight') return s.weightFactor ?? 0;
  return 0;
}

/** 重量型运动是否计入体重（如深蹲含自重） */
export function getSportAddBodyWeight(name: string): boolean {
  return BUILTIN_SPORTS.find((s) => s.name === name)?.addBodyWeight ?? false;
}

export function getMetForSport(name: string, custom: { name: string; met: number }[]): number {
  const builtin = builtinMetByName(name);
  if (builtin !== undefined) return builtin;
  return custom.find((c) => c.name === name)?.met ?? 0;
}
