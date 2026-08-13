import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { BUILTIN_SPORTS } from '../constants/sports';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Phase = 'training' | 'rest';

// 计时器可选运动：仅时长型（记录时长合理）
const TIMER_SPORTS = BUILTIN_SPORTS.filter((s) => s.kind === 'duration');

export default function WorkoutTimer({
  onFinish,
}: {
  onFinish?: (sport: string, durationMin: number) => void;
} = {}) {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const [phase, setPhase] = useState<Phase>('training');
  const [group, setGroup] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0); // 当前阶段总时长
  // 设置
  const [sport, setSport] = useState(TIMER_SPORTS[0]?.name ?? '跑步');
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [workMin, setWorkMin] = useState('1');
  const [workSec, setWorkSec] = useState('0');
  const [restSec, setRestSec] = useState('30');
  const [groups, setGroups] = useState('3');
  const workRef = useRef(0); // 累计实际训练秒（不含休息）

  const vibrate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  // 解析训练总秒数（分×60+秒；空值默认 1 分；0 分 0 秒兜底 60 秒）
  const parseWorkSec = (): number => {
    const m = parseInt(workMin, 10);
    const s = parseInt(workSec, 10);
    const total = (Number.isFinite(m) ? m : 1) * 60 + (Number.isFinite(s) ? s : 0);
    return total > 0 ? total : 60;
  };
  // 解析休息秒数（空值默认 30，允许 0）
  const parseRestSec = (): number => {
    const r = parseInt(restSec, 10);
    return Number.isFinite(r) ? r : 30;
  };

  const start = () => {
    workRef.current = 0;
    const w = parseWorkSec();
    setPhase('training');
    setGroup(1);
    setSeconds(w);
    setTotalSeconds(w);
    setStatus('running');
    vibrate();
  };

  const phaseEnd = () => {
    vibrate();
    if (phase === 'training') {
      if (group >= (parseInt(groups, 10) || 3)) {
        setStatus('finished');
      } else {
        const r = parseRestSec();
        setPhase('rest');
        setSeconds(r);
        setTotalSeconds(r);
      }
    } else {
      const w = parseWorkSec();
      setPhase('training');
      setGroup((g) => g + 1);
      setSeconds(w);
      setTotalSeconds(w);
    }
  };

  useEffect(() => {
    if (status !== 'running') return;
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s > 0 && phase === 'training') workRef.current += 1; // 累计实际训练秒
        return Math.max(s - 1, 0);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, phase, group]);

  // 阶段倒计时归零 → 切换下一阶段
  useEffect(() => {
    if (status === 'running' && seconds === 0) {
      phaseEnd();
    }
  }, [seconds, status, phase, group]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss < 10 ? '0' + ss : ss}`;
  };
  const totalGroups = parseInt(groups, 10) || 3;

  /* 设置 / 完成 界面 */
  if (status === 'idle' || status === 'finished') {
    const durationMin = Math.round((workRef.current / 60) * 10) / 10;
    return (
      <View style={styles.card}>
        <Text style={styles.title}>⏱ 训练计时器</Text>
        {status === 'finished' && <Text style={styles.finishText}>🎉 训练完成，干得漂亮！</Text>}
        {status === 'finished' && onFinish ? (
          <Pressable style={styles.recordBtn} onPress={() => onFinish(sport, durationMin)}>
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.recordBtnText}>
              记录本次训练（{sport} · {durationMin} 分钟）
            </Text>
          </Pressable>
        ) : null}
        <Text style={styles.label}>运动类型</Text>
        <Pressable style={styles.select} onPress={() => setShowSportPicker(true)}>
          <Text style={styles.selectText}>{sport}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.setRow}>
          <View style={styles.setItem}>
            <Text style={styles.label}>训练(分)</Text>
            <TextInput
              style={styles.input}
              value={workMin}
              onChangeText={(t) => setWorkMin(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.setItem}>
            <Text style={styles.label}>训练(秒)</Text>
            <TextInput
              style={styles.input}
              value={workSec}
              onChangeText={(t) => setWorkSec(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <View style={styles.setRow}>
          <View style={styles.setItem}>
            <Text style={styles.label}>休息(秒)</Text>
            <TextInput
              style={styles.input}
              value={restSec}
              onChangeText={(t) => setRestSec(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.setItem}>
            <Text style={styles.label}>组数</Text>
            <TextInput
              style={styles.input}
              value={groups}
              onChangeText={(t) => setGroups(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Pressable style={styles.startBtn} onPress={start}>
          <Text style={styles.startBtnText}>{status === 'finished' ? '再来一轮' : '开始训练'}</Text>
        </Pressable>
        <SportPickerM
          visible={showSportPicker}
          onClose={() => setShowSportPicker(false)}
          onSelect={(n) => {
            setSport(n);
            setShowSportPicker(false);
          }}
        />
      </View>
    );
  }

  /* 运行界面：时钟圆环（蓝色弧随时间消退） */
  const pct = totalSeconds > 0 ? Math.max(seconds / totalSeconds, 0) : 0;
  const size = 180;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>⏱ 训练计时器</Text>
      <View style={styles.clockWrap}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E8F0FA" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.primary}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - pct)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.clockCenter}>
          <Text style={styles.phaseText}>{phase === 'training' ? '🏃 训练中' : '☕ 休息中'}</Text>
          <Text style={styles.countdown}>{fmt(seconds)}</Text>
          <Text style={styles.groupText}>
            第 {group} 组 / 共 {totalGroups} 组
          </Text>
        </View>
      </View>
      <View style={styles.btnRow}>
        <Pressable
          style={[styles.ctrlBtn, styles.ctrlGhost]}
          onPress={() => setStatus(status === 'paused' ? 'running' : 'paused')}
        >
          <Ionicons name={status === 'paused' ? 'play' : 'pause'} size={20} color={colors.primary} />
          <Text style={styles.ctrlText}>{status === 'paused' ? '继续' : '暂停'}</Text>
        </Pressable>
        <Pressable style={[styles.ctrlBtn, styles.ctrlGhost]} onPress={phaseEnd}>
          <Ionicons name="play-skip-forward" size={20} color={colors.primary} />
          <Text style={styles.ctrlText}>跳过</Text>
        </Pressable>
        <Pressable style={[styles.ctrlBtn, styles.ctrlDanger]} onPress={() => setStatus('finished')}>
          <Ionicons name="stop" size={20} color="#FFFFFF" />
          <Text style={styles.ctrlTextW}>结束</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SportPickerM({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>选择运动</Text>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {TIMER_SPORTS.map((s) => (
              <Pressable key={s.name} style={styles.pickerItem} onPress={() => onSelect(s.name)}>
                <Text style={styles.pickerItemText}>
                  {s.emoji} {s.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
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
  clockWrap: {
    position: 'relative',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: spacing.md,
  },
  clockCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  finishText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.coral,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  recordBtnText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
  },
  selectText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.text,
  },
  setRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  setItem: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.bg,
    textAlign: 'center',
  },
  startBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  startBtnText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  phaseText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  countdown: {
    fontFamily: fontFamily.title,
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  groupText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ctrlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
  ctrlGhost: {
    backgroundColor: colors.primaryBg,
  },
  ctrlDanger: {
    backgroundColor: colors.coral,
  },
  ctrlText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  ctrlTextW: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCard: {
    width: '80%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  pickerTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pickerList: {
    maxHeight: 360,
  },
  pickerItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.text,
  },
});

