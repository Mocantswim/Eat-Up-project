import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import FAB from '../components/FAB';
import EmptyState from '../components/EmptyState';
import {
  deletePlan, estimateItemCalories, getAllPlans, getPlanItems, type WorkoutPlan,
} from '../db/planDao';
import { getProfile } from '../db/userProfileDao';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Plans'>;

export default function PlansScreen({ navigation }: Props) {
  const [plans, setPlans] = useState<(WorkoutPlan & { itemCount: number; totalKcal: number; daysText: string })[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [list, p] = await Promise.all([getAllPlans(), getProfile()]);
        const w = p?.weight ?? 60;
        const result = [];
        for (const plan of list) {
          const items = await getPlanItems(plan.id);
          const total = items.reduce((s, it) => s + estimateItemCalories(it, w), 0);
          const daysText = plan.days ? `周${plan.days.map((d) => '一二三四五六日'[d - 1]).join('/')}` : '通用模板';
          result.push({ ...plan, itemCount: items.length, totalKcal: total, daysText });
        }
        setPlans(result);
      })();
    }, [])
  );

  const handleDelete = (plan: WorkoutPlan) => {
    Alert.alert('删除计划', `确定删除“${plan.name}”吗？已生成的记录不受影响。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await deletePlan(plan.id); setPlans((prev) => prev.filter((x) => x.id !== plan.id)); } },
    ]);
  };

  return (
    <View style={styles.root}>
      <Header title="训练计划" onBack={() => navigation.goBack()} />
      <FlatList
        data={plans}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState text="还没有训练计划，点右下角 + 创建" />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('PlanForm', { planId: item.id })}>
            <View style={styles.cardHead}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.days}>{item.daysText}</Text>
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.meta}>{item.itemCount} 个动作</Text>
              <Text style={styles.kcal}>约 {item.totalKcal} kcal</Text>
            </View>
            <View style={styles.actions}>
              <Pressable hitSlop={8} onPress={() => navigation.navigate('PlanForm', { planId: item.id })}>
                <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          </Pressable>
        )}
      />
      <FAB onPress={() => navigation.navigate('PlanForm', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: contentPadding, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: fontFamily.title, fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  days: { fontFamily: fontFamily.body, fontSize: fontSize.xs, color: colors.primary },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textSecondary },
  kcal: { fontFamily: fontFamily.title, fontSize: fontSize.md, fontWeight: '600', color: colors.coral },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.md },
});
