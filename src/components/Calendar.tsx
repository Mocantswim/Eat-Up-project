import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { daysInMonth, monthTitle, pad2, todayKey, WEEK_NAMES, weekdayIndex } from '../utils/date';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme/theme';

interface Props {
  year: number;
  month: number; // 0 基
  markedDates: Set<string>; // 有运动记录的日期（圆点标记）
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTitlePress: () => void;
}

/** 自绘轻量月历：网格 + 圆点 + 左右滑动/按钮切月 + 年月跳转（决策 #11） */
export default function Calendar({
  year,
  month,
  markedDates,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onTitlePress,
}: Props) {
  const today = todayKey();
  const cells: (string | null)[] = [];
  const startPad = weekdayIndex(year, month, 1);
  for (let i = 0; i < startPad; i++) cells.push(null);
  const dim = daysInMonth(year, month);
  for (let d = 1; d <= dim; d++) {
    cells.push(`${year}-${pad2(month + 1)}-${pad2(d)}`);
  }

  const pan = Gesture.Pan()
    .runOnJS(true)
    // 只响应水平滑动（切换月份），垂直滑动交给外层 ScrollView
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -50) onNextMonth();
      else if (e.translationX > 50) onPrevMonth();
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.card}>
        {/* 标题行 */}
        <View style={styles.header}>
          <Pressable onPress={onPrevMonth} hitSlop={8} style={styles.arrow}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <Pressable onPress={onTitlePress} hitSlop={8} style={styles.titleBtn}>
            <Text style={styles.title}>{monthTitle(year, month)}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={onNextMonth} hitSlop={8} style={styles.arrow}>
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {/* 星期标题 */}
        <View style={styles.weekRow}>
          {WEEK_NAMES.map((w) => (
            <Text key={w} style={styles.weekText}>
              {w}
            </Text>
          ))}
        </View>

        {/* 日期网格 */}
        <View style={styles.grid}>
          {cells.map((key, idx) => {
            if (!key) return <View key={`empty-${idx}`} style={styles.cell} />;
            const isToday = key === today;
            const isFuture = key > today; // 未来日期：灰色且不可点击
            const marked = markedDates.has(key);
            const day = parseInt(key.slice(8), 10);
            return (
              <Pressable
                key={key}
                style={styles.cell}
                onPress={() => !isFuture && onSelectDate(key)}
              >
                <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.dayTextToday,
                      isFuture && styles.dayTextFuture,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                <View style={[styles.dot, marked && !isFuture && styles.dotMarked]} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  arrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    minHeight: 46,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.text,
  },
  dayTextToday: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextFuture: {
    color: colors.textMuted,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  dotMarked: {
    backgroundColor: colors.primary,
  },
});
