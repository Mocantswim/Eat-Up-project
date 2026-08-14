import { BACK_TYPES } from './sports-data-back';
import { SHOULDER_TYPES } from './sports-data-shoulder';
import { ARMS_TYPES } from './sports-data-arms';
import { CORE_TYPES } from './sports-data-core';
import { LEGS_TYPES } from './sports-data-legs';
import { COMPOUND_TYPES } from './sports-data-compound';

/** 运动计算模式 */
export type SportKind = 'duration' | 'reps' | 'weight' | 'distance';

/** 肌群（从上到下排列） */
export interface MuscleGroup {
  id: string;
  name: string;
  emoji: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'shoulder', name: '肩部', emoji: '🫀' },
  { id: 'chest', name: '胸部', emoji: '🫀' },
  { id: 'back', name: '背部', emoji: '🦅' },
  { id: 'triceps', name: '三头', emoji: '💪' },
  { id: 'biceps', name: '二头', emoji: '💪' },
  { id: 'forearm', name: '前臂', emoji: '🤛' },
  { id: 'core', name: '腹部', emoji: '🔥' },
  { id: 'legs', name: '腿部', emoji: '🦵' },
  { id: 'glutes', name: '臀部', emoji: '🍑' },
  { id: 'cardio', name: '有氧', emoji: '🏃' },
  { id: 'compound', name: '全身', emoji: '🤸' },
];

/** 变体（具体动作），可覆盖类型默认参数 */
export interface VariantDef {
  name: string; // 具体动作名，如 '钻石俯卧撑'
  kind?: SportKind;
  modes?: SportKind[];
  met?: number; // 强度差异化（时长型）
  repFactor?: number;
  weightFactor?: number;
  addBodyWeight?: boolean;
  distanceFactor?: number;
  note?: string;
}

/** 运动类型（中类） */
export interface ExerciseTypeDef {
  typeName: string;
  emoji: string;
  groupId: string;
  kind: SportKind; // 默认记录方式
  modes: SportKind[];
  met: number;
  repFactor?: number;
  weightFactor?: number;
  addBodyWeight?: boolean;
  distanceFactor?: number;
  aliases?: string; // 搜索别名
  variants: VariantDef[];
}

/** 扁平化后的具体动作项（与现有记录逻辑兼容 + 分类/搜索元数据） */
export interface SportItem {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  typeName: string;
  kind: SportKind;
  modes: SportKind[];
  met: number;
  emoji: string;
  note?: string;
  repFactor?: number;
  weightFactor?: number;
  addBodyWeight?: boolean;
  distanceFactor?: number;
  searchKey: string;
}

/** 从类型表展开为扁平化动作列表 */
export function buildSportItems(types: ExerciseTypeDef[]): SportItem[] {
  const items: SportItem[] = [];
  for (const t of types) {
    const group = MUSCLE_GROUPS.find((g) => g.id === t.groupId);
    const gname = group?.name ?? '其他';
    for (const v of t.variants) {
      items.push({
        id: `${t.groupId}-${v.name}`,
        name: v.name,
        groupId: t.groupId,
        groupName: gname,
        typeName: t.typeName,
        kind: v.kind ?? t.kind,
        modes: v.modes ?? t.modes,
        met: v.met ?? t.met,
        emoji: t.emoji,
        note: v.note ?? t.note ?? t.aliases,
        repFactor: v.repFactor ?? t.repFactor,
        weightFactor: v.weightFactor ?? t.weightFactor,
        addBodyWeight: v.addBodyWeight ?? t.addBodyWeight,
        distanceFactor: v.distanceFactor ?? t.distanceFactor,
        searchKey: `${v.name} ${t.typeName} ${gname} ${t.aliases ?? ''}`,
      });
    }
  }
  return items;
}


// ============ 运动类型表（按肌群，含具体动作变体） ============

const EXERCISE_TYPES: ExerciseTypeDef[] = [
  // ---- 有氧 ----
  { typeName: '跑步', emoji: '🏃', groupId: 'cardio', kind: 'duration', modes: ['duration', 'distance'], met: 8.0, distanceFactor: 1.0, aliases: '跑步 跑',
    variants: [
      { name: '慢跑', met: 6.0, distanceFactor: 0.8 },
      { name: '快跑', met: 10.0, distanceFactor: 1.3 },
      { name: '变速跑', met: 8.0, distanceFactor: 1.0 },
      { name: '坡度跑', met: 9.0, distanceFactor: 1.1 },
      { name: '越野跑', met: 9.0, distanceFactor: 1.1 },
    ] },
  { typeName: '快走', emoji: '🚶', groupId: 'cardio', kind: 'duration', modes: ['duration', 'distance'], met: 5.0, distanceFactor: 0.5, aliases: '走路 步行',
    variants: [{ name: '快走', met: 5.0, distanceFactor: 0.5 }] },
  { typeName: '游泳', emoji: '🏊', groupId: 'cardio', kind: 'duration', modes: ['duration', 'distance'], met: 6.0, distanceFactor: 3.0, aliases: '泳',
    variants: [
      { name: '自由泳', met: 7.0, distanceFactor: 3.5 },
      { name: '蛙泳', met: 6.0, distanceFactor: 3.0 },
      { name: '仰泳', met: 5.0, distanceFactor: 2.5 },
      { name: '蝶泳', met: 9.0, distanceFactor: 4.0 },
      { name: '水中行走', met: 3.0, distanceFactor: 1.5 },
    ] },
  { typeName: '骑行', emoji: '🚴', groupId: 'cardio', kind: 'duration', modes: ['duration', 'distance'], met: 6.8, distanceFactor: 0.4, aliases: '单车 自行车',
    variants: [
      { name: '户外骑行', met: 6.8, distanceFactor: 0.4 },
      { name: '动感单车', met: 8.0, distanceFactor: 0.5 },
      { name: '间歇骑行', met: 8.0, distanceFactor: 0.5 },
      { name: '爬坡骑行', met: 9.0, distanceFactor: 0.6 },
    ] },
  { typeName: '跳绳', emoji: '🤸', groupId: 'cardio', kind: 'duration', modes: ['duration', 'reps'], met: 8.0, repFactor: 0.01, aliases: '绳',
    variants: [
      { name: '双脚跳', met: 8.0, repFactor: 0.01 },
      { name: '单脚跳', met: 9.0, repFactor: 0.015 },
      { name: '交替跳', met: 8.0, repFactor: 0.012 },
      { name: '双摇', met: 12.0, repFactor: 0.02 },
      { name: '交叉跳', met: 9.0, repFactor: 0.015 },
    ] },
  { typeName: '划船机', emoji: '🚣', groupId: 'cardio', kind: 'duration', modes: ['duration', 'distance'], met: 7.0, distanceFactor: 0.5, aliases: '划船',
    variants: [{ name: '匀速划船' }, { name: '间歇划船' }, { name: '阻力划船' }] },
  { typeName: '椭圆机', emoji: '🚶‍♀️', groupId: 'cardio', kind: 'duration', modes: ['duration', 'distance'], met: 5.5, distanceFactor: 0.5, aliases: '椭圆',
    variants: [{ name: '正向椭圆机' }, { name: '反向椭圆机' }, { name: '高阻力椭圆机' }] },
  { typeName: '爬楼梯', emoji: '🪜', groupId: 'cardio', kind: 'duration', modes: ['duration', 'reps'], met: 4.0, repFactor: 0.08, aliases: '楼梯 爬楼 登山机',
    variants: [{ name: '爬楼梯' }, { name: '登山机' }, { name: '台阶跳' }] },
  { typeName: '有氧操', emoji: '💃', groupId: 'cardio', kind: 'duration', modes: ['duration'], met: 5.0, aliases: '健身操 搏击 踏板',
    variants: [{ name: '健身操' }, { name: '搏击操' }, { name: '踏板操' }, { name: 'Tabata' }, { name: 'HIIT' }] },
  { typeName: '舞蹈', emoji: '🕺', groupId: 'cardio', kind: 'duration', modes: ['duration'], met: 4.5, aliases: '舞',
    variants: [{ name: '尊巴' }, { name: '街舞' }, { name: '拉丁舞' }, { name: '爵士舞' }] },
  { typeName: '球类', emoji: '🏀', groupId: 'cardio', kind: 'duration', modes: ['duration'], met: 6.0, aliases: '篮球 足球 羽毛球 网球 乒乓球 球',
    variants: [{ name: '篮球' }, { name: '足球' }, { name: '羽毛球' }, { name: '网球' }, { name: '乒乓球' }] },
  { typeName: '户外', emoji: '🥾', groupId: 'cardio', kind: 'duration', modes: ['duration', 'distance'], met: 5.5, distanceFactor: 0.5, aliases: '徒步 登山 滑雪 溜冰',
    variants: [{ name: '徒步' }, { name: '登山' }, { name: '越野滑雪' }, { name: '溜冰' }] },

  // ---- 胸部 ----
  { typeName: '俯卧撑', emoji: '🙌', groupId: 'chest', kind: 'reps', modes: ['reps'], met: 3.8, repFactor: 0.04, aliases: '俯卧撑 撑',
    variants: [
      { name: '标准俯卧撑' }, { name: '宽距俯卧撑' }, { name: '窄距俯卧撑' }, { name: '钻石俯卧撑', repFactor: 0.05 },
      { name: '上斜俯卧撑' }, { name: '下斜俯卧撑' }, { name: '击掌俯卧撑', repFactor: 0.05 }, { name: '跪姿俯卧撑' },
    ] },
  { typeName: '卧推', emoji: '🏋️', groupId: 'chest', kind: 'weight', modes: ['reps', 'weight'], met: 3.8, weightFactor: 0.02, aliases: '卧推 推胸',
    variants: [
      { name: '杠铃平板卧推' }, { name: '杠铃上斜卧推' }, { name: '杠铃下斜卧推' },
      { name: '哑铃平板卧推' }, { name: '哑铃上斜卧推' }, { name: '哑铃下斜卧推' },
      { name: '器械推胸' }, { name: '史密斯机平板卧推' },
    ] },
  { typeName: '飞鸟', emoji: '🦋', groupId: 'chest', kind: 'weight', modes: ['reps', 'weight'], met: 3.2, weightFactor: 0.02, aliases: '飞鸟 夹胸 夹胸',
    variants: [
      { name: '哑铃平板飞鸟' }, { name: '哑铃上斜飞鸟' }, { name: '哑铃下斜飞鸟' },
      { name: '拉力器十字夹胸' }, { name: '蝴蝶机夹胸' }, { name: '单臂拉力器夹胸' },
    ] },
  { typeName: '双杠臂屈伸', emoji: '🤸', groupId: 'chest', kind: 'reps', modes: ['reps', 'weight'], met: 4.0, repFactor: 0.03, weightFactor: 0.02, aliases: '臂屈伸 双杠',
    variants: [{ name: '双杠臂屈伸' }, { name: '负重双杠臂屈伸' }] },
];

export const BUILTIN_SPORTS: SportItem[] = buildSportItems([
  ...EXERCISE_TYPES,
  ...BACK_TYPES,
  ...SHOULDER_TYPES,
  ...ARMS_TYPES,
  ...CORE_TYPES,
  ...LEGS_TYPES,
  ...COMPOUND_TYPES,
]);

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

/** 获取运动可用的记录模式（默认按时长） */
export function getSportModes(name: string): SportKind[] {
  return BUILTIN_SPORTS.find((s) => s.name === name)?.modes ?? ['duration'];
}

/** 距离型的每 km×kg 系数 */
export function getSportDistanceFactor(name: string): number {
  return BUILTIN_SPORTS.find((s) => s.name === name)?.distanceFactor ?? 0;
}

export function getMetForSport(name: string, custom: { name: string; met: number }[]): number {
  const builtin = builtinMetByName(name);
  if (builtin !== undefined) return builtin;
  return custom.find((c) => c.name === name)?.met ?? 0;
}
