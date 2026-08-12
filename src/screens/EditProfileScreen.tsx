import React, { useCallback, useEffect, useState } from 'react';
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
import { getProfile, saveProfile } from '../db/userProfileDao';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

/** 每周目标预设档位（可手动微调） */
const GOAL_PRESETS = [
  { id: 'light', name: '🌱 新手', days: 2, kcal: 500, desc: '刚起步，轻松养成习惯' },
  { id: 'mid', name: '🔥 中度', days: 3, kcal: 1000, desc: '已有规律，稳步提升' },
  { id: 'heavy', name: '💪 重度', days: 5, kcal: 2000, desc: '进阶燃脂，追求突破' },
];

/** 资料编辑：体重/身高/年龄/性别（策划书 §2.5.1） */
export default function EditProfileScreen({ navigation }: Props) {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [goalDays, setGoalDays] = useState('3');
  const [goalKcal, setGoalKcal] = useState('1000');

  const load = useCallback(async () => {
    const p = await getProfile();
    if (p) {
      setWeight(p.weight != null ? String(p.weight) : '');
      setHeight(p.height != null ? String(p.height) : '');
      setAge(p.age != null ? String(p.age) : '');
      setGender(p.gender);
      setGoalDays(p.weeklyGoalDays != null ? String(p.weeklyGoalDays) : '3');
      setGoalKcal(p.weeklyGoalKcal != null ? String(p.weeklyGoalKcal) : '1000');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const w = parseFloat(weight);
    if (!weight.trim() || isNaN(w) || w <= 0 || w > 300) {
      Alert.alert('提示', '请填写有效的体重（kg）');
      return;
    }
    const h = height.trim() ? parseFloat(height) : NaN;
    const a = age.trim() ? parseInt(age, 10) : NaN;
    const gd = goalDays.trim() ? parseInt(goalDays, 10) : NaN;
    const gk = goalKcal.trim() ? parseFloat(goalKcal) : NaN;
    await saveProfile({
      weight: w,
      height: isNaN(h) || h <= 0 ? null : h,
      age: isNaN(a) || a <= 0 ? null : a,
      gender,
      weeklyGoalDays: isNaN(gd) || gd <= 0 ? 3 : gd,
      weeklyGoalKcal: isNaN(gk) || gk <= 0 ? 1000 : gk,
    });
    Alert.alert('已保存', '新的体重仅对之后添加的运动生效');
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <Header title="编辑资料" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>体重（kg）*</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="如 60"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>身高（cm）· 选填</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={(t) => setHeight(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="如 170"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>年龄 · 选填</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="如 28"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>性别 · 选填</Text>
          <View style={styles.genderRow}>
            <Pressable
              style={[styles.genderItem, gender === 'male' && styles.genderItemActive]}
              onPress={() => setGender(gender === 'male' ? null : 'male')}
            >
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                👦 男
              </Text>
            </Pressable>
            <Pressable
              style={[styles.genderItem, gender === 'female' && styles.genderItemActive]}
              onPress={() => setGender(gender === 'female' ? null : 'female')}
            >
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                👧 女
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>每周目标 · 预设档位</Text>
          <View style={styles.goalRow}>
            {GOAL_PRESETS.map((g) => {
              const active =
                goalDays === String(g.days) && goalKcal === String(g.kcal);
              return (
                <Pressable
                  key={g.id}
                  style={[styles.goalItem, active && styles.goalItemActive]}
                  onPress={() => {
                    setGoalDays(String(g.days));
                    setGoalKcal(String(g.kcal));
                  }}
                >
                  <Text style={[styles.goalItemTitle, active && styles.goalItemTitleActive]}>
                    {g.name}
                  </Text>
                  <Text style={styles.goalItemDesc}>
                    {g.days}天/{g.kcal}千卡
                  </Text>
                  <Text style={styles.goalItemHint}>{g.desc}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>每周目标 · 运动天数</Text>
          <TextInput
            style={styles.input}
            value={goalDays}
            onChangeText={(t) => setGoalDays(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="如 3 天"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>每周目标 · 消耗（千卡）</Text>
          <TextInput
            style={styles.input}
            value={goalKcal}
            onChangeText={(t) => setGoalKcal(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="如 1000"
            placeholderTextColor={colors.textMuted}
          />

          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>保存</Text>
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
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  genderItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  genderText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  genderTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  goalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  goalItem: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  goalItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  goalItemTitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  goalItemTitleActive: {
    color: colors.primary,
  },
  goalItemDesc: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  goalItemHint: {
    fontFamily: fontFamily.body,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
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
