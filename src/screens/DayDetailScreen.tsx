import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import FAB from '../components/FAB';
import EmptyState from '../components/EmptyState';
import SportIcon from '../components/SportIcon';
import FoodCard from '../components/FoodCard';
import Confetti from '../components/Confetti';
import {
  deleteExercise,
  getDailyTotal,
  getExercisesByDate,
  type ExerciseLog,
} from '../db/exerciseLogDao';
import { getWeightByDate, upsertWeight } from '../db/weightRecordDao';
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
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleWeightSave = async () => {
    if (!weightInput.trim()) return; // 留空不写入/不删除（§6.6）
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0 || w > 500) {
      Alert.alert('提示', '请输入有效体重（kg）');
      return;
    }
    await upsertWeight(date, w);
    Alert.alert('已保存', '当日体重已记录，用于体重趋势图');
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

        {/* 运动列表 */}
        <Text style={styles.sectionTitle}>运动记录</Text>
        {logs.length === 0 ? (
          <EmptyState emoji="🏃" text="这一天还没有运动记录，点击右下角 + 添加" />
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <SportIcon emoji={builtinEmojiByName(log.sportType)} />
              <View style={styles.logInfo}>
                <Text style={styles.logName}>{log.sportType}</Text>
                <Text style={styles.logMeta}>
                  {log.durationMin} 分钟 · {log.weightUsed}kg
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
              </View>
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
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
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

