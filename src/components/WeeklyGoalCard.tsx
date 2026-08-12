import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme/theme';

interface Props {
  weekDays: number;
  weekKcal: number;
  daysGoal: number;
  kcalGoal: number;
  streak: number;
  onApplyGoal?: (days: number, kcal: number) => void;
}

/** 多巴胺亮色 */
const COLORS = {
  days: '#FF6F61',
  daysTrack: '#FFE0DB',
  kcal: '#4CD964',
  kcalTrack: '#E2F7E7',
};

/** 每周目标预设档位 */
const GOAL_PRESETS = [
  { id: 'light', name: '🌱 新手', days: 2, kcal: 500, desc: '每周 2 天 · 500 千卡\n刚起步，轻松养成习惯' },
  { id: 'mid', name: '🔥 中度', days: 3, kcal: 1000, desc: '每周 3 天 · 1000 千卡\n已有规律，稳步提升' },
  { id: 'heavy', name: '💪 重度', days: 5, kcal: 2000, desc: '每周 5 天 · 2000 千卡\n进阶燃脂，追求突破' },
];

/** 首页"本周目标"卡片：两个进度环 + 点击放大动画（多邻国风格） */
export default function WeeklyGoalCard({
  weekDays,
  weekKcal,
  daysGoal,
  kcalGoal,
  streak,
  onApplyGoal,
}: Props) {
  const [expanded, setExpanded] = useState<'days' | 'kcal' | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const daysPct = Math.min(weekDays / (daysGoal || 1), 1);
  const kcalPct = Math.min(weekKcal / (kcalGoal || 1), 1);
  const daysDone = weekDays >= daysGoal;
  const kcalDone = weekKcal >= kcalGoal;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>本周目标</Text>
        <View style={styles.headRight}>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 连续 {streak} 天</Text>
            </View>
          )}
          <Pressable hitSlop={8} onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>
      <View style={styles.ringsRow}>
        <GoalRing
          label="运动"
          cur={weekDays}
          goal={daysGoal}
          unit="天"
          pct={daysPct}
          color={COLORS.days}
          track={COLORS.daysTrack}
          done={daysDone}
          onPress={() => setExpanded('days')}
        />
        <GoalRing
          label="消耗"
          cur={weekKcal}
          goal={kcalGoal}
          unit="千卡"
          pct={kcalPct}
          color={COLORS.kcal}
          track={COLORS.kcalTrack}
          done={kcalDone}
          onPress={() => setExpanded('kcal')}
        />
      </View>

      <GoalDetail
        expanded={expanded}
        onClose={() => setExpanded(null)}
        daysData={{ weekDays, daysGoal, daysDone }}
        kcalData={{ weekKcal, kcalGoal, kcalDone }}
      />

      <GoalSettingsModal
        visible={settingsVisible}
        currentDays={daysGoal}
        currentKcal={kcalGoal}
        onClose={() => setSettingsVisible(false)}
        onSelect={(d, k) => {
          setSettingsVisible(false);
          onApplyGoal?.(d, k);
        }}
      />
    </View>
  );
}

/** 档位设置弹窗：三档预设选择 */
function GoalSettingsModal({
  visible,
  currentDays,
  currentKcal,
  onClose,
  onSelect,
}: {
  visible: boolean;
  currentDays: number;
  currentKcal: number;
  onClose: () => void;
  onSelect: (days: number, kcal: number) => void;
}) {
  const [sel, setSel] = useState<{ days: number; kcal: number }>({
    days: currentDays,
    kcal: currentKcal,
  });

  useEffect(() => {
    if (visible) setSel({ days: currentDays, kcal: currentKcal });
  }, [visible, currentDays, currentKcal]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={40} tint="light" style={styles.blurFill}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>每周目标档位</Text>
            {GOAL_PRESETS.map((p) => {
              const active = sel.days === p.days && sel.kcal === p.kcal;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.settingItem, active && styles.settingItemActive]}
                  onPress={() => setSel({ days: p.days, kcal: p.kcal })}
                >
                  <Text style={[styles.settingName, active && styles.settingNameActive]}>
                    {p.name}
                  </Text>
                  <Text style={styles.settingDesc}>{p.desc}</Text>
                </Pressable>
              );
            })}
            <Pressable
              style={styles.settingsConfirm}
              onPress={() => onSelect(sel.days, sel.kcal)}
            >
              <Text style={styles.settingsConfirmText}>应用</Text>
            </Pressable>
          </View>
        </Pressable>
      </BlurView>
    </Modal>
  );
}

interface RingProps {
  label: string;
  cur: number;
  goal: number;
  unit: string;
  pct: number;
  color: string;
  track: string;
  done: boolean;
  onPress: () => void;
}

function GoalRing({ label, cur, goal, unit, pct, color, track, done, onPress }: RingProps) {
  const size = 78;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <View>
      <Pressable onPress={onPress} style={styles.ringWrap}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - pct)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={[styles.ringValue, { color }]}>
            {done ? '✓' : `${cur}/${goal}`}
          </Text>
          <Text style={styles.ringUnit}>{unit}</Text>
        </View>
      </Pressable>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
}

function GoalDetail({
  expanded,
  onClose,
  daysData,
  kcalData,
}: {
  expanded: 'days' | 'kcal' | null;
  onClose: () => void;
  daysData: { weekDays: number; daysGoal: number; daysDone: boolean };
  kcalData: { weekKcal: number; kcalGoal: number; kcalDone: boolean };
}) {
  const [visible, setVisible] = useState(false);
  const [ringType, setRingType] = useState<'days' | 'kcal'>('days');
  const scale = useSharedValue(0.6);

  useEffect(() => {
    if (expanded) {
      setRingType(expanded);
      setVisible(true);
      scale.value = withDelay(80, withSpring(1, { damping: 14, stiffness: 140 }));
    } else {
      const t = setTimeout(() => setVisible(false), 160);
      return () => clearTimeout(t);
    }
  }, [expanded, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDays = ringType === 'days';
  const cur = isDays ? daysData.weekDays : kcalData.weekKcal;
  const goal = isDays ? daysData.daysGoal : kcalData.kcalGoal;
  const done = isDays ? daysData.daysDone : kcalData.kcalDone;
  const unit = isDays ? '天' : '千卡';
  const color = isDays ? COLORS.days : COLORS.kcal;
  const track = isDays ? COLORS.daysTrack : COLORS.kcalTrack;
  const pct = Math.min(cur / (goal || 1), 1);
  const title = isDays ? '本周运动天数' : '本周消耗目标';

  const size = 150;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={40} tint="light" style={styles.blurFill}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Animated.View style={[styles.detailCard, animStyle]}>
            <Text style={styles.detailTitle}>{done ? '🎉 已达成！' : title}</Text>
            <View style={styles.bigRingWrap}>
              <Svg width={size} height={size}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={track}
                  strokeWidth={stroke}
                  fill="none"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={color}
                  strokeWidth={stroke}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${c} ${c}`}
                  strokeDashoffset={c * (1 - pct)}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              </Svg>
              <View style={styles.bigRingCenter}>
                <Text style={[styles.detailBig, { color }]}>{done ? '✓' : cur}</Text>
                <Text style={styles.detailUnit2}>
                  / {goal} {unit}
                </Text>
              </View>
            </View>
            <Text style={styles.detailHint}>
              {done
                ? '太棒了，本周目标已经完成！'
                : `再完成 ${Math.max(goal - cur, 0)} ${unit} 即可达成目标`}
            </Text>
            <Pressable style={styles.detailBtn} onPress={onClose}>
              <Text style={styles.detailBtnText}>继续加油</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  streakBadge: {
    backgroundColor: '#FFF3CD',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  streakText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: '#B7791F',
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
  },
  ringWrap: {
    position: 'relative',
    width: 78,
    height: 78,
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  ringUnit: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  ringLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  blurFill: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    width: '78%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  detailTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  bigRingWrap: {
    position: 'relative',
    width: 150,
    height: 150,
    marginVertical: spacing.lg,
  },
  bigRingCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBig: {
    fontFamily: fontFamily.title,
    fontSize: 40,
    fontWeight: '800',
  },
  detailUnit2: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailHint: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  detailBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  detailBtnText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsCard: {
    width: '82%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  settingsTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  settingItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  settingItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  settingName: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  settingNameActive: {
    color: colors.primary,
  },
  settingDesc: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  settingsConfirm: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  settingsConfirmText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

