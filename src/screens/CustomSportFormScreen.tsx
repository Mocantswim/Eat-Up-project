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
import type { ProfileStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'CustomSportForm'>;

const MET_REFERENCE = '参考 MET：走路 3.0 · 跑步 8.0 · 快走 5.0 · 游泳 6.0';

/** 新增/编辑自定义运动（策划书 §2.1.2） */
export default function CustomSportFormScreen({ navigation, route }: Props) {
  const { sportId } = route.params;
  const isEdit = sportId != null;

  const [name, setName] = useState('');
  const [met, setMet] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || sportId == null) return;
    (async () => {
      const list = await getAllCustomSports();
      const sport = list.find((s) => s.id === sportId);
      if (sport) {
        setName(sport.name);
        setMet(String(sport.metValue));
      }
    })();
  }, [isEdit, sportId]);

  const handleSave = async () => {
    if (saving) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('提示', '请输入运动名称');
      return;
    }
    const mv = parseFloat(met);
    if (!met.trim() || isNaN(mv) || mv <= 0 || mv > 16) {
      Alert.alert('提示', '请输入有效 MET 值（1.0–16.0）');
      return;
    }
    if (await customSportNameExists(trimmed, sportId)) {
      Alert.alert('提示', '该运动名称已存在');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && sportId != null) {
        await updateCustomSport(sportId, trimmed, mv);
      } else {
        await addCustomSport(trimmed, mv);
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
