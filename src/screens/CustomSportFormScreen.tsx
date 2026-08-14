import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Header from '../components/Header';
import {
  addCustomSport,
  customSportNameExists,
  getAllCustomSports,
  updateCustomSport,
} from '../db/customSportDao';
import { BUILTIN_SPORTS, type SportKind } from '../constants/sports';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'CustomSportForm'>;

const MET_REFERENCE = '参考 MET：走路 3.0 · 跑步 8.0 · 快走 5.0 · 游泳 6.0';

/** 新增/编辑自定义运动（策划书 §2.1.2，支持按时长/按次数） */
export default function CustomSportFormScreen({ navigation, route }: Props) {
  const { sportId } = route.params;
  const isEdit = sportId != null;

  const [name, setName] = useState('');
  const [kind, setKind] = useState<SportKind>('duration');
  const [met, setMet] = useState('');
  const [perUnitKcal, setPerUnitKcal] = useState('');
  const [distanceKcal, setDistanceKcal] = useState('');
  const [weightFactor, setWeightFactor] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || sportId == null) return;
    (async () => {
      const list = await getAllCustomSports();
      const sport = list.find((s) => s.id === sportId);
      if (sport) {
        setName(sport.name);
        setKind(sport.kind ?? 'duration');
        setMet(String(sport.metValue));
        setPerUnitKcal(sport.perUnitKcal != null ? String(sport.perUnitKcal) : '');
        setDistanceKcal(sport.distanceKcal != null ? String(sport.distanceKcal) : '');
        setWeightFactor(sport.weightFactor != null ? String(sport.weightFactor) : '');
      }
    })();
  }, [isEdit, sportId]);

  const handleSave = async () => {
    if (saving) return;
    const trimmed = name.trim();
    if (!trimmed) { Alert.alert('提示', '请输入运动名称'); return; }
    const mv = parseFloat(met);
    const pk = parseFloat(perUnitKcal);
    const dk = parseFloat(distanceKcal);
    const wf = parseFloat(weightFactor);
    if (kind === 'duration') {
      if (!met.trim() || isNaN(mv) || mv <= 0 || mv > 16) { Alert.alert('提示', '请输入有效 MET 值（1.0–16.0）'); return; }
    } else if (kind === 'reps') {
      if (!perUnitKcal.trim() || isNaN(pk) || pk <= 0 || pk > 100) { Alert.alert('提示', '请输入每 1 个消耗 kcal（0.1–100）'); return; }
    } else if (kind === 'distance') {
      if (!distanceKcal.trim() || isNaN(dk) || dk <= 0 || dk > 500) { Alert.alert('提示', '请输入每 1 公里消耗 kcal'); return; }
    } else {
      if (!weightFactor.trim() || isNaN(wf) || wf <= 0 || wf > 10) { Alert.alert('提示', '请输入每 1kg×1 次消耗 kcal'); return; }
    }
    if (BUILTIN_SPORTS.some((s) => s.name === trimmed)) { Alert.alert('提示', '该名称与内置运动重复，无需新建'); return; }
    if (await customSportNameExists(trimmed, sportId)) { Alert.alert('提示', '该运动名称已存在'); return; }

    const metVal = kind === 'duration' ? mv : 0;
    setSaving(true);
    try {
      if (isEdit && sportId != null) {
        await updateCustomSport(sportId, trimmed, metVal, kind,
          kind === 'reps' ? pk : null,
          kind === 'distance' ? dk : null,
          kind === 'weight' ? wf : null);
      } else {
        await addCustomSport(trimmed, metVal, kind,
          kind === 'reps' ? pk : null,
          kind === 'distance' ? dk : null,
          kind === 'weight' ? wf : null);
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
      <Header title={isEdit ? '编辑自定义运动' : '新增自定义运动'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>运动名称 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="如 深蹲"
            placeholderTextColor={colors.textMuted}
            maxLength={12}
          />

          <Text style={styles.label}>记录方式 *</Text>
          <View style={styles.kindGrid}>
            {(
              [
                ['duration', '⏱ 按时长'],
                ['reps', '🔢 个数'],
                ['distance', '📏 距离'],
                ['weight', '🏋️ 重量'],
              ] as [SportKind, string][]
            ).map(([k, label]) => {
              const active = kind === k;
              return (
                <Pressable
                  key={k}
                  style={[styles.kindBtn, styles.kindBtnHalf, active && styles.kindBtnActive]}
                  onPress={() => setKind(k)}
                >
                  <Text style={[styles.kindBtnText, active && styles.kindBtnTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {kind === 'duration' && (
            <>
              <Text style={styles.label}>MET 值 *</Text>
              <TextInput
                style={styles.input}
                value={met}
                onChangeText={(t) => setMet(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="如 5.0"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.hint}>{MET_REFERENCE}</Text>
            </>
          )}
          {kind === 'reps' && (
            <>
              <Text style={styles.label}>每 1 个消耗（kcal）*</Text>
              <TextInput
                style={styles.input}
                value={perUnitKcal}
                onChangeText={(t) => setPerUnitKcal(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="如 0.5"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.hint}>记录时输入个数，消耗 = 个数 × 每单位 kcal</Text>
            </>
          )}
          {kind === 'distance' && (
            <>
              <Text style={styles.label}>每 1 公里消耗（kcal）*</Text>
              <TextInput
                style={styles.input}
                value={distanceKcal}
                onChangeText={(t) => setDistanceKcal(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="如 60"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.hint}>记录时输入距离(km)，消耗 = 距离 × 每公里 kcal</Text>
            </>
          )}
          {kind === 'weight' && (
            <>
              <Text style={styles.label}>每 1kg×1 次消耗（kcal）*</Text>
              <TextInput
                style={styles.input}
                value={weightFactor}
                onChangeText={(t) => setWeightFactor(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="如 0.02"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.hint}>记录时输入重量(kg)和次数，消耗 = 重量 × 次数 × 系数</Text>
            </>
          )}

          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>{isEdit ? '保存修改' : '添加运动'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.card,
  },
  hint: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  kindRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  kindBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  kindBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  kindBtnText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  kindBtnTextActive: {
    color: colors.primary,
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
});
