import type { ExerciseTypeDef } from './sports';

export const ARMS_TYPES: ExerciseTypeDef[] = [
  // 三头
  { typeName: '臂屈伸', emoji: '💪', groupId: 'triceps', kind: 'weight', modes: ['reps', 'weight'], met: 3.5, weightFactor: 0.015, aliases: '臂屈伸 三头 下压 碎颅',
    variants: [{ name: '双杠臂屈伸' }, { name: '凳上臂屈伸' }, { name: '仰卧杠铃臂屈伸' }, { name: '绳索下压' }, { name: '哑铃过顶臂屈伸' }, { name: '窄距卧推' }] },
  // 二头
  { typeName: '弯举', emoji: '🏋️', groupId: 'biceps', kind: 'weight', modes: ['reps', 'weight'], met: 3.5, weightFactor: 0.01, aliases: '弯举 二头 弯',
    variants: [
      { name: '杠铃弯举' }, { name: '哑铃交替弯举' }, { name: '哑铃锤式弯举' }, { name: '绳索弯举' },
      { name: '牧师凳弯举' }, { name: '集中弯举' }, { name: '斜托弯举' }, { name: '上斜哑铃弯举' },
      { name: '佐特曼弯举' }, { name: '过头弯举' }, { name: '蜘蛛弯举' }, { name: '绳索锤式弯举' },
      { name: '单臂绳索弯举' }, { name: '弹力带弯举' },
    ] },
  // 前臂
  { typeName: '腕弯举', emoji: '🤛', groupId: 'forearm', kind: 'weight', modes: ['reps', 'weight'], met: 2.0, weightFactor: 0.01, aliases: '腕弯举 腕',
    variants: [{ name: '正握腕弯举' }, { name: '反握腕弯举' }, { name: '杠铃腕弯举' }, { name: '哑铃腕弯举' }] },
  { typeName: '抓握训练', emoji: '🤲', groupId: 'forearm', kind: 'reps', modes: ['reps', 'weight', 'duration'], met: 2.5, repFactor: 0.005, weightFactor: 0.01, aliases: '抓握 握力 悬挂 农夫行走',
    variants: [{ name: '农夫行走', kind: 'weight', modes: ['reps', 'weight'] }, { name: '静力悬挂', kind: 'duration', modes: ['duration'] }, { name: '握力器训练' }] },
];
