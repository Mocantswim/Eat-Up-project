import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../components/Header';
import SportIcon from '../components/SportIcon';
import { BUILTIN_SPORTS } from '../constants/sports';
import { addExercise, getExerciseById, updateExercise } from '../db/exerciseLogDao';
import { getAllCustomSports } from '../db/customSportDao';
import { getProfile, type UserProfile } from '../db/userProfileDao';
import { calcCalories } from '../utils/calc';
import type { HomeStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddEditExercise'>;

interface SportOption {
  name: string;
  met: number;
  emoji: string;
  custom: boolean;
}

/** 添加/编辑运动（策划书 §2.1.3） */
export default function AddEditExerciseScreen({ navigation, route }: Props) {
  const { date, logId } = route.params;
  const isEdit = logId != null;

  const [options, setOptions] = useState<SportOption[]>([]);
  const [selected, setSelected] = useState<SportOption | null>(null);
  const [duration, setDuration] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBase = useCallback(async () => {
    const [customs, p] = await Promise.all([getAllCustomSports(), getProfile()]);
    setOptions([
      ...BUILTIN_SPORTS.map((s) => ({ name: s.name, met: s.met, emoji: s.emoji, custom: false })),
      ...customs.map((c) => ({ name: c.name, met: c.metValue, emoji: '🏅', custom: true })),
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
        setSelected({ name: log.sportType, met: log.metValue, emoji, custom: false });
        setDuration(String(log.durationMin));
      }
    })();
  }, [logId]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return options;
    return options.filter((o) => o.name.includes(keyword.trim()));
  }, [options, keyword]);

  const estimated = useMemo(() => {
    if (!selected || !duration || !profile?.weight) return 0;
    const d = parseFloat(duration);
    if (isNaN(d) || d <= 0) return 0;
    return calcCalories(selected.met, profile.weight, d);
  }, [selected, duration, profile]);

  const handleSave = async () => {
    if (saving) return;
    if (!selected) {
      Alert.alert('提示', '请选择运动类型');
      return;
    }
    const d = parseFloat(duration);
    if (!duration.trim() || isNaN(d) || d <= 0) {
      Alert.alert('提示', '请输入有效时长（分钟）');
      return;
    }
    if (d > 1440) {
      Alert.alert('提示', '时长不能超过 1440 分钟（24 小时）');
      return;
    }
    if (!profile?.weight) {
      Alert.alert('提示', '请先在“我的”中设置体重，才能计算消耗');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && logId != null) {
        await updateExercise(logId, {
          sportType: selected.name,
          durationMin: d,
          met: selected.met,
          weightKg: profile.weight,
        });
      } else {
        await addExercise({
          date,
          sportType: selected.name,
          durationMin: d,
          met: selected.met,
          weightKg: profile.weight,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('出错了', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

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
        {/* 时长快捷选项 */}
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
      />
    </View>
  );
}

/** 运动类型选择器：Modal + 搜索 + 列表（内置 + 自定义） */
function SportPicker({
  visible,
  options,
  keyword,
  onKeywordChange,
  onSelect,
  onClose,
}: {
  visible: boolean;
  options: SportOption[];
  keyword: string;
  onKeywordChange: (v: string) => void;
  onSelect: (o: SportOption) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerSheet}>
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
              <Text style={styles.emptyText}>没有匹配的运动，可去“我的→自定义运动管理”添加</Text>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.optionRow} onPress={() => onSelect(item)}>
                <SportIcon emoji={item.emoji} size={40} />
                <View style={styles.optionInfo}>
                  <Text style={styles.optionName}>{item.name}</Text>
                  <Text style={styles.optionMeta}>
                    {item.custom ? '自定义' : '内置'} · MET {item.met}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          />
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
});


