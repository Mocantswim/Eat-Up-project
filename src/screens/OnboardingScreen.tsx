import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveProfile } from '../db/userProfileDao';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

interface Props {
  onDone: () => void;
}

/** 首启引导：体重必填，身高/年龄/性别选填（决策 #6） */
export default function OnboardingScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);

  const handleStart = async () => {
    const w = parseFloat(weight);
    if (!weight.trim() || isNaN(w) || w <= 0 || w > 300) {
      Alert.alert('提示', '请填写有效的体重（kg），例如 60');
      return;
    }
    const h = height.trim() ? parseFloat(height) : NaN;
    const a = age.trim() ? parseInt(age, 10) : NaN;
    await saveProfile({
      weight: w,
      height: isNaN(h) || h <= 0 ? null : h,
      age: isNaN(a) || a <= 0 ? null : a,
      gender,
    });
    onDone();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xxxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.hero}>🍱🏃</Text>
        <Text style={styles.title}>食光运动</Text>
        <Text style={styles.subtitle}>记录运动 · 看见热量 · 吃得更明白</Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            当前体重（kg）<Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="如 60"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>身高（cm）· 选填</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="number-pad"
            placeholder="如 170"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>年龄 · 选填</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
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
              <Text
                style={[
                  styles.genderText,
                  gender === 'male' && styles.genderTextActive,
                ]}
              >
                👦 男
              </Text>
            </Pressable>
            <Pressable
              style={[styles.genderItem, gender === 'female' && styles.genderItemActive]}
              onPress={() => setGender(gender === 'female' ? null : 'female')}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === 'female' && styles.genderTextActive,
                ]}
              >
                👧 女
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.hint}>
          体重用于计算运动消耗（可随时在“我的”中修改）
        </Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>开始记录</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: contentPadding,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    fontSize: 52,
    textAlign: 'center',
  },
  title: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  required: {
    color: colors.coral,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.bg,
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
    backgroundColor: colors.bg,
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
  hint: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  button: {
    marginTop: spacing.xxl,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

