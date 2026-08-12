import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Phase = 'training' | 'rest';

/** 内置训练计时器：自动循环 训练→休息→训练…，时钟圆环蓝色随时间消退 */
export default function WorkoutTimer() {
  const player = useAudioPlayer(require('../../assets/beep.wav'));
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const [phase, setPhase] = useState<Phase>('training');
  const [group, setGroup] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0); // 当前阶段总时长
  // 设置
  const [workMin, setWorkMin] = useState('1');
  const [workSec, setWorkSec] = useState('0');
  const [restSec, setRestSec] = useState('30');
  const [groups, setGroups] = useState('3');

  const beep = () => {
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // 忽略
    }
  };
  const vibrate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const start = () => {
    const w = (parseInt(workMin, 10) || 1) * 60 + (parseInt(workSec, 10) || 0);
    setPhase('training');
    setGroup(1);
    setSeconds(w);
    setTotalSeconds(w);
    setStatus('running');
    vibrate();
    beep();
  };

  const phaseEnd = () => {
    vibrate();
    beep();
    if (phase === 'training') {
      if (group >= (parseInt(groups, 10) || 3)) {
        setStatus('finished');
      } else {
        const r = parseInt(restSec, 10) || 30;
        setPhase('rest');
        setSeconds(r);
        setTotalSeconds(r);
      }
    } else {
      const w = (parseInt(workMin, 10) || 1) * 60 + (parseInt(workSec, 10) || 0);
      setPhase('training');
      setGroup((g) => g + 1);
      setSeconds(w);
      setTotalSeconds(w);
    }
  };

  useEffect(() => {
    if (status !== 'running') return;
    const timer = setInterval(() => {
      setSeconds((s) => Math.max(s - 1, 0));
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
    return (
      <View style={styles.card}>
        <Text style={styles.title}>⏱ 训练计时器</Text>
        {status === 'finished' && <Text style={styles.finishText}>🎉 训练完成，干得漂亮！</Text>}
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

