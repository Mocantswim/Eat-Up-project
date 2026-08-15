import type { ExerciseTypeDef } from './sports';

export const BACK_TYPES: ExerciseTypeDef[] = [
  { typeName: '引体向上', emoji: '💪', groupId: 'back', kind: 'reps', modes: ['reps', 'weight'], met: 8.0, repFactor: 0.03, weightFactor: 0.02, aliases: '引体 引体向上 拉',
    variants: [
      { name: '正手引体向上' }, { name: '反手引体向上' }, { name: '宽距引体向上' }, { name: '窄距引体向上' },
      { name: '对握引体向上' }, { name: '离心引体向上' }, { name: '胸骨引体向上' }, { name: '颈后引体向上', repFactor: 0.035 },
      { name: '单臂引体向上', repFactor: 0.06 }, { name: '负重引体向上' }, { name: '弹力带引体向上' }, { name: '毛巾引体向上' },
    ] },
  { typeName: '划船', emoji: '🚣', groupId: 'back', kind: 'weight', modes: ['reps', 'weight'], met: 4.0, weightFactor: 0.02, aliases: '划船 俯身划船',
    variants: [{ name: '杠铃俯身划船' }, { name: '哑铃单臂划船' }, { name: '坐姿绳索划船' }, { name: '器械划船' }, { name: '胸部支撑划船' }] },
  { typeName: '高位下拉', emoji: '⬇️', groupId: 'back', kind: 'weight', modes: ['reps', 'weight'], met: 4.5, weightFactor: 0.02, aliases: '下拉 高位下拉',
    variants: [{ name: '正手高位下拉' }, { name: '反手高位下拉' }, { name: '宽距高位下拉' }, { name: '窄距高位下拉' }, { name: '对握高位下拉' }, { name: '直臂下拉' }] },
  { typeName: '硬拉', emoji: '🏋️', groupId: 'back', kind: 'weight', modes: ['reps', 'weight'], met: 6.0, weightFactor: 0.02, aliases: '硬拉 拉',
    variants: [
      { name: '传统硬拉' }, { name: '罗马尼亚硬拉' }, { name: '相扑硬拉' }, { name: '直腿硬拉' },
      { name: '六角杠硬拉' }, { name: '单腿硬拉' }, { name: '架上硬拉' }, { name: '赤字硬拉' },
      { name: '抓举硬拉' }, { name: '宽握硬拉' }, { name: '哑铃硬拉' }, { name: '壶铃硬拉' },
    ] },
  { typeName: '山羊挺身', emoji: '🙇', groupId: 'back', kind: 'reps', modes: ['reps'], met: 3.5, repFactor: 0.02, aliases: '山羊 背起 挺身',
    variants: [{ name: '罗马椅山羊挺身' }, { name: '俯卧背起' }, { name: '反向山羊挺身' }] },
];
