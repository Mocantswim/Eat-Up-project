import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Header from '../components/Header';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'About'>;

/** 关于：版本 / 开发者 / 数据隐私说明（策划书 §2.5.3） */
export default function AboutScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <Header title="关于" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoCard}>
          <Text style={styles.logo}>🍱🏃</Text>
          <Text style={styles.appName}>食光运动</Text>
          <Text style={styles.version}>版本 1.0.0</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>关于本应用</Text>
          <Text style={styles.blockText}>
            一款单机运动记录应用：手动记录运动，自动换算热量，并把每份消耗变成看得见的食物。
            以月历为时间轴，融合趋势图表，帮助你建立运动认知。
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>数据与隐私</Text>
          <Text style={styles.blockText}>
            · 全部数据仅保存在本机，无网络、无账号、无云端
            {'\n'}· 卸载应用后数据将彻底清除
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>开发者</Text>
          <Text style={styles.blockText}>食光计划团队</Text>
        </View>

        <Text style={styles.footnote}>
          食物热量与 MET 值为通用估算值，仅作运动激励参考，不构成医疗或饮食建议。
        </Text>
      </ScrollView>
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
  logoCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  logo: {
    fontSize: 52,
  },
  appName: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  version: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  block: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  blockTitle: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  blockText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  footnote: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
