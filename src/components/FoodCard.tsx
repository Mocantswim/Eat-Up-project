import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { convertToFoods, foodLabel, type FoodConversion } from '../utils/food';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme/theme';

interface Props {
  totalCalories: number;
  dateKey: string;
}

/** 食物换算卡片：2-3 种等价食物，错位弹出动画 + 点击换一批（策划书 §2.2 / §2.6） */
export default function FoodCard({ totalCalories, dateKey }: Props) {
  const [round, setRound] = useState(0);
  const conversions = useMemo(
    // 换一批：round 递增改变随机种子，打破"当天固定"
    () => convertToFoods(totalCalories, `${dateKey}#${round}`),
    [totalCalories, dateKey, round]
  );

  if (conversions.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.title}>这些热量可以换成</Text>
        <Pressable hitSlop={8} onPress={() => setRound((r) => r + 1)}>
          <Text style={styles.swapBtn}>换一批 🔄</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {conversions.map((c, i) => (
          <FoodItem key={`${c.food.id}-${round}`} conversion={c} index={i} />
        ))}
      </View>
    </View>
  );
}

function FoodItem({ conversion, index }: { conversion: FoodConversion; index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 130,
      withSpring(1, { damping: 12, stiffness: 160 })
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: 0.6 + progress.value * 0.4 },
      { translateY: (1 - progress.value) * 14 },
    ],
  }));

  return (
    <Animated.View style={[styles.item, animatedStyle]}>
      <View style={[styles.emojiWrap, { backgroundColor: conversion.food.bg }]}>
        <Text style={styles.emoji}>{conversion.food.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.foodName}>{conversion.food.name}</Text>
        <Text style={styles.foodDesc}>
          {conversion.food.unit} · {conversion.food.calories} kcal
        </Text>
      </View>
      <Text style={styles.quantity}>{foodLabel(conversion)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  swapBtn: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  foodName: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  foodDesc: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  quantity: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.coral,
  },
});
