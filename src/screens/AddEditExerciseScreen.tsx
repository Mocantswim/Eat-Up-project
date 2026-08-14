import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../components/Header';
import SportIcon from '../components/SportIcon';
import { BUILTIN_SPORTS, getSportAddBodyWeight, getSportFactor, MUSCLE_GROUPS, type SportKind } from '../constants/sports';
import {
  addExercise,
  calcExerciseCalories,
  getExerciseById,
  updateExercise,
  type ExerciseInput,
} from '../db/exerciseLogDao';
import {
  addCustomSport,
  customSportNameExists,
  getAllCustomSports,
} from '../db/customSportDao';
import { getProfile, type UserProfile } from '../db/userProfileDao';
import type { HomeStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddEditExercise'>;

interface SportOption {
  name: string;
  met: number;
  emoji: string;
  custom: boolean;
  kind: SportKind; // 默认模式
  modes?: SportKind[]; // 可用记录模式
  factor?: number;
  perUnitKcal?: number; // 自定义次数型：每 1 个消耗 kcal
  addBodyWeight?: boolean; // 重量型：含自重（深蹲）
  distanceFactor?: number; // 距离型
  distanceKcal?: number; // 自定义距离型：每 km kcal
  weightFactor?: number; // 自定义重量型
  groupId?: string;
  groupName?: string;
  typeName?: string;
}

// 模式中文标签
const MODE_LABELS: Record<SportKind, string> = {
  duration: '⏱ 按时长',
  reps: '🔢 按次数',
  weight: '🏋️ 重量',
  distance: '📏 按距离',
};

/** 添加/编辑运动（策划书 §2.1.3，支持 时长/次数/重量 三种模式） */
export default function AddEditExerciseScreen({ navigation, route }: Props) {
  const { date, logId, prefillSport, prefillDurationMin } = route.params;
  const isEdit = logId != null;

  const [options, setOptions] = useState<SportOption[]>([]);
  const [selected, setSelected] = useState<SportOption | null>(null);
  const [selectedMode, setSelectedMode] = useState<SportKind>('duration');
  const [duration, setDuration] = useState('');
  const [reps, setReps] = useState('');
  const [loadKg, setLoadKg] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [note, setNote] = useState('');
  const [noteHeight, setNoteHeight] = useState(42);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [saving, setSaving] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);

  const loadBase = useCallback(async () => {
    const [customs, p] = await Promise.all([getAllCustomSports(), getProfile()]);
    setOptions([
      ...BUILTIN_SPORTS.map((s) => ({
        id: s.id,
        name: s.name,
        met: s.met,
        emoji: s.emoji,
        custom: false,
        kind: s.kind,
        modes: s.modes,
        factor: s.kind === 'reps' ? s.repFactor : s.kind === 'weight' ? s.weightFactor : undefined,
        addBodyWeight: s.addBodyWeight,
        distanceFactor: s.distanceFactor,
        groupId: s.groupId,
        groupName: s.groupName,
        typeName: s.typeName,
      })),
      ...customs.map((c) => ({
        id: `custom-${c.name}`,
        name: c.name,
        met: c.metValue,
        emoji: '🏅',
        custom: true,
        kind: c.kind ?? 'duration',
        modes: [c.kind ?? 'duration'],
        perUnitKcal: c.perUnitKcal ?? undefined,
        distanceKcal: c.distanceKcal ?? undefined,
        weightFactor: c.weightFactor ?? undefined,
        groupId: 'custom',
        groupName: '自定义',
        typeName: '自定义',
      })),
    ]);
    setProfile(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBase();
    }, [loadBase])
  );

  // 编辑模式：预填原记录
  useEffect(() => {
    if (!logId) return;
    (async () => {
      const log = await getExerciseById(logId);
      if (log) {
        const emoji = BUILTIN_SPORTS.find((s) => s.name === log.sportType)?.emoji ?? '🏅';
        const factor = getSportFactor(log.sportType) || undefined;
        setSelected({
          name: log.sportType,
          met: log.metValue,
          emoji,
          custom: false,
          kind: log.kind,
          factor,
          perUnitKcal: log.perUnitKcal ?? undefined,
          addBodyWeight: getSportAddBodyWeight(log.sportType),
        });
        setSelectedMode(log.kind);
        setDuration(log.kind === 'duration' && log.durationMin > 0 ? String(log.durationMin) : '');
        setReps(log.reps != null ? String(log.reps) : '');
        setLoadKg(log.loadKg != null ? String(log.loadKg) : '');
        setNote(log.note ?? '');
      }
    })();
  }, [logId]);

  // 计时器打通：options 加载后应用预填（运动类型 + 时长）
  useEffect(() => {
    if (isEdit || prefillApplied || !prefillSport || options.length === 0) return;
    const opt = options.find((o) => o.name === prefillSport && o.kind === 'duration');
    if (opt) {
      setSelected(opt);
      if (prefillDurationMin && prefillDurationMin > 0) {
        setDuration(String(prefillDurationMin));
      }
    }
    setPrefillApplied(true);
  }, [options, prefillSport, prefillDurationMin, isEdit, prefillApplied]);

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    if (!kw) return options;
    // 全搜索：动作名 / 类型名 / 肌群名 均可匹配
    return options.filter((o) =>
      `${o.name} ${o.typeName ?? ''} ${o.groupName ?? ''}`.includes(kw)
    );
  }, [options, keyword]);

  const estimated = useMemo(() => {
    if (!selected || !profile?.weight) return 0;
    const mode = selectedMode;
    if (mode === 'reps') {
      const r = parseFloat(reps);
      if (isNaN(r) || r <= 0) return 0;
      return calcExerciseCalories({
        date, sportType: selected.name, kind: 'reps', reps: r,
        met: selected.met, factor: selected.factor ?? getSportFactor(selected.name),
        perUnitKcal: selected.perUnitKcal, weightKg: profile.weight,
      });
    }
    if (mode === 'weight') {
      const w = parseFloat(loadKg);
      const r = parseFloat(reps);
      if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) return 0;
      return calcExerciseCalories({
        date, sportType: selected.name, kind: 'weight', loadKg: w, reps: r,
        met: selected.met, factor: selected.factor ?? getSportFactor(selected.name),
        addBodyWeight: selected.addBodyWeight, weightKg: profile.weight,
      });
    }
    if (mode === 'distance') {
      const km = parseFloat(distanceKm);
      if (isNaN(km) || km <= 0) return 0;
      return calcExerciseCalories({
        date, sportType: selected.name, kind: 'distance', distance: km,
        met: selected.met, factor: selected.distanceFactor ?? 0,
        distanceKcal: selected.distanceKcal, weightKg: profile.weight,
      });
    }
    const d = parseFloat(duration);
    if (isNaN(d) || d <= 0) return 0;
    return calcExerciseCalories({
      date, sportType: selected.name, kind: 'duration', durationMin: d,
      met: selected.met, weightKg: profile.weight,
    });
  }, [selected, selectedMode, duration, reps, loadKg, distanceKm, profile, date]);

  const handleSave = async () => {
    if (saving) return;
    if (!selected) {
      Alert.alert('提示', '请选择运动类型');
      return;
    }
    if (!profile?.weight) {
      Alert.alert('提示', '请先在“我的”中设置体重，才能计算消耗');
      return;
    }

    const base = {
      date,
      sportType: selected.name,
      met: selected.met,
      weightKg: profile.weight,
      note: note.trim() || null,
    };
    let input;
    if (selectedMode === 'reps') {
      const r = parseInt(reps, 10);
      if (!reps.trim() || isNaN(r) || r <= 0 || r > 9999) {
        Alert.alert('提示', '请输入有效的次数（1-9999）');
        return;
      }
      input = {
        ...base,
        kind: 'reps' as SportKind,
        reps: r,
        factor: selected.factor ?? getSportFactor(selected.name),
        perUnitKcal: selected.perUnitKcal,
      };
    } else if (selectedMode === 'weight') {
      const w = parseFloat(loadKg);
      const r = parseInt(reps, 10);
      if (!loadKg.trim() || isNaN(w) || w <= 0 || w > 500) {
        Alert.alert('提示', '请输入有效的重量（kg）');
        return;
      }
      if (!reps.trim() || isNaN(r) || r <= 0 || r > 9999) {
        Alert.alert('提示', '请输入有效的次数（1-9999）');
        return;
      }
      input = {
        ...base,
        kind: 'weight' as SportKind,
        loadKg: w,
        reps: r,
        factor: selected.factor ?? getSportFactor(selected.name),
        addBodyWeight: selected.addBodyWeight,
      };
    } else if (selectedMode === 'distance') {
      const km = parseFloat(distanceKm);
      if (!distanceKm.trim() || isNaN(km) || km <= 0 || km > 500) {
        Alert.alert('提示', '请输入有效的距离（km）');
        return;
      }
      input = {
        ...base,
        kind: 'distance' as SportKind,
        distance: km,
        factor: selected.distanceFactor ?? 0,
        distanceKcal: selected.distanceKcal,
      };
    } else {
      const d = parseFloat(duration);
      if (!duration.trim() || isNaN(d) || d <= 0) {
        Alert.alert('提示', '请输入有效时长（分钟）');
        return;
      }
      if (d > 1440) {
        Alert.alert('提示', '时长不能超过 1440 分钟（24 小时）');
        return;
      }
      input = { ...base, kind: 'duration' as SportKind, durationMin: d };
    }

    setSaving(true);
    try {
      if (isEdit && logId != null) {
        await updateExercise(logId, input);
      } else {
        await addExercise(input);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('出错了', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  /** 从选择器内新增自定义运动后：记录本次成果到当天并返回 */
  const handleSportCreated = useCallback(
    async (
      name: string,
      met: number,
      kind: SportKind = 'duration',
      perUnitKcal?: number,
      distanceKcal?: number,
      weightFactor?: number,
      resultA?: number,
      resultB?: number
    ) => {
      // 未填成果：仅创建运动并选中（不做记录）
      if (resultA == null) {
        setSelected({
          name,
          met,
          emoji: '🏅',
          custom: true,
          kind,
          modes: [kind],
          perUnitKcal,
          distanceKcal,
          weightFactor,
        });
        setPickerVisible(false);
        setKeyword('');
        await loadBase();
        return;
      }
      if (!profile?.weight) {
        Alert.alert('提示', '请先在“我的”中设置体重，才能记录');
        return;
      }
      // 记录本次成果到当天
      let input: ExerciseInput;
      if (kind === 'duration') {
        input = { date, sportType: name, kind, durationMin: resultA ?? 0, met, weightKg: profile.weight };
      } else if (kind === 'reps') {
        input = { date, sportType: name, kind, reps: resultA ?? 0, perUnitKcal, met, weightKg: profile.weight };
      } else if (kind === 'distance') {
        input = { date, sportType: name, kind, distance: resultA ?? 0, distanceKcal, met, weightKg: profile.weight };
      } else {
        input = {
          date, sportType: name, kind, loadKg: resultB ?? 0, reps: resultA ?? 0,
          factor: weightFactor ?? 0, met, weightKg: profile.weight,
        };
      }
      try {
        await addExercise(input);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {
        Alert.alert('出错了', '运动已创建，但记录失败，请手动添加');
      }
      setPickerVisible(false);
      setKeyword('');
      await loadBase();
      navigation.goBack();
    },
    [date, profile, loadBase, navigation]
  );

  return (
    <View style={styles.root}>
      <Header title={isEdit ? '编辑运动' : '添加运动'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>运动类型 *</Text>
        <Pressable style={styles.select} onPress={() => setPickerVisible(true)}>
          {selected ? (
            <>
              <SportIcon emoji={selected.emoji} size={36} />
              <Text style={styles.selectName}>{selected.name}</Text>
              <Text style={styles.selectMet}>MET {selected.met}</Text>
            </>
          ) : (
            <>
              <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.selectPlaceholder}>选择或搜索运动类型</Text>
            </>
          )}
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </Pressable>

        {/* 记录方式切换（该运动支持多种模式时显示） */}
        {selected && (selected.modes?.length ?? 1) > 1 && (
          <>
            <Text style={styles.label}>记录方式</Text>
            <View style={styles.quickRow}>
              {(selected.modes ?? []).map((m) => {
                const active = selectedMode === m;
                return (
                  <Pressable
                    key={m}
                    style={[styles.quickBtn, active && styles.quickBtnActive]}
                    onPress={() => setSelectedMode(m)}
                  >
                    <Text style={[styles.quickBtnText, active && styles.quickBtnTextActive]}>
                      {MODE_LABELS[m]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* 输入区：按所选记录方式动态显示 */}
        {(!selected || selectedMode === 'duration') && (
          <>
            <Text style={styles.label}>时长（分钟）*</Text>
            <View style={styles.durationRow}>
              <TextInput
                style={styles.durationInput}
                value={duration}
                onChangeText={(t) => setDuration(t.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="如 30"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.durationUnit}>分钟</Text>
            </View>
            <View style={styles.quickRow}>
              {[15, 30, 45, 60].map((m) => {
                const active = duration === String(m);
                return (
                  <Pressable
                    key={m}
                    style={[styles.quickBtn, active && styles.quickBtnActive]}
                    onPress={() => setDuration(String(m))}
                  >
                    <Text style={[styles.quickBtnText, active && styles.quickBtnTextActive]}>
                      {m}分
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {selected && selectedMode === 'reps' && (
          <>
            <Text style={styles.label}>次数 *</Text>
            <View style={styles.durationRow}>
              <TextInput
                style={styles.durationInput}
                value={reps}
                onChangeText={(t) => setReps(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="如 15"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.durationUnit}>次</Text>
            </View>
            <Text style={styles.hintText}>
              按次数 × 体重({profile?.weight ?? '?'}kg) 估算
            </Text>
          </>
        )}

        {selected && selectedMode === 'weight' && (
          <>
            <Text style={styles.label}>重量（kg）*</Text>
            <View style={styles.durationRow}>
              <TextInput
                style={styles.durationInput}
                value={loadKg}
                onChangeText={(t) => setLoadKg(t.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder={selected.addBodyWeight ? '如 20（配重）' : '如 50'}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.durationUnit}>kg</Text>
            </View>
            <Text style={styles.label}>次数 *</Text>
            <View style={styles.durationRow}>
              <TextInput
                style={styles.durationInput}
                value={reps}
                onChangeText={(t) => setReps(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="如 20"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.durationUnit}>次</Text>
            </View>
            <Text style={styles.hintText}>
              {selected.addBodyWeight
                ? `按（体重 ${profile?.weight ?? '?'}kg + 配重）× 次数估算`
                : '按重量 × 次数估算'}
            </Text>
          </>
        )}

        {selected && selectedMode === 'distance' && (
          <>
            <Text style={styles.label}>距离（km）*</Text>
            <View style={styles.durationRow}>
              <TextInput
                style={styles.durationInput}
                value={distanceKm}
                onChangeText={(t) => setDistanceKm(t.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="如 5"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.durationUnit}>km</Text>
            </View>
            <Text style={styles.hintText}>
              按距离 × 体重({profile?.weight ?? '?'}kg) 估算
            </Text>
          </>
        )}

        {/* 运动笔记（选填） */}
        <Text style={styles.label}>运动笔记（选填）</Text>
        <View style={styles.noteWrap}>
          <TextInput
            style={[styles.noteInput, { height: noteHeight }]}
            value={note}
            onChangeText={(t) => setNote(t.slice(0, 100))}
            onContentSizeChange={(e) => {
              const h = e.nativeEvent.contentSize.height;
              setNoteHeight(Math.min(Math.max(h, 42), 84)); // 最多 3 行
            }}
            multiline
            placeholder="记录一下今天的感受…"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.noteCount}>{note.length}/100</Text>
        </View>

        {profile?.weight != null && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>预计消耗</Text>
            <Text style={styles.previewValue}>
              {estimated.toFixed(1)} <Text style={styles.previewUnit}>千卡</Text>
            </Text>
            <Text style={styles.previewMeta}>基于当前体重 {profile.weight}kg 估算</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{isEdit ? '保存修改' : '保存记录'}</Text>
        </Pressable>
      </ScrollView>

      <SportPicker
        visible={pickerVisible}
        options={filtered}
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSelect={(o) => {
          setSelected(o);
          setSelectedMode(o.kind);
          setPickerVisible(false);
          setKeyword('');
        }}
        onClose={() => {
          setPickerVisible(false);
          setKeyword('');
        }}
        onCreate={handleSportCreated}
      />
    </View>
  );
}

/** 运动类型选择器：Modal + 搜索 + 列表（内置 + 自定义 + 新增入口） */
function SportPicker({
  visible,
  options,
  keyword,
  onKeywordChange,
  onSelect,
  onClose,
  onCreate,
}: {
  visible: boolean;
  options: SportOption[];
  keyword: string;
  onKeywordChange: (v: string) => void;
  onSelect: (o: SportOption) => void;
  onClose: () => void;
  onCreate?: (
    name: string,
    met: number,
    kind?: SportKind,
    perUnitKcal?: number,
    distanceKcal?: number,
    weightFactor?: number,
    resultA?: number,
    resultB?: number
  ) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<SportKind>('duration');
  const [newMet, setNewMet] = useState('');
  const [newPerUnit, setNewPerUnit] = useState('');
  const [newDistanceKcal, setNewDistanceKcal] = useState('');
  const [newWeightFactor, setNewWeightFactor] = useState('');
  const [newResultA, setNewResultA] = useState(''); // 时长/个数/距离
  const [newResultB, setNewResultB] = useState(''); // 重量
  const [creating, setCreating] = useState(false);
  const insets = useSafeAreaInsets();

  // 按肌群分组（无搜索时折叠展示）
  const grouped = useMemo(() => {
    const order = MUSCLE_GROUPS.map((g) => g.name);
    const map = new Map<string, SportOption[]>();
    for (const o of options) {
      const key = o.groupName ?? '其他';
      const arr = map.get(key) ?? [];
      arr.push(o);
      map.set(key, arr);
    }
    const entries = [...map.entries()].sort(
      (a, b) => order.indexOf(a[0]) - order.indexOf(b[0])
    );
    const custom = entries.find((e) => e[0] === '自定义');
    const rest = entries.filter((e) => e[0] !== '自定义');
    return [...rest, ...(custom ? [custom] : [])];
  }, [options]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['有氧', '胸部']));
  const toggleGroup = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCreate = async () => {
    if (creating) return;
    const name = newName.trim();
    const mv = parseFloat(newMet);
    const pu = parseFloat(newPerUnit);
    const dk = parseFloat(newDistanceKcal);
    const wf = parseFloat(newWeightFactor);
    if (!name) {
      Alert.alert('提示', '请输入运动名称');
      return;
    }
    if (newKind === 'reps') {
      if (isNaN(pu) || pu <= 0 || pu > 100) {
        Alert.alert('提示', '请输入每 1 个消耗 kcal（0.1–100）');
        return;
      }
    } else if (newKind === 'distance') {
      if (isNaN(dk) || dk <= 0 || dk > 500) {
        Alert.alert('提示', '请输入每 1 公里消耗 kcal');
        return;
      }
    } else if (newKind === 'weight') {
      if (isNaN(wf) || wf <= 0 || wf > 10) {
        Alert.alert('提示', '请输入每 1kg×1 次消耗 kcal');
        return;
      }
    } else if (isNaN(mv) || mv <= 0) {
      Alert.alert('提示', '请输入有效 MET 值');
      return;
    }
    if (BUILTIN_SPORTS.some((s) => s.name === name)) {
      Alert.alert('提示', '该名称与内置运动重复，无需新建');
      return;
    }
    if (await customSportNameExists(name)) {
      Alert.alert('提示', '该运动名称已存在');
      return;
    }
    setCreating(true);
    try {
      const metVal = newKind === 'duration' ? mv : 0;
      await addCustomSport(
        name,
        metVal,
        newKind,
        newKind === 'reps' ? pu : null,
        newKind === 'distance' ? dk : null,
        newKind === 'weight' ? wf : null
      );
      onCreate?.(
        name,
        metVal,
        newKind,
        newKind === 'reps' ? pu : undefined,
        newKind === 'distance' ? dk : undefined,
        newKind === 'weight' ? wf : undefined,
        newResultA.trim() ? parseFloat(newResultA) : undefined,
        newResultB.trim() ? parseFloat(newResultB) : undefined
      );
      setShowCreate(false);
      setNewName('');
      setNewKind('duration');
      setNewMet('');
      setNewPerUnit('');
      setNewDistanceKcal('');
      setNewWeightFactor('');
      setNewResultA('');
      setNewResultB('');
    } catch {
      Alert.alert('出错了', '保存失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={[styles.pickerSheet, { paddingBottom: spacing.xxl + insets.bottom }]}>
          {showCreate ? (
            <ScrollView
              style={styles.createScroll}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>新增自定义运动</Text>
                <Pressable hitSlop={8} onPress={() => setShowCreate(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>
              <Text style={styles.label}>运动名称</Text>
              <TextInput
                style={styles.searchInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="如 深蹲"
                placeholderTextColor={colors.textMuted}
                maxLength={12}
              />
              <Text style={styles.label}>记录方式</Text>
              <View style={styles.kindGrid}>
                {(
                  [
                    ['duration', '⏱ 按时长'],
                    ['reps', '🔢 个数'],
                    ['distance', '📏 距离'],
                    ['weight', '🏋️ 重量'],
                  ] as [SportKind, string][]
                ).map(([k, label]) => {
                  const active = newKind === k;
                  return (
                    <Pressable
                      key={k}
                      style={[styles.quickBtn, styles.kindBtnHalf, active && styles.quickBtnActive]}
                      onPress={() => setNewKind(k)}
                    >
                      <Text style={[styles.quickBtnText, active && styles.quickBtnTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {newKind === 'duration' && (
                <>
                  <Text style={styles.label}>MET 值</Text>
                  <TextInput
                    style={styles.searchInput}
                    value={newMet}
                    onChangeText={(t) => setNewMet(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="如 5.0"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.hintText}>参考 MET：走路 3.0 · 跑步 8.0</Text>
                </>
              )}
              {newKind === 'reps' && (
                <>
                  <Text style={styles.label}>每 1 个消耗 kcal</Text>
                  <TextInput
                    style={styles.searchInput}
                    value={newPerUnit}
                    onChangeText={(t) => setNewPerUnit(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="如 0.5"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.hintText}>消耗 = 个数 × 每单位 kcal</Text>
                </>
              )}
              {newKind === 'distance' && (
                <>
                  <Text style={styles.label}>每 1 公里消耗 kcal</Text>
                  <TextInput
                    style={styles.searchInput}
                    value={newDistanceKcal}
                    onChangeText={(t) => setNewDistanceKcal(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="如 60"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.hintText}>消耗 = 距离(km) × 每公里 kcal</Text>
                </>
              )}
              {newKind === 'weight' && (
                <>
                  <Text style={styles.label}>每 1kg×1 次消耗 kcal</Text>
                  <TextInput
                    style={styles.searchInput}
                    value={newWeightFactor}
                    onChangeText={(t) => setNewWeightFactor(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="如 0.02"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.hintText}>记录时输入重量和次数，消耗 = 重量 × 次数 × 系数</Text>
                </>
              )}
              {/* 本次成果（选填）：填了保存会自动记录到今日运动 */}
              <Text style={styles.label}>本次成果（选填）</Text>
              {newKind === 'duration' && (
                <View style={styles.durationRow}>
                  <TextInput
                    style={styles.searchInput}
                    value={newResultA}
                    onChangeText={(t) => setNewResultA(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    placeholder="时长（分钟）如 30"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.durationUnit}>分</Text>
                </View>
              )}
              {newKind === 'reps' && (
                <TextInput
                  style={styles.searchInput}
                  value={newResultA}
                  onChangeText={(t) => setNewResultA(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="个数 如 20"
                  placeholderTextColor={colors.textMuted}
                />
              )}
              {newKind === 'distance' && (
                <View style={styles.durationRow}>
                  <TextInput
                    style={styles.searchInput}
                    value={newResultA}
                    onChangeText={(t) => setNewResultA(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    placeholder="距离(km) 如 5"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.durationUnit}>km</Text>
                </View>
              )}
              {newKind === 'weight' && (
                <>
                  <View style={styles.durationRow}>
                    <TextInput
                      style={styles.searchInput}
                      value={newResultB}
                      onChangeText={(t) => setNewResultB(t.replace(/[^0-9.]/g, ''))}
                      keyboardType="numeric"
                      placeholder="重量(kg) 如 50"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.durationUnit}>kg</Text>
                  </View>
                  <TextInput
                    style={styles.searchInput}
                    value={newResultA}
                    onChangeText={(t) => setNewResultA(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="个数 如 20"
                    placeholderTextColor={colors.textMuted}
                  />
                </>
              )}
              <Text style={styles.hintText}>填了保存将自动记录到今日运动；不填则仅创建运动</Text>
              <Pressable style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>{creating ? '保存中…' : '保存'}</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>选择运动类型</Text>
                <Pressable hitSlop={8} onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>
              <TextInput
                style={styles.searchInput}
                value={keyword}
                onChangeText={onKeywordChange}
                placeholder="搜索运动名称…"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              {keyword.trim() ? (
                <FlatList
                  data={options}
                  keyExtractor={(o) => (o.custom ? `c-${o.name}` : `b-${o.name}`)}
                  keyboardShouldPersistTaps="handled"
                  style={styles.pickerList}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>没有匹配的运动，点下方"新增运动"创建</Text>
                  }
                  renderItem={({ item }) => (
                    <Pressable style={styles.optionRow} onPress={() => onSelect(item)}>
                      <SportIcon emoji={item.emoji} size={40} />
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionName}>{item.name}</Text>
                        <Text style={styles.optionMeta}>
                          {item.typeName ?? ''} · {item.kind === 'reps' ? '按次数' : item.kind === 'weight' ? '重量·次数' : item.kind === 'distance' ? '距离' : '时长'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </Pressable>
                  )}
                />
              ) : (
                <ScrollView
                  style={styles.pickerList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {grouped.map(([gname, items]) => {
                    const open = expanded.has(gname);
                    return (
                      <View key={gname}>
                        <Pressable style={styles.groupHeader} onPress={() => toggleGroup(gname)}>
                          <Text style={styles.groupTitle}>{gname}</Text>
                          <View style={styles.groupRight}>
                            <Text style={styles.groupCount}>{items.length}</Text>
                            <Ionicons
                              name={open ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color={colors.textSecondary}
                            />
                          </View>
                        </Pressable>
                        {open &&
                          items.map((item) => (
                            <Pressable
                              key={item.id ?? item.name}
                              style={styles.optionRow}
                              onPress={() => onSelect(item)}
                            >
                              <SportIcon emoji={item.emoji} size={36} />
                              <View style={styles.optionInfo}>
                                <Text style={styles.optionName}>{item.name}</Text>
                                <Text style={styles.optionMeta}>
                                  {item.typeName ?? ''} · {item.kind === 'reps' ? '按次数' : item.kind === 'weight' ? '重量·次数' : item.kind === 'distance' ? '距离' : '时长'}
                                </Text>
                              </View>
                              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                            </Pressable>
                          ))}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
              <Pressable style={styles.createEntry} onPress={() => setShowCreate(true)}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.createEntryText}>新增运动</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
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
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  selectName: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  selectMet: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  selectPlaceholder: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.card,
  },
  durationUnit: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  hintText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  noteWrap: {
    position: 'relative',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    backgroundColor: colors.card,
    textAlignVertical: 'top',
  },
  noteCount: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  kindGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kindBtnHalf: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  quickBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  quickBtnText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  quickBtnTextActive: {
    color: colors.primary,
  },
  previewCard: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  previewLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  previewValue: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  previewUnit: {
    fontSize: fontSize.md,
  },
  previewMeta: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  saveBtn: {
    marginTop: spacing.xxl,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: contentPadding,
    maxHeight: '80%',
  },
  createScroll: {
    flexShrink: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pickerTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.bg,
    marginBottom: spacing.md,
  },
  pickerList: {
    flexGrow: 0,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  groupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupCount: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  optionMeta: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  createEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryBg,
  },
  createEntryText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  createBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  createBtnText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});


