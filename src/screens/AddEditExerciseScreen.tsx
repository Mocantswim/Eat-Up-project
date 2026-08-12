import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../components/Header';
import SportIcon from '../components/SportIcon';
import { BUILTIN_SPORTS, getSportFactor, type SportKind } from '../constants/sports';
import {
  addExercise,
  calcExerciseCalories,
  getExerciseById,
  updateExercise,
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
  kind: SportKind;
  factor?: number;
}

/** 添加/编辑运动（策划书 §2.1.3，支持 时长/次数/重量 三种模式） */
export default function AddEditExerciseScreen({ navigation, route }: Props) {
  const { date, logId } = route.params;
  const isEdit = logId != null;

  const [options, setOptions] = useState<SportOption[]>([]);
  const [selected, setSelected] = useState<SportOption | null>(null);
  const [duration, setDuration] = useState('');
  const [reps, setReps] = useState('');
  const [loadKg, setLoadKg] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBase = useCallback(async () => {
    const [customs, p] = await Promise.all([getAllCustomSports(), getProfile()]);
    setOptions([
      ...BUILTIN_SPORTS.map((s) => ({
        name: s.name,
        met: s.met,
        emoji: s.emoji,
        custom: false,
        kind: s.kind,
        factor: s.kind === 'reps' ? s.repFactor : s.kind === 'weight' ? s.weightFactor : undefined,
      })),
      ...customs.map((c) => ({
        name: c.name,
        met: c.metValue,
        emoji: '🏅',
        custom: true,
        kind: 'duration' as SportKind,
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
        });
        setDuration(log.kind === 'duration' && log.durationMin > 0 ? String(log.durationMin) : '');
        setReps(log.reps != null ? String(log.reps) : '');
        setLoadKg(log.loadKg != null ? String(log.loadKg) : '');
      }
    })();
  }, [logId]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return options;
    return options.filter((o) => o.name.includes(keyword.trim()));
  }, [options, keyword]);

  const estimated = useMemo(() => {
    if (!selected || !profile?.weight) return 0;
    if (selected.kind === 'reps') {
      const r = parseFloat(reps);
      if (isNaN(r) || r <= 0) return 0;
      return calcExerciseCalories({
        date, sportType: selected.name, kind: 'reps', reps: r,
        met: selected.met, factor: selected.factor ?? getSportFactor(selected.name), weightKg: profile.weight,
      });
    }
    if (selected.kind === 'weight') {
      const w = parseFloat(loadKg);
      const r = parseFloat(reps);
      if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) return 0;
      return calcExerciseCalories({
        date, sportType: selected.name, kind: 'weight', loadKg: w, reps: r,
        met: selected.met, factor: selected.factor ?? getSportFactor(selected.name), weightKg: profile.weight,
      });
    }
    const d = parseFloat(duration);
    if (isNaN(d) || d <= 0) return 0;
    return calcExerciseCalories({
      date, sportType: selected.name, kind: 'duration', durationMin: d,
      met: selected.met, weightKg: profile.weight,
    });
  }, [selected, duration, reps, loadKg, profile, date]);

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
    };
    let input;
    if (selected.kind === 'reps') {
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
      };
    } else if (selected.kind === 'weight') {
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

  /** 从选择器内新增自定义运动后：选中它并刷新列表 */
  const handleSportCreated = useCallback(
    async (name: string, met: number) => {
      setSelected({ name, met, emoji: '🏅', custom: true, kind: 'duration' });
      setPickerVisible(false);
      setKeyword('');
      await loadBase();
    },
    [loadBase]
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

        {/* 输入区：按时长/次数/重量三种模式动态显示 */}
        {(!selected || selected.kind === 'duration') && (
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

        {selected?.kind === 'reps' && (
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

        {selected?.kind === 'weight' && (
          <>
            <Text style={styles.label}>重量（kg）*</Text>
            <View style={styles.durationRow}>
              <TextInput
                style={styles.durationInput}
                value={loadKg}
                onChangeText={(t) => setLoadKg(t.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="如 50"
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
            <Text style={styles.hintText}>按重量 × 次数估算</Text>
          </>
        )}

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
  onCreate?: (name: string, met: number) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMet, setNewMet] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (creating) return;
    const name = newName.trim();
    const mv = parseFloat(newMet);
    if (!name) {
      Alert.alert('提示', '请输入运动名称');
      return;
    }
    if (isNaN(mv) || mv <= 0) {
      Alert.alert('提示', '请输入有效 MET 值');
      return;
    }
    if (await customSportNameExists(name)) {
      Alert.alert('提示', '该运动名称已存在');
      return;
    }
    setCreating(true);
    try {
      await addCustomSport(name, mv);
      onCreate?.(name, mv);
      setShowCreate(false);
      setNewName('');
      setNewMet('');
    } catch {
      Alert.alert('出错了', '保存失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerSheet}>
          {showCreate ? (
            <>
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
              <Pressable style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>{creating ? '保存中…' : '保存'}</Text>
              </Pressable>
            </>
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
              <FlatList
                data={options}
                keyExtractor={(o) => o.name}
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
                        {item.custom ? '自定义' : '内置'} ·{' '}
                        {item.kind === 'reps' ? '按次数' : item.kind === 'weight' ? '重量·次数' : `MET ${item.met}`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                )}
              />
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
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
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
    paddingBottom: spacing.xxl,
    maxHeight: '75%',
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


