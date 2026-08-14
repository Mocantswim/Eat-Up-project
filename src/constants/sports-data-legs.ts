import type { ExerciseTypeDef } from './sports';

export const LEGS_TYPES: ExerciseTypeDef[] = [
  { typeName: '深蹲', emoji: '🦵', groupId: 'legs', kind: 'reps', modes: ['reps', 'weight'], met: 5.0, repFactor: 0.02, weightFactor: 0.02, addBodyWeight: true, aliases: '深蹲 蹲',
    variants: [{ name: '徒手深蹲' }, { name: '杠铃深蹲' }, { name: '哑铃深蹲' }, { name: '高脚杯深蹲' }, { name: '前蹲' }, { name: '保加利亚分腿蹲' }, { name: '相扑深蹲' }, { name: '箱式深蹲' }] },
  { typeName: '箭步蹲', emoji: '🚶', groupId: 'legs', kind: 'reps', modes: ['reps', 'weight'], met: 4.5, repFactor: 0.02, weightFactor: 0.02, addBodyWeight: true, aliases: '箭步蹲 弓步',
    variants: [{ name: '原地箭步蹲' }, { name: '行走箭步蹲' }, { name: '反向箭步蹲' }, { name: '侧向箭步蹲' }, { name: '登阶' }] },
  { typeName: '腿举', emoji: '🦿', groupId: 'legs', kind: 'weight', modes: ['reps', 'weight'], met: 4.5, weightFactor: 0.02, aliases: '腿举',
    variants: [{ name: '器械腿举' }, { name: '单腿腿举' }] },
  { typeName: '腿屈伸', emoji: '🦵', groupId: 'legs', kind: 'weight', modes: ['reps', 'weight'], met: 3.0, weightFactor: 0.02, aliases: '腿屈伸 股四头',
    variants: [{ name: '器械腿屈伸' }] },
  { typeName: '腿弯举', emoji: '🦵', groupId: 'legs', kind: 'weight', modes: ['reps', 'weight'], met: 3.0, weightFactor: 0.02, aliases: '腿弯举 腘绳',
    variants: [{ name: '俯卧腿弯举' }, { name: '坐姿腿弯举' }, { name: '单腿腿弯举' }, { name: '北欧腿弯举', kind: 'reps', modes: ['reps'] }] },
  { typeName: '臀桥', emoji: '🍑', groupId: 'glutes', kind: 'reps', modes: ['reps', 'weight'], met: 3.5, repFactor: 0.015, weightFactor: 0.02, addBodyWeight: true, aliases: '臀桥 臀推',
    variants: [{ name: '标准臀桥' }, { name: '单腿臀桥' }, { name: '杠铃臀桥' }, { name: '杠铃臀推' }] },
  { typeName: '髋外展', emoji: '🍑', groupId: 'glutes', kind: 'reps', modes: ['reps', 'weight'], met: 3.0, repFactor: 0.015, weightFactor: 0.02, addBodyWeight: true, aliases: '髋外展 抬腿',
    variants: [{ name: '器械髋外展' }, { name: '弹力带髋外展' }, { name: '侧卧抬腿' }] },
  { typeName: '后踢腿', emoji: '🦵', groupId: 'glutes', kind: 'reps', modes: ['reps'], met: 3.0, repFactor: 0.015, aliases: '后踢 驴踢',
    variants: [{ name: '后踢腿' }, { name: '驴踢' }] },
  { typeName: '提踵', emoji: '🦶', groupId: 'legs', kind: 'reps', modes: ['reps', 'weight'], met: 2.5, repFactor: 0.01, weightFactor: 0.01, addBodyWeight: true, aliases: '提踵 小腿',
    variants: [{ name: '站姿提踵' }, { name: '坐姿提踵' }, { name: '单腿提踵' }, { name: '器械提踵' }, { name: '脚尖行走', kind: 'duration', modes: ['duration'] }] },
  { typeName: '内收外展', emoji: '🦵', groupId: 'legs', kind: 'reps', modes: ['reps', 'weight'], met: 3.0, repFactor: 0.015, weightFactor: 0.02, aliases: '夹腿 侧弓步',
    variants: [{ name: '器械夹腿' }, { name: '侧弓步' }, { name: '弹力带侧向行走', kind: 'duration', modes: ['duration'] }] },
];
