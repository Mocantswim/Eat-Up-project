import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dayTitle } from '../utils/date';
import { foodLabel, type FoodConversion } from '../utils/food';
import { fontFamily, fontSize, radius } from '../theme/theme';

interface Props {
  dateKey: string;
  total: number;
  food: FoodConversion | null;
  streak: number;
  weekDays: number;
}

/** 打卡卡片：淡蓝渐变背景 + 日期 + 消耗 + 食物换算（1 种）+ 连续天数（可截图保存/分享） */
const ShareCard = forwardRef<View, Props>(
  ({ dateKey, total, food, streak, weekDays }, ref) => {
    const t = dayTitle(dateKey);
    return (
      <View ref={ref} style={styles.wrap}>
        <LinearGradient
          colors={['#74B9F6', '#4A90E2', '#2E7BC4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.appName}>🍱 食光运动</Text>
          <Text style={styles.date}>
            {t.month}月{t.day}日 {t.weekName}
          </Text>

          <Text style={styles.label}>今日消耗</Text>
          <Text style={styles.total}>
            {total.toFixed(1)}
            <Text style={styles.unit}> 千卡</Text>
          </Text>

          {food && (
            <View style={styles.foodRow}>
              <Text style={styles.foodEmoji}>{food.food.emoji}</Text>
              <View>
                <Text style={styles.foodText}>{foodLabel(food)}</Text>
                <Text style={styles.foodNote}>每一份消耗都看得见</Text>
              </View>
            </View>
          )}

          <Text style={styles.streak}>
            🔥 连续运动 {streak} 天 · 本周已运动 {weekDays} 天
          </Text>
          <Text style={styles.slogan}>坚持记录 · 吃得更明白 ✨</Text>
        </LinearGradient>
      </View>
    );
  }
);

export default ShareCard;

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  card: {
    width: 320,
    padding: 24,
    borderRadius: radius.lg,
  },
  appName: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.95,
  },
  date: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 18,
  },
  total: {
    fontFamily: fontFamily.title,
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  unit: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    gap: 10,
  },
  foodEmoji: {
    fontSize: 34,
  },
  foodText: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  foodNote: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  streak: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: '#FFFFFF',
    marginTop: 16,
  },
  slogan: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});
