import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Calendar from '../components/Calendar';
import FoodCard from '../components/FoodCard';
import Confetti from '../components/Confetti';
import WeeklyGoalCard from '../components/WeeklyGoalCard';
import ShareCard from '../components/ShareCard';
import { getDatesWithRecords, getDailyTotal } from '../db/exerciseLogDao';
import { getProfile, saveProfile } from '../db/userProfileDao';
import { calcStreak, getStats, getWeekStats } from '../db/statsDao';
import { monthTitle, todayKey } from '../utils/date';
import { shouldTriggerConfetti } from '../utils/confetti';
import { convertToFoods } from '../utils/food';
import type { HomeStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

/** 首页：今日卡片 + 自绘月历（策划书 §2.3.1） */
export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [todayTotal, setTodayTotal] = useState(0);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [weekDays, setWeekDays] = useState(0);
  const [weekKcal, setWeekKcal] = useState(0);
  const [daysGoal, setDaysGoal] = useState(3);
  const [kcalGoal, setKcalGoal] = useState(1000);
  const [streak, setStreak] = useState(0);
  const [shareVisible, setShareVisible] = useState(false);
  const cardRef = useRef<View>(null);

  const load = useCallback(async () => {
    const [dates, total, trigger, week, p] = await Promise.all([
      getDatesWithRecords(),
      getDailyTotal(todayKey()),
      shouldTriggerConfetti(todayKey()),
      getWeekStats(),
      getProfile(),
    ]);
    setMarked(new Set(dates));
    setTodayTotal(total);
    if (trigger) setConfetti(true);
    setWeekDays(week.days);
    setWeekKcal(week.kcal);
    setDaysGoal(p?.weeklyGoalDays ?? 3);
    setKcalGoal(p?.weeklyGoalKcal ?? 1000);
    const s = await getStats();
    setStreak(calcStreak(s.activeDates));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  /** 应用新目标档位：保存到资料并即时刷新首页 */
  const applyGoal = async (days: number, kcal: number) => {
    const p = await getProfile();
    await saveProfile({
      weight: p?.weight ?? null,
      height: p?.height ?? null,
      age: p?.age ?? null,
      gender: p?.gender ?? null,
      weeklyGoalDays: days,
      weeklyGoalKcal: kcal,
    });
    setDaysGoal(days);
    setKcalGoal(kcal);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.appTitle}>食光运动</Text>

        {/* 今日卡片 */}
        <View style={styles.todayCard}>
          <View style={styles.todayHead}>
            <Text style={styles.todayLabel}>今日总消耗</Text>
            <Pressable hitSlop={8} onPress={() => setShareVisible(true)}>
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.todayValueRow}>
            <Text style={styles.todayValue}>{todayTotal.toFixed(1)}</Text>
            <Text style={styles.todayUnit}>千卡</Text>
          </View>
          <FoodCard totalCalories={todayTotal} dateKey={todayKey()} />
          {todayTotal === 0 && (
            <Text style={styles.todayHint}>今天还没有运动记录，点日历添加吧 🌱</Text>
          )}
        </View>

        {/* 本周目标 */}
        <WeeklyGoalCard
          weekDays={weekDays}
          weekKcal={weekKcal}
          daysGoal={daysGoal}
          kcalGoal={kcalGoal}
          streak={streak}
          onApplyGoal={applyGoal}
        />

        {/* 月历 */}
        <Calendar
          year={year}
          month={month}
          markedDates={marked}
          onSelectDate={(dateKey) => navigation.navigate('DayDetail', { date: dateKey })}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
          onTitlePress={() => setPickerVisible(true)}
        />
      </ScrollView>

      <MonthPicker
        visible={pickerVisible}
        year={year}
        month={month}
        onClose={() => setPickerVisible(false)}
        onConfirm={(y, m) => {
          setYear(y);
          setMonth(m);
          setPickerVisible(false);
        }}
      />

      <Confetti visible={confetti} onFinish={() => setConfetti(false)} />

      <ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        total={todayTotal}
        streak={streak}
        weekDays={weekDays}
      />
    </View>
  );
}

/** 打卡图弹窗：预览 + 保存相册 / 分享 */
function ShareModal({
  visible,
  onClose,
  total,
  streak,
  weekDays,
}: {
  visible: boolean;
  onClose: () => void;
  total: number;
  streak: number;
  weekDays: number;
}) {
  const cardRef = useRef<View>(null);
  const dateKey = todayKey();
  const food = convertToFoods(total, dateKey)[0] ?? null;

  const capture = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    try {
      return await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    const uri = await capture();
    if (!uri) return;
    // 动态加载媒体库原生模块（Expo Go 版本过旧时不存在，降级为分享）
    let MediaLib: typeof import('expo-media-library') | null = null;
    try {
      MediaLib = require('expo-media-library');
    } catch {
      MediaLib = null;
    }
    if (!MediaLib) {
      try {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } catch {
        // 忽略
      }
      return;
    }
    try {
      const perm = await MediaLib.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('需要权限', '请在系统设置中允许"食光运动"访问相册');
        return;
      }
      await MediaLib.createAssetAsync(uri);
      Alert.alert('已保存', '打卡图已保存到相册 📸');
    } catch (e) {
      try {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } catch {
        // 忽略
      }
    }
  };

  const handleShare = async () => {
    const uri = await capture();
    if (!uri) return;
    try {
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch {
      // 用户取消分享
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.shareOverlay}>
        <View style={styles.shareHeader}>
          <Text style={styles.shareTitle}>今日打卡</Text>
          <Pressable hitSlop={8} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.shareScroll}
          showsVerticalScrollIndicator={false}
        >
          <ShareCard
            ref={cardRef}
            dateKey={dateKey}
            total={total}
            food={food}
            streak={streak}
            weekDays={weekDays}
          />
        </ScrollView>
        <View style={styles.shareActions}>
          <Pressable style={styles.shareBtn} onPress={handleSave}>
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>保存到相册</Text>
          </Pressable>
          <Pressable style={[styles.shareBtn, styles.shareBtnWarm]} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>分享</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** 年月跳转面板（点击顶部年月弹出，决策：可跳任意年月） */
function MonthPicker({
  visible,
  year,
  month,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  year: number;
  month: number;
  onClose: () => void;
  onConfirm: (y: number, m: number) => void;
}) {
  const [y, setY] = useState(year);
  const [m, setM] = useState(month);

  // 打开时同步当前年月（避免上次跳转的残留值）
  useEffect(() => {
    if (visible) {
      setY(year);
      setM(month);
    }
  }, [visible, year, month]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.pickerCard} onPress={() => {}}>
          <Text style={styles.pickerTitle}>选择年月</Text>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperBtn} onPress={() => setY((v) => v - 1)} hitSlop={8}>
              <Ionicons name="remove" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.stepperValue}>{y} 年</Text>
            <Pressable style={styles.stepperBtn} onPress={() => setY((v) => v + 1)} hitSlop={8}>
              <Ionicons name="add" size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setM((v) => (v === 0 ? 11 : v - 1))}
              hitSlop={8}
            >
              <Ionicons name="remove" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.stepperValue}>{m + 1} 月</Text>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setM((v) => (v === 11 ? 0 : v + 1))}
              hitSlop={8}
            >
              <Ionicons name="add" size={22} color={colors.text} />
            </Pressable>
          </View>
          <Pressable style={styles.pickerConfirm} onPress={() => onConfirm(y, m)}>
            <Text style={styles.pickerConfirmText}>跳转</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
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
  appTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  todayCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  todayLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  todayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareOverlay: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: contentPadding,
    paddingVertical: spacing.md,
    marginTop: 40,
  },
  shareTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  shareScroll: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  shareActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: contentPadding,
    paddingVertical: spacing.lg,
    backgroundColor: '#F5F8FC',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  shareBtnWarm: {
    backgroundColor: colors.coral,
  },
  shareBtnText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  todayValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  todayValue: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.primary,
  },
  todayUnit: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  todayHint: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCard: {
    width: '78%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  pickerTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    color: colors.text,
    marginHorizontal: spacing.xl,
    minWidth: 90,
    textAlign: 'center',
  },
  pickerConfirm: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  pickerConfirmText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

