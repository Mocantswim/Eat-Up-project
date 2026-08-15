import type { ExerciseTypeDef } from './sports';

export const SHOULDER_TYPES: ExerciseTypeDef[] = [
  { typeName: '推举', emoji: '🏋️', groupId: 'shoulder', kind: 'weight', modes: ['reps', 'weight'], met: 4.5, weightFactor: 0.02, aliases: '推举 肩推 推肩',
    variants: [
      { name: '杠铃站姿推举' }, { name: '杠铃坐姿推举' }, { name: '哑铃坐姿推举' }, { name: '哑铃站姿推举' },
      { name: '阿诺德推举' }, { name: '器械推肩' }, { name: '壶铃推举' }, { name: '单臂哑铃推举' },
      { name: '借力推举' }, { name: '半程推举' }, { name: '交替哑铃推举' }, { name: '史密斯机推肩' },
    ] },
  { typeName: '侧平举', emoji: '🤸', groupId: 'shoulder', kind: 'weight', modes: ['reps', 'weight'], met: 3.0, weightFactor: 0.015, aliases: '侧平举 侧举',
    variants: [
      { name: '哑铃侧平举' }, { name: '绳索侧平举' }, { name: '器械侧平举' }, { name: '单臂侧平举' },
      { name: '上斜侧平举' }, { name: '肘部微屈侧平举' }, { name: '侧卧侧平举' }, { name: '弹力带侧平举' },
    ] },
  { typeName: '前平举', emoji: '🤚', groupId: 'shoulder', kind: 'weight', modes: ['reps', 'weight'], met: 3.0, weightFactor: 0.015, aliases: '前平举 前举',
    variants: [
      { name: '哑铃前平举' }, { name: '杠铃前平举' }, { name: '绳索前平举' }, { name: '单臂前平举' },
      { name: '交替前平举' }, { name: '弹力带前平举' }, { name: '轮盘前平举' },
    ] },
  { typeName: '后束', emoji: '🙆', groupId: 'shoulder', kind: 'weight', modes: ['reps', 'weight'], met: 3.0, weightFactor: 0.015, aliases: '后束 面拉 反向飞鸟',
    variants: [
      { name: '俯身哑铃飞鸟' }, { name: '反向蝴蝶机' }, { name: '绳索面拉' }, { name: '绳索反向飞鸟' },
      { name: '上斜俯身飞鸟' }, { name: '单臂绳索反向飞鸟' }, { name: '弹力带反向飞鸟' },
    ] },
  { typeName: '耸肩', emoji: '🤷', groupId: 'shoulder', kind: 'weight', modes: ['reps', 'weight'], met: 3.0, weightFactor: 0.02, aliases: '耸肩',
    variants: [{ name: '杠铃耸肩' }, { name: '哑铃耸肩' }, { name: '绳索耸肩' }, { name: '器械耸肩' }] },
  { typeName: '肩部其他', emoji: '🤸', groupId: 'shoulder', kind: 'weight', modes: ['reps', 'weight'], met: 4.0, weightFactor: 0.02, aliases: '直立划船 壶铃摆荡 倒立撑',
    variants: [{ name: '直立划船' }, { name: '壶铃摆荡' }, { name: '倒立撑', kind: 'reps', modes: ['reps'] }] },
];
