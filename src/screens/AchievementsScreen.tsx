import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Header from '../components/Header';
import { getAchievements, type Achievement } from '../utils/achievements';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Achievements'>;

/** 成就墙：已解锁彩色 / 未解锁灰色 */
export default function AchievementsScreen({ navigation }: Props) {
  const [list, setList] = useState<Achievement[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAchievements().then(setList);
    }, [])
  );

  const unlocked = list.filter((a) => a.unlocked).length;

  return (
    <View style={styles.root}>
      <Header title="成就" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {unlocked}<Text style={styles.summaryTotal}> / {list.length}</Text>
          </Text>
          <Text style={styles.summaryLabel}>已解锁成就</Text>
        </View>
        <View style={styles.grid}>
          {list.map((a) => (
            <View
              key={a.id}
              style={[styles.achv, a.unlocked ? styles.achvOn : styles.achvOff]}
            >
              <Text style={[styles.achvEmoji, !a.unlocked && styles.achvEmojiOff]}>
                {a.unlocked ? a.emoji : '🔒'}
              </Text>
              <Text style={[styles.achvTitle, !a.unlocked && styles.achvTextOff]}>
                {a.title}
              </Text>
              <Text style={[styles.achvDesc, !a.unlocked && styles.achvTextOff]} numberOfLines={2}>
                {a.desc}
              </Text>
              <Text style={[styles.achvProg, a.unlocked && { color: colors.success }]}>
                {a.progress}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: contentPadding, paddingBottom: spacing.xxl },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryValue: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.coral,
  },
  summaryTotal: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  summaryLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achv: {
    width: '48%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  achvOn: {
    backgroundColor: '#FFF8F5',
    borderColor: '#FFD9CE',
  },
  achvOff: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  achvEmoji: {
    fontSize: 32,
  },
  achvEmojiOff: {
    opacity: 0.5,
  },
  achvTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  achvDesc: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  achvTextOff: {
    color: colors.textMuted,
  },
  achvProg: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
