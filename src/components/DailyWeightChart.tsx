import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { daysInMonth } from '../utils/date';
import { round1 } from '../utils/calc';
import { colors } from '../theme/theme';

export interface DayWeight {
  day: number; // 1-31
  weight: number;
}

interface Props {
  year: number;
  month: number; // 0 基
  records: DayWeight[]; // 本月有记录的天
  width: number; // 容器宽度
  height?: number;
}

const LEFT = 34; // y 轴标签区
const RIGHT = 12;
const TOP = 16;
const BOTTOM = 24; // x 轴标签区
const MIN_DAY_W = 26; // 每天最小宽度（间距适中，天数多时可横向拖动）

/**
 * 本月按日体重折线图：
 * x 轴为整月每天，仅有记录的天显示数据点，折线只连接有记录的日子。
 * 天数多时图表自动变长，可左右拖动查看整月。
 */
export default function DailyWeightChart({
  year,
  month,
  records,
  width,
  height = 220,
}: Props) {
  const days = daysInMonth(year, month);
  const minDayW = Math.max(MIN_DAY_W, (width - LEFT - RIGHT) / days);
  const svgWidth = Math.max(width, LEFT + days * minDayW + RIGHT);
  const plotW = svgWidth - LEFT - RIGHT;
  const plotH = height - TOP - BOTTOM;
  const dayW = plotW / days;

  const x = (day: number) => LEFT + (day - 0.5) * dayW;

  const weights = records.map((r) => r.weight);
  const rawMin = weights.length ? Math.min(...weights) : 0;
  const rawMax = weights.length ? Math.max(...weights) : 1;
  const minW = Math.max(0, Math.floor(rawMin - 2));
  const maxW = Math.ceil(rawMax + 2);
  const range = maxW - minW || 1;
  const y = (w: number) => TOP + (1 - (w - minW) / range) * plotH;

  const sorted = [...records].sort((a, b) => a.day - b.day);

  const gridCount = 4;
  const gridVals = Array.from(
    { length: gridCount + 1 },
    (_, i) => minW + (range / gridCount) * i
  );
  const polyPoints = sorted.map((r) => `${x(r.day)},${y(r.weight)}`).join(' ');

  // x 轴标签稀疏显示，避免拥挤
  const xLabels = Array.from({ length: days }, (_, i) => i + 1).filter(
    (d) => d === 1 || d % 5 === 0 || d === days
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ width }}
    >
      <Svg width={svgWidth} height={height}>
        {/* 水平网格 + y 轴标签 */}
        {gridVals.map((v, i) => (
          <React.Fragment key={i}>
            <Line
              x1={LEFT}
              x2={svgWidth - RIGHT}
              y1={y(v)}
              y2={y(v)}
              stroke={colors.border}
              strokeWidth={1}
            />
            <SvgText
              x={LEFT - 6}
              y={y(v) + 3}
              fontSize={9}
              fill={colors.textMuted}
              textAnchor="end"
            >
              {round1(v)}
            </SvgText>
          </React.Fragment>
        ))}
        {/* 折线：只连接有记录的日子 */}
        {sorted.length > 1 && (
          <Polyline
            points={polyPoints}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {/* 数据点：仅有记录的天 */}
        {sorted.map((r) => (
          <Circle
            key={r.day}
            cx={x(r.day)}
            cy={y(r.weight)}
            r={4}
            fill={colors.coral}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
        ))}
        {/* x 轴标签：日期 */}
        {xLabels.map((d) => (
          <SvgText
            key={d}
            x={x(d)}
            y={height - 8}
            fontSize={9}
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {d}
          </SvgText>
        ))}
      </Svg>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
