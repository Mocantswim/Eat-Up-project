import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import FAB from '../components/FAB';
import EmptyState from '../components/EmptyState';
import SportIcon from '../components/SportIcon';
import { BUILTIN_SPORTS } from '../constants/sports';
import {
  deleteCustomSport,
  getAllCustomSports,
  type CustomSport,
} from '../db/customSportDao';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'CustomSports'>;

/** 自定义运动管理：增删改 + 内置参考（策划书 §2.5.2） */
export default function CustomSportsScreen({ navigation }: Props) {
  const [customs, setCustoms] = useState<CustomSport[]>([]);

  const load = useCallback(async () => {
    setCustoms(await getAllCustomSports());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (sport: CustomSport) => {
    Alert.alert('删除运动', `确定删除“${sport.name}”吗？已有运动记录将保留。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomSport(sport.id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <Header title="自定义运动管理" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>我的自定义运动</Text>
        {customs.length === 0 ? (
          <EmptyState emoji="🏅" text="还没有自定义运动，点右下角 + 添加" />
        ) : (
          customs.map((sport) => (
            <View key={sport.id} style={styles.customRow}>
              <SportIcon emoji="🏅" size={40} />
              <View style={styles.customInfo}>
                <Text style={styles.customName}>{sport.name}</Text>
                <Text style={styles.customMeta}>
                  {sport.kind === 'reps'
                    ? `按次数 · ${sport.perUnitKcal} kcal/个`
                    : `按时长 · MET ${sport.metValue}`}
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                style={styles.actionBtn}
                onPress={() => navigation.navigate('CustomSportForm', { sportId: sport.id })}
              >
                <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
              </Pressable>
              <Pressable hitSlop={8} style={styles.actionBtn} onPress={() => handleDelete(sport)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>内置运动（固定参考，不可修改）</Text>
        {BUILTIN_SPORTS.map((sport) => (
          <View key={sport.name} style={styles.builtinRow}>
            <SportIcon emoji={sport.emoji} size={40} />
            <View style={styles.customInfo}>
              <Text style={styles.customName}>{sport.name}</Text>
              <Text style={styles.customMeta}>
                MET {sport.met} · {sport.note}
              </Text>
            </View>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
          </View>
        ))}
      </ScrollView>
      <FAB onPress={() => navigation.navigate('CustomSportForm', {})} />
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
  sectionTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  builtinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  customInfo: {
    flex: 1,
  },
  customName: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  customMeta: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
