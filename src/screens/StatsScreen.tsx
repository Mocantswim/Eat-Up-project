import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import Segmented, { type SegmentOption } from '../components/Segmented';
import EmptyState from '../components/EmptyState';
import DailyWeightChart, { type DayWeight } from '../components/DailyWeightChart';
import { getExercisesBetween } from '../db/exerciseLogDao';
import { getWeightRecordsBetween } from '../db/weightRecordDao';
import { pad2, toDateKey } from '../utils/date';
import { round1 } from '../utils/calc';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type ChartTab = 'daily' | 'weight' | 'sport';
type BarRange = 'week' | 'month';
type WeightRange = '1m' | '3m' | '1y';

interface BarDatum {
  value: number;
  label: string;
  frontColor?: string;
}

const CHART_TABS: SegmentOption<ChartTab>[] = [
  { key: 'daily', label: '每日消耗' },
  { key: 'weight', label: '体重趋势' },
  { key: 'sport', label: '运动分布' },
];
const BAR_RANGES: SegmentOption<BarRange>[] = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
];
const WEIGHT_RANGES: SegmentOption<WeightRange>[] = [
  { key: '1m', label: '近一月' },
  { key: '3m', label: '近三月' },
  { key: '1y', label: '近一年' },
];
const PIE_COLORS = [
  '#4A90E2',
  '#5DADE2',
  '#FFAB91',
  '#FF6F61',
  '#58B368',
  '#F4B400',
  '#9B6BD9',
  '#4ECDC4',
  '#95A5A6',
  '#E67E22',
];

/** gifted-charts 的 width 不含 y 轴标签，实际总宽 = width + yAxisLabelWidth */
const Y_AXIS_LABEL_WIDTH = 32;

/** 根据数据点数与可用宽度，动态计算柱宽/间距，保证图表不溢出屏幕（含窄屏/月度 31 天） */
function computeBarMetrics(count: number, chartWidth: number) {
  const initialSpacing = 8;
  const endSpacing = 8;
  const avail = Math.max(chartWidth - initialSpacing - endSpacing, 10);
  const safeCount = Math.max(count, 1);
  // barWidth * (count + 0.4 * (count-1)) <= avail  →  barWidth <= avail / (1.4*count - 0.4)
  const barWidth = Math.max(3, Math.floor(avail / (1.4 * safeCount - 0.4)));
  const spacing = Math.max(1, Math.floor(barWidth * 0.4));
  return { barWidth, spacing };
}

/** 统计页：三种图表 + 横屏支持（策划书 §2.4 / 决策 #8） */
export default function StatsScreen() {
  const [tab, setTab] = useState<ChartTab>('daily');
  const [barRange, setBarRange] = useState<BarRange>('week');
  const [weightRange, setWeightRange] = useState<WeightRange>('3m');
  const [barData, setBarData] = useState<BarDatum[]>([]);
  const [barRangeText, setBarRangeText] = useState('');
  const [weightData, setWeightData] = useState<{ value: number; label?: string }[]>([]);
  const [dailyWeights, setDailyWeights] = useState<DayWeight[]>([]);
  const [weightRangeText, setWeightRangeText] = useState('');
  const [pieData, setPieData] = useState<{ value: number; text: string; color: string }[]>([]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // 竞态保护：快速切换周/月时，只让最后一次请求的结果生效
  const loadSeq = useRef(0);

  // 统计页允许横屏，离开恢复竖屏（决策 #8）
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.unlockAsync().catch(() => {});
      return () => {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        ).catch(() => {});
      };
    }, [])
  );

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    const now = new Date();
    if (tab === 'daily') {
      const start = new Date(now);
      if (barRange === 'week') start.setDate(now.getDate() - 6);
      else start.setDate(1);
      const logs = await getExercisesBetween(toDateKey(start), toDateKey(now));
      const map = new Map<string, number>();
      logs.forEach((l) => map.set(l.date, (map.get(l.date) ?? 0) + l.calories));
      const isMonth = barRange === 'month';
      const data: BarDatum[] = [];
      const cursor = new Date(start);
      while (cursor <= now) {
        const key = toDateKey(cursor);
        const v = round1(map.get(key) ?? 0);
        data.push({
          value: v,
          // 本月视图：仅运动日显示标签，避免把日期数字误认为月份
          label: v > 0 || !isMonth ? `${cursor.getDate()}` : '',
          // 本月视图：无运动的天用透明柱隐藏，视觉只留有效柱
          frontColor: isMonth && v === 0 ? 'transparent' : colors.primary,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      if (seq !== loadSeq.current) return;
      setBarData(data);
      const fmtRange = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
      setBarRangeText(
        isMonth
          ? `${now.getFullYear()}年${now.getMonth() + 1}月 · 1日 - ${now.getDate()}日`
          : `${fmtRange(start)} - ${fmtRange(now)}`
      );
    } else if (tab === 'weight') {
      if (weightRange === '1m') {
        // 近一月：本月按日，仅保留本月的记录
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const records = await getWeightRecordsBetween(toDateKey(start), toDateKey(now));
        if (seq !== loadSeq.current) return;
        setDailyWeights(
          records.map((r) => ({
            day: parseInt(r.date.slice(8, 10), 10),
            weight: r.weight,
          }))
        );
        setWeightData([]);
        setWeightRangeText(
          `${now.getFullYear()}年${now.getMonth() + 1}月 · ${records.length} 条记录`
        );
      } else {
        // 近三月 / 近一年：按月份聚合，取每月平均体重
        const start = new Date(now);
        if (weightRange === '3m') start.setMonth(now.getMonth() - 3);
        else start.setFullYear(now.getFullYear() - 1);
        const records = await getWeightRecordsBetween(toDateKey(start), toDateKey(now));
        if (seq !== loadSeq.current) return;
        const monthly = new Map<string, { sum: number; count: number }>();
        records.forEach((r) => {
          const monthKey = r.date.slice(0, 7); // YYYY-MM
          const cur = monthly.get(monthKey) ?? { sum: 0, count: 0 };
          cur.sum += r.weight;
          cur.count += 1;
          monthly.set(monthKey, cur);
        });
        setWeightData(
          [...monthly.entries()]
            .sort((a, b) => (a[0] < b[0] ? -1 : 1))
            .map(([monthKey, { sum, count }]) => ({
              value: round1(sum / count),
              label: `${parseInt(monthKey.slice(5, 7))}月`,
            }))
        );
        setDailyWeights([]);
        const fmtRangeW = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
        setWeightRangeText(
          `${fmtRangeW(start)} - ${fmtRangeW(now)} · ${monthly.size} 个月 · ${records.length} 条记录`
        );
      }
    } else {
      const startKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-01`;
      const logs = await getExercisesBetween(startKey, toDateKey(now));
      const map = new Map<string, number>();
      logs.forEach((l) => map.set(l.sportType, (map.get(l.sportType) ?? 0) + l.calories));
      const data = [...map.entries()].map(([name, value], i) => ({
        value: round1(value),
        text: name,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }));
      if (seq !== loadSeq.current) return;
      setPieData(data);
    }
  }, [tab, barRange, weightRange]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const chartWidth = Math.min(
    width - contentPadding * 2 - spacing.lg * 2,
    420
  );
  const nowDate = new Date();
  // gifted-charts 总宽 = width + yAxisLabelWidth，所以 width 要减去 y 轴标签宽度
  const barsWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const barMetrics = computeBarMetrics(barData.length, barsWidth);
  const hasAnyPositive = barData.some((d) => d.value > 0);
  // 周/月视图：全 0 或未加载都显示明确的空态说明，避免"空白消失"的观感
  const showEmptyDaily = barData.length === 0 || !hasAnyPositive;
  const barMax = barData.length > 0 ? Math.max(...barData.map((d) => d.value)) : 0;
  const chartMaxValue = barMax > 0 ? Math.ceil(barMax * 1.1) : 100;
  // 图表摘要：运动天数 + 总消耗（诊断数据是否正确加载）
  const positiveDays = barData.filter((d) => d.value > 0).length;
  const totalCal = round1(barData.reduce((s, d) => s + d.value, 0));
  // 顶部数值标签：仅“本周”视图显示（柱宽足够），避免窄柱把数值裁掉/重叠
  const showTopLabels = barRange === 'week';
  const barDataWithLabels = barData.map((d) => ({
    ...d,
    topLabelComponent:
      showTopLabels && d.value > 0
        ? () => (
            <Text style={styles.barTopLabel}>{d.value}</Text>
          )
        : undefined,
  }));
  // 体重折线图：设置 Y 轴上限贴合记录范围（留 2kg 缓冲），让曲线清晰可见
  const weightMax =
    weightData.length > 0
      ? Math.ceil(Math.max(...weightData.map((d) => d.value)) + 2)
      : 1;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>统计</Text>

        <Segmented options={CHART_TABS} value={tab} onChange={setTab} />

        <View style={styles.rangeRow}>
          {tab === 'daily' && (
            <Segmented options={BAR_RANGES} value={barRange} onChange={setBarRange} />
          )}
          {tab === 'weight' && (
            <Segmented options={WEIGHT_RANGES} value={weightRange} onChange={setWeightRange} />
          )}
        </View>

        {tab === 'daily' && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {barRange === 'week' ? '近 7 日每日消耗' : '本月每日消耗'}
            </Text>
            <Text style={styles.chartSubTitle}>
              {barRangeText} · 运动 {positiveDays} 天 · 共 {totalCal} kcal
            </Text>
            {showEmptyDaily ? (
              <EmptyState
                emoji="🏃"
                text={
                  barRange === 'week'
                    ? '本周暂无运动记录，去首页添加吧'
                    : '本月暂无运动记录，去首页添加吧'
                }
              />
            ) : (
              <BarChart
                key={barRange}
                data={barDataWithLabels}
                width={barsWidth}
                yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
                height={240}
                maxValue={chartMaxValue}
                frontColor={colors.primary}
                barWidth={barMetrics.barWidth}
                spacing={barMetrics.spacing}
                initialSpacing={8}
                endSpacing={8}
                noOfSections={4}
                intactTopLabel
                yAxisTextNumberOfLines={2}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
              />
            )}
          </View>
        )}

        {tab === 'weight' && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {weightRange === '1m' ? '体重变化 · 本月按日' : '体重变化 · 按月平均'}
            </Text>
            <Text style={styles.chartSubTitle}>{weightRangeText}</Text>
            {weightRange === '1m' ? (
              dailyWeights.length === 0 ? (
                <EmptyState
                  emoji="⚖️"
                  text="本月还没有体重记录。到任意日期的详情页填写“今日体重”"
                />
              ) : (
                <DailyWeightChart
                  year={nowDate.getFullYear()}
                  month={nowDate.getMonth()}
                  records={dailyWeights}
                  width={barsWidth}
                />
              )
            ) : weightData.length === 0 ? (
              <EmptyState
                emoji="⚖️"
                text="还没有体重记录。到任意日期的详情页填写“今日体重”，不同月份各记一次可看到趋势"
              />
            ) : (
              <LineChart
                data={weightData}
                width={barsWidth}
                yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
                height={240}
                maxValue={weightMax}
                spacing={40}
                initialSpacing={10}
                endSpacing={10}
                thickness={2.5}
                color={colors.primary}
                hideDataPoints={false}
                dataPointsColor={colors.coral}
                dataPointsRadius={4}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                yAxisTextNumberOfLines={2}
                isAnimated
              />
            )}
          </View>
        )}

        {tab === 'sport' && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>本月运动消耗占比</Text>
            {pieData.length === 0 ? (
              <EmptyState text="本月暂无消耗数据" />
            ) : (
              <>
                <PieChart
                  data={pieData}
                  donut
                  radius={90}
                  innerRadius={55}
                  innerCircleColor={colors.card}
                  showText={false}
                  centerLabelComponent={() => (
                    <Text style={styles.pieCenterText}>本月{'\n'}消耗</Text>
                  )}
                />
                {/* 图例：颜色点 + 运动名 + 消耗 */}
                <View style={styles.legendList}>
                  {pieData.map((item) => (
                    <View key={item.text} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendName} numberOfLines={1}>
                        {item.text}
                      </Text>
                      <Text style={styles.legendValue}>{item.value} kcal</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
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
  title: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  rangeRow: {
    marginTop: spacing.lg,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  chartWrap: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  overlayHint: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayHintText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  chartTitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    alignSelf: 'flex-start',
  },
  chartSubTitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  barTopLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
  pieCenterText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legendList: {
    width: '100%',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  legendName: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  legendValue: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

