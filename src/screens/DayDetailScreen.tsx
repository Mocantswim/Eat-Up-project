import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import FAB from '../components/FAB';
import EmptyState from '../components/EmptyState';
import SportIcon from '../components/SportIcon';
import FoodCard from '../components/FoodCard';
import Confetti from '../components/Confetti';
import WorkoutTimer from '../components/WorkoutTimer';
import {
  deleteExercise,
  getDailyTotal,
  getExercisesByDate,
  type ExerciseLog,
} from '../db/exerciseLogDao';
import { getWeightByDate, upsertWeight } from '../db/weightRecordDao';
import { getProfile, updateCurrentWeight, type UserProfile } from '../db/userProfileDao';
import { applyPlanToDate, getAllPlans, type WorkoutPlan } from '../db/planDao';
import { builtinEmojiByName } from '../constants/sports';
import { dayTitle } from '../utils/date';
import { shouldTriggerConfetti } from '../utils/confetti';
import type { HomeStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'DayDetail'>;

/** 日期详情页：当日体重 + 运动列表 + 总消耗与食物（策划书 §2.3.2） */
export default function DayDetailScreen({ navigation, route }: Props) {
  const { date } = route.params;
  const title = dayTitle(date);

  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [total, setTotal] = useState(0);
  const [weightInput, setWeightInput] = useState('');
  const [confetti, setConfetti] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const load = useCallback(async () => {
    const [list, t, w, trigger] = await Promise.all([
      getExercisesByDate(date),
      getDailyTotal(date),
      getWeightByDate(date),
      shouldTriggerConfetti(date),
    ]);
    setLogs(list);
    setTotal(t);
    setWeightInput(w != null ? String(w) : '');
    if (trigger) setConfetti(true);
    const p = await getProfile();
    setProfile(p);
  }, [date]);

  /** 自动提示：当天星期匹配的计划（每计划每日期提示一次） */
  const checkPlanPrompt = useCallback(async () => {
    const wd = new Date(date).getDay();
    const dayNum = wd === 0 ? 7 : wd;
    const all = await getAllPlans();
    const matched = all.filter((x) => x.days && x.days.includes(dayNum));
    const p = await getProfile();
    if (matched.length === 0 || !p?.weight) return;
    const key = `plan_prompt_${date}`;
    if (await AsyncStorage.getItem(key)) return;
    await AsyncStorage.setItem(key, '1');
    Alert.alert('今日训练计划', `「${matched[0].name}」匹配今日，是否一键添加？`, [
      { text: '稍后', style: 'cancel' },
      { text: '一键添加', onPress: () => applyPlan(matched[0].id) },
    ]);
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
      checkPlanPrompt();
    }, [load, checkPlanPrompt])
  );

  /** 一键添加计划 → 生成当天普通记录 */
  const applyPlan = async (planId: number) => {
    const p = await getProfile();
    if (!p?.weight) { Alert.alert('提示', '请先在“我的”设置体重'); return; }
    const n = await applyPlanToDate(planId, date, p.weight);
    setPlanModalVisible(false);
    Alert.alert('完成', `已添加 ${n} 条运动记录`);
    load();
  };

  const openPlanPicker = async () => {
    setPlans(await getAllPlans());
    setPlanModalVisible(true);
  };

  const handleWeightSave = async () => {
    if (!weightInput.trim()) return; // 留空不写入/不删除（§6.6）
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0 || w > 500) {
      Alert.alert('提示', '请输入有效体重（kg）');
      return;
    }
    await upsertWeight(date, w);
    await updateCurrentWeight(w); // 同步为当前体重（"我的"页 & 新运动计算）
    Alert.alert('已保存', '当日体重已记录，并同步为当前体重');
  };

  const handleDelete = (id: number) => {
    Alert.alert('删除运动', '确定删除这条运动记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteExercise(id);
          load();
        },
      },
    ]);
  };

  /** 计时器结束 → 跳转添加运动并预填运动类型+时长 */
  const handleTimerFinish = (sport: string, durationMin: number) => {
    navigation.navigate('AddEditExercise', {
      date,
      prefillSport: sport,
      prefillDurationMin: durationMin,
    });
  };

  return (
    <View style={styles.root}>
      <Header
        title={`${title.month}月${title.day}日 ${title.weekName}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* 当日体重（选填） */}
        <View style={styles.weightCard}>
          <View style={styles.weightLabelRow}>
            <Ionicons name="scale-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.weightLabel}>记录今日体重（选填）</Text>
          </View>
          <View style={styles.weightInputRow}>
            <TextInput
              style={styles.weightInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="如 60.5"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.weightUnit}>kg</Text>
            <Pressable
              style={({ pressed }) => [styles.weightSave, pressed && { opacity: 0.85 }]}
              onPress={handleWeightSave}
            >
              <Text style={styles.weightSaveText}>保存</Text>
            </Pressable>
          </View>
        </View>

        {/* 内置训练计时器 */}
        <WorkoutTimer onFinish={handleTimerFinish} />

        {/* 运动列表 */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>运动记录</Text>
          <Pressable hitSlop={8} onPress={openPlanPicker}>
            <Text style={styles.planBtn}>📋 按计划添加</Text>
          </Pressable>
        </View>
        {logs.length === 0 ? (
          <EmptyState emoji="🏃" text="这一天还没有运动记录，点击右下角 + 添加" />
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logWrap}>
              <View style={styles.logCard}>
                <SportIcon emoji={builtinEmojiByName(log.sportType)} />
                <View style={styles.logInfo}>
                  <Text style={styles.logName}>{log.sportType}</Text>
                  <Text style={styles.logMeta}>
                    {log.kind === 'reps'
                      ? `${log.reps} 次 · ${log.weightUsed}kg`
                      : log.kind === 'weight'
                      ? `${log.loadKg}kg × ${log.reps} 次`
                      : log.kind === 'distance'
                      ? `${log.distance} km · ${log.weightUsed}kg`
                      : `${log.durationMin} 分钟 · ${log.weightUsed}kg`}
                  </Text>
                </View>
                <Text style={styles.logCalories}>{log.calories.toFixed(1)} kcal</Text>
                <View style={styles.logActions}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => navigation.navigate('AddEditExercise', { date, logId: log.id })}
                  >
                    <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable hitSlop={8} onPress={() => handleDelete(log.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                  {log.note ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() =>
                        setExpandedNoteId(expandedNoteId === log.id ? null : log.id)
                      }
                    >
                      <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
              {expandedNoteId === log.id && log.note ? (
                <View style={styles.noteExpand}>
                  <Text style={styles.noteText}>{log.note}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}

        {/* 当日总消耗 + 等价食物 */}
        {total > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>当日总消耗</Text>
            <View style={styles.summaryValueRow}>
              <Text style={styles.summaryValue}>{total.toFixed(1)}</Text>
              <Text style={styles.summaryUnit}>千卡</Text>
            </View>
            <FoodCard totalCalories={total} dateKey={date} />
          </View>
        )}
      </ScrollView>

      <FAB onPress={() => navigation.navigate('AddEditExercise', { date })} />
      <Confetti visible={confetti} onFinish={() => setConfetti(false)} />

      {/* 按计划添加弹窗 */}
      <Modal visible={planModalVisible} transparent animationType="slide">
        <View style={styles.planOverlay}>
          <View style={styles.planSheet}>
            <Text style={styles.planTitle}>选择计划</Text>
            {plans.length === 0 ? (
              <Text style={styles.planEmpty}>还没有计划，去 我的→训练计划 创建</Text>
            ) : (
              plans.map((p) => (
                <Pressable key={p.id} style={styles.planItem} onPress={() => applyPlan(p.id)}>
                  <Text style={styles.planName}>{p.name}</Text>
                  <Text style={styles.planMeta}>{p.days ? `周${p.days.map((d) => '一二三四五六日'[d - 1]).join('/')}` : '通用模板'}</Text>
                </Pressable>
              ))
            )}
            <Pressable style={styles.planCancel} onPress={() => setPlanModalVisible(false)}>
              <Text style={styles.planCancelText}>取消</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: contentPadding,
    paddingBottom: spacing.xxl,
  },
  weightCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  weightLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  weightLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  weightUnit: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  weightSave: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  weightSaveText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planBtn: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  logWrap: {
    marginBottom: spacing.md,
  },
  noteExpand: {
    backgroundColor: '#F5F8FC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  noteText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  planOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  planSheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: contentPadding, paddingBottom: spacing.xxl },
  planTitle: { fontFamily: fontFamily.title, fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  planEmpty: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  planItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  planName: { fontFamily: fontFamily.body, fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  planMeta: { fontFamily: fontFamily.body, fontSize: fontSize.xs, color: colors.textMuted },
  planCancel: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm },
  planCancelText: { fontFamily: fontFamily.body, fontSize: fontSize.md, color: colors.textSecondary },
  logInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  logName: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  logMeta: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  logCalories: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.coral,
    marginRight: spacing.md,
  },
  logActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  summaryLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  summaryValue: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryUnit: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});

