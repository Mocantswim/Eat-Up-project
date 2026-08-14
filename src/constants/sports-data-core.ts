import type { ExerciseTypeDef } from './sports';

export const CORE_TYPES: ExerciseTypeDef[] = [
  { typeName: '卷腹', emoji: '🧘', groupId: 'core', kind: 'reps', modes: ['reps', 'weight'], met: 3.8, repFactor: 0.02, weightFactor: 0.02, aliases: '卷腹 卷',
    variants: [{ name: '标准卷腹' }, { name: '反向卷腹' }, { name: '自行车卷腹' }, { name: '侧卷腹' }, { name: '健身球卷腹' }, { name: '绳索卷腹' }] },
  { typeName: '举腿', emoji: '🦵', groupId: 'core', kind: 'reps', modes: ['reps'], met: 3.5, repFactor: 0.02, aliases: '举腿 抬腿',
    variants: [{ name: '悬垂举腿' }, { name: '仰卧抬腿' }, { name: '罗马椅举腿' }, { name: '平板支撑举腿' }] },
  { typeName: '平板支撑', emoji: '🧎', groupId: 'core', kind: 'duration', modes: ['duration'], met: 3.0, aliases: '平板 支撑',
    variants: [{ name: '标准平板支撑' }, { name: '侧平板支撑' }, { name: '动态平板支撑' }, { name: '平板支撑转体' }, { name: '平板支撑开合跳' }] },
  { typeName: '俄罗斯转体', emoji: '🔄', groupId: 'core', kind: 'reps', modes: ['reps', 'weight'], met: 3.5, repFactor: 0.02, weightFactor: 0.02, aliases: '俄转 转体',
    variants: [{ name: '徒手俄罗斯转体' }, { name: '负重俄罗斯转体' }, { name: '药球俄罗斯转体' }] },
  { typeName: '腹斜肌', emoji: '🌀', groupId: 'core', kind: 'reps', modes: ['reps', 'weight'], met: 3.5, repFactor: 0.02, weightFactor: 0.02, aliases: '腹斜 伐木 侧屈',
    variants: [{ name: '伐木式' }, { name: '绳索侧屈' }, { name: '交替触踝' }] },
  { typeName: '核心其他', emoji: '🔥', groupId: 'core', kind: 'reps', modes: ['reps'], met: 3.8, repFactor: 0.02, aliases: '仰卧起坐 健腹轮 空中蹬车 V字 龙旗',
    variants: [{ name: '仰卧起坐' }, { name: '健腹轮' }, { name: '空中蹬车' }, { name: 'V字卷腹' }, { name: '龙旗' }] },
];
