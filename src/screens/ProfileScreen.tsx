import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, type UserProfile } from '../db/userProfileDao';
import { clearAllData } from '../db/statsDao';
import { calcBMI, calcBMR } from '../utils/calc';
import { emitDataCleared } from '../utils/events';
import { manualCheckUpdate } from '../utils/updateSync';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

/** 我的：资料 + BMI/BMR + 入口（策划书 §2.5） */
export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const load = useCallback(async () => {
    setProfile(await getProfile());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const bmi =
    profile?.weight && profile.height ? calcBMI(profile.weight, profile.height) : null;
  const bmr =
    profile?.weight && profile.height && profile.age && profile.gender
      ? calcBMR(profile.weight, profile.height, profile.age, profile.gender)
      : null;
  const genderText =
    profile?.gender === 'male' ? '男' : profile?.gender === 'female' ? '女' : '—';

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>我的</Text>

        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🏃</Text>
          </View>
          <Text style={styles.slogan}>坚持记录，看见更好的自己</Text>
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="体重" value={profile?.weight ? `${profile.weight} kg` : '—'} />
          <InfoRow label="身高" value={profile?.height ? `${profile.height} cm` : '—'} />
          <InfoRow label="年龄" value={profile?.age ? `${profile.age} 岁` : '—'} />
          <InfoRow label="性别" value={genderText} last />
          <Pressable style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editBtnText}>编辑资料</Text>
          </Pressable>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>BMI</Text>
            <Text style={styles.metricValue}>{bmi != null ? String(bmi) : '—'}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>基础代谢 BMR</Text>
            <Text style={styles.metricValue}>{bmr != null ? `${bmr} kcal` : '—'}</Text>
          </View>
        </View>
        {(!profile?.height || !profile?.age || !profile?.gender) && (
          <Text style={styles.metricHint}>补齐身高/年龄/性别后可计算 BMI 与 BMR</Text>
        )}

        <MenuItem
          icon="trophy-outline"
          label="成就"
          onPress={() => navigation.navigate('Achievements')}
        />
        <MenuItem
          icon="clipboard-outline"
          label="训练计划"
          onPress={() => navigation.navigate('Plans')}
        />
        <MenuItem
          icon="fitness-outline"
          label="自定义运动管理"
          onPress={() => navigation.navigate('CustomSports')}
        />
        <MenuItem
          icon="refresh-outline"
          label="检查更新"
          onPress={handleCheckUpdate}
        />
        <MenuItem
          icon="information-circle-outline"
          label="关于"
          onPress={() => navigation.navigate('About')}
        />

        <Pressable
          style={styles.clearBtn}
          onPress={handleClearAll}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.clearBtnText}>清除所有数据</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** 手动检查更新 */
async function handleCheckUpdate() {
  const r = await manualCheckUpdate();
  if (r === 'latest') Alert.alert('已是最新版本', '当前已是最新版本 ✓');
  else if (r === 'error') Alert.alert('检查失败', '当前为开发模式或网络异常');
  // 'updated' 已触发应用重载
}

/** 清除所有数据：二次确认，清库后回到引导页 */
function handleClearAll() {
  Alert.alert(
    '清除所有数据',
    '将删除全部运动记录、体重、个人资料与自定义运动，此操作不可恢复！',
    [
      { text: '取消', style: 'cancel' },
      {
        text: '确认清除',
        style: 'destructive',
        onPress: async () => {
          await clearAllData();
          await AsyncStorage.clear();
          emitDataCleared();
        },
      },
    ]
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
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
  title: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 38,
  },
  slogan: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.md,
  },
  editBtnText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  metricCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  metricLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  metricValue: {
    fontFamily: fontFamily.title,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  metricHint: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3C1BD',
    backgroundColor: '#FDF0EF',
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  clearBtnText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.danger,
  },
});

