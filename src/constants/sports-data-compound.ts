import type { ExerciseTypeDef } from './sports';

export const COMPOUND_TYPES: ExerciseTypeDef[] = [
  { typeName: '全身复合', emoji: '🤸', groupId: 'compound', kind: 'reps', modes: ['reps', 'weight'], met: 6.0, repFactor: 0.04, weightFactor: 0.02, aliases: '波比 壶铃 高翻 抓举 挺举 战绳 药球 土耳其 熊爬',
    variants: [
      { name: '波比跳' },
      { name: '壶铃摆动', kind: 'weight', modes: ['reps', 'weight'] },
      { name: '高翻', kind: 'weight', modes: ['reps', 'weight'] },
      { name: '抓举', kind: 'weight', modes: ['reps', 'weight'] },
      { name: '挺举', kind: 'weight', modes: ['reps', 'weight'] },
      { name: '借力推举', kind: 'weight', modes: ['reps', 'weight'] },
      { name: '哑铃抓举', kind: 'weight', modes: ['reps', 'weight'] },
      { name: '土耳其起立', kind: 'weight', modes: ['reps', 'weight'] },
      { name: '熊爬', kind: 'duration', modes: ['duration'] },
      { name: '药球砸地', kind: 'weight', modes: ['reps', 'weight'] },
      { name: '战绳', kind: 'duration', modes: ['duration'] },
    ] },
];
