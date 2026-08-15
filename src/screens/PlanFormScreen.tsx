import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { BUILTIN_SPORTS, type SportKind } from '../constants/sports';
import { addPlan, estimateItemCalories, getPlanItems, replacePlanItems, updatePlan, type PlanItem } from '../db/planDao';
import { getAllCustomSports } from '../db/customSportDao';
import { getProfile } from '../db/userProfileDao';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, contentPadding, fontFamily, fontSize, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PlanForm'>;
const WEEK = ['一', '二', '三', '四', '五', '六', '日'];
interface DraftItem { sportName: string; kind: SportKind; met: number; factor: number | null; sets: number; target: number; loadKg: number | null; estMinutes: number | null; }
type PickOption = { name: string; met: number; kind: SportKind; repFactor?: number; weightFactor?: number; distanceFactor?: number };

export default function PlanFormScreen({ navigation, route }: Props) {
  const { planId } = route.params;
  const isEdit = planId != null;
  const [name, setName] = useState('');
  const [days, setDays] = useState<Set<number>>(new Set());
  const [items, setItems] = useState<DraftItem[]>([]);
  const [weight, setWeight] = useState(60);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [picking, setPicking] = useState<DraftItem | null>(null);
  const [paramVisible, setParamVisible] = useState(false);
  const [param, setParam] = useState({ sets: '3', target: '', loadKg: '', estMinutes: '10' });

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      if (p?.weight) setWeight(p.weight);
      if (isEdit && planId != null) {
        const { getAllPlans } = await import('../db/planDao');
        const plan = (await getAllPlans()).find((x) => x.id === planId);
        if (plan) { setName(plan.name); setDays(new Set(plan.days ?? [])); }
        const its = await getPlanItems(planId);
        setItems(its.map((it) => ({ sportName: it.sportName, kind: it.kind, met: it.met, factor: it.factor, sets: it.sets, target: it.target, loadKg: it.loadKg, estMinutes: it.estMinutes })));
      }
    })();
  }, [isEdit, planId]);

  const totalKcal = useMemo(() => items.reduce((s, it) => s + estimateItemCalories({ ...it, id: 0, planId: 0, sortOrder: 0 } as PlanItem, weight), 0), [items, weight]);
  const toggleDay = (d: number) => setDays((prev) => { const n = new Set(prev); if (n.has(d)) n.delete(d); else n.add(d); return n; });

  const handlePick = (o: PickOption) => {
    const factor = o.kind === 'reps' ? o.repFactor ?? 0.02 : o.kind === 'weight' ? o.weightFactor ?? 0.02 : o.kind === 'distance' ? o.distanceFactor ?? 0.5 : null;
    setPicking({ sportName: o.name, kind: o.kind, met: o.met, factor, sets: 3, target: 0, loadKg: null, estMinutes: 10 });
    setParam({ sets: '3', target: '', loadKg: '', estMinutes: '10' });
    setPickerVisible(false); setParamVisible(true);
  };

  const confirmParam = () => {
    if (!picking) return;
    const sets = parseInt(param.sets, 10) || 1;
    const target = parseFloat(param.target);
    if (isNaN(target) || target <= 0) { Alert.alert('提示', '请输入目标（次数/分钟/距离）'); return; }
    let loadKg: number | null = null;
    if (picking.kind === 'weight') { const w = parseFloat(param.loadKg); if (isNaN(w) || w <= 0) { Alert.alert('提示', '请输入重量'); return; } loadKg = w; }
    setItems((prev) => [...prev, { ...picking, sets, target, loadKg, estMinutes: param.estMinutes ? parseFloat(param.estMinutes) : 10 }]);
    setParamVisible(false); setPicking(null);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('提示', '请输入计划名称'); return; }
    if (items.length === 0) { Alert.alert('提示', '请至少添加一个动作'); return; }
    const d = days.size ? [...days].sort((a, b) => a - b) : null;
    let id = planId;
    if (isEdit && planId != null) { await updatePlan(planId, name.trim(), d); } else { id = await addPlan(name.trim(), d); }
    await replacePlanItems(id!, items.map((it, i) => ({ sportName: it.sportName, kind: it.kind, met: it.met, factor: it.factor, sets: it.sets, target: it.target, loadKg: it.loadKg, estMinutes: it.estMinutes, sortOrder: i })));
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <Header title={isEdit ? '编辑计划' : '新建计划'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>计划名称 *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="如 力量日" placeholderTextColor={colors.textMuted} maxLength={12} />
        <Text style={styles.label}>绑定星期（选填，留空=通用模板）</Text>
        <View style={styles.weekRow}>
          {WEEK.map((w, i) => { const d = i + 1; const active = days.has(d); return (
            <Pressable key={d} style={[styles.dayBtn, active && styles.dayBtnActive]} onPress={() => toggleDay(d)}>
              <Text style={[styles.dayText, active && styles.dayTextActive]}>{w}</Text>
            </Pressable>); })}
        </View>
        <View style={styles.headRow}>
          <Text style={styles.label}>动作列表</Text>
          <Pressable style={styles.addBtn} onPress={() => setPickerVisible(true)}>
            <Ionicons name="add" size={16} color={colors.primary} /><Text style={styles.addBtnText}>添加动作</Text>
          </Pressable>
        </View>
        {items.map((it, i) => (
          <View key={i} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{it.sportName}</Text>
              <Text style={styles.itemMeta}>{it.sets}组 × {it.target}{it.kind === 'duration' ? '分' : it.kind === 'distance' ? 'km' : '次'} · 约{it.estMinutes}分</Text>
            </View>
            <Text style={styles.itemKcal}>约 {estimateItemCalories({ ...it, id: 0, planId: 0, sortOrder: 0 } as PlanItem, weight)} kcal</Text>
            <Pressable hitSlop={8} onPress={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
        {items.length === 0 && <Text style={styles.emptyHint}>点右上角"添加动作"开始构建</Text>}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>整套计划预估</Text>
          <Text style={styles.totalValue}>约 {totalKcal} kcal</Text>
        </View>
        <Pressable style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>{isEdit ? '保存修改' : '创建计划'}</Text></Pressable>
      </ScrollView>
      <SportPickModal visible={pickerVisible} onClose={() => setPickerVisible(false)} onPick={handlePick} />
      <ParamModal visible={paramVisible} kind={picking?.kind} param={param} setParam={setParam} onCancel={() => { setParamVisible(false); setPicking(null); }} onConfirm={confirmParam} />
    </View>
  );
}
function SportPickModal({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (o: PickOption) => void }) {
  const [customs, setCustoms] = useState<{ name: string; met: number; kind: SportKind }[]>([]);
  const [kw, setKw] = useState('');
  useEffect(() => { if (visible) { setKw(''); getAllCustomSports().then((c) => setCustoms(c.map((x) => ({ name: x.name, met: x.metValue, kind: x.kind })))); } }, [visible]);
  const list = [...BUILTIN_SPORTS.map((s) => ({ name: s.name, met: s.met, kind: s.kind, repFactor: s.repFactor, weightFactor: s.weightFactor, distanceFactor: s.distanceFactor })), ...customs];
  const filtered = kw.trim() ? list.filter((o) => o.name.includes(kw.trim())) : list;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>选择动作</Text>
          <TextInput style={styles.searchInput} value={kw} onChangeText={setKw} placeholder="搜索动作…" placeholderTextColor={colors.textMuted} />
          <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
            {filtered.map((o) => (
              <Pressable key={`${o.kind}-${o.name}`} style={styles.sheetItem} onPress={() => onPick(o)}>
                <Text style={styles.sheetItemText}>{o.name}</Text>
                <Text style={styles.sheetMeta}>{o.kind === 'reps' ? '次数' : o.kind === 'weight' ? '重量' : o.kind === 'distance' ? '距离' : '时长'}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}><Text style={styles.closeText}>取消</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ParamModal({ visible, kind, param, setParam, onCancel, onConfirm }: { visible: boolean; kind?: SportKind; param: { sets: string; target: string; loadKg: string; estMinutes: string }; setParam: (p: { sets: string; target: string; loadKg: string; estMinutes: string }) => void; onCancel: () => void; onConfirm: () => void }) {
  const unit = kind === 'duration' ? '分钟' : kind === 'distance' ? '距离km' : '次数';
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>设置动作参数</Text>
          <Text style={styles.label}>组数</Text>
          <TextInput style={styles.input} value={param.sets} onChangeText={(t) => setParam({ ...param, sets: t.replace(/[^0-9]/g, '') })} keyboardType="number-pad" />
          <Text style={styles.label}>单组目标（{unit}）*</Text>
          <TextInput style={styles.input} value={param.target} onChangeText={(t) => setParam({ ...param, target: t.replace(/[^0-9.]/g, '') })} keyboardType="decimal-pad" />
          {kind === 'weight' && (
            <>
              <Text style={styles.label}>重量(kg) *</Text>
              <TextInput style={styles.input} value={param.loadKg} onChangeText={(t) => setParam({ ...param, loadKg: t.replace(/[^0-9.]/g, '') })} keyboardType="decimal-pad" />
            </>
          )}
          <Text style={styles.label}>预计时长(分)</Text>
          <TextInput style={styles.input} value={param.estMinutes} onChangeText={(t) => setParam({ ...param, estMinutes: t.replace(/[^0-9.]/g, '') })} keyboardType="decimal-pad" />
          <Pressable style={styles.saveBtn} onPress={onConfirm}><Text style={styles.saveBtnText}>添加</Text></Pressable>
          <Pressable style={styles.closeBtn} onPress={onCancel}><Text style={styles.closeText}>取消</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: contentPadding, paddingBottom: spacing.xxl },
  label: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.lg },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.card },
  weekRow: { flexDirection: 'row', gap: spacing.sm },
  dayBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  dayBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  dayText: { fontFamily: fontFamily.body, fontSize: fontSize.md, color: colors.textSecondary },
  dayTextActive: { color: colors.primary, fontWeight: '700' },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.lg },
  addBtnText: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: fontFamily.body, fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  itemMeta: { fontFamily: fontFamily.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  itemKcal: { fontFamily: fontFamily.title, fontSize: fontSize.sm, fontWeight: '600', color: colors.coral, marginRight: spacing.sm },
  emptyHint: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  totalCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primaryBg, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg },
  totalLabel: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textSecondary },
  totalValue: { fontFamily: fontFamily.title, fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  saveBtn: { marginTop: spacing.xxl, backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.lg, alignItems: 'center' },
  saveBtnText: { fontFamily: fontFamily.title, fontSize: fontSize.lg, fontWeight: '600', color: '#FFFFFF' },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: contentPadding, paddingBottom: spacing.xxl },
  sheetTitle: { fontFamily: fontFamily.title, fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.bg, marginBottom: spacing.sm },
  sheetItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetItemText: { fontFamily: fontFamily.body, fontSize: fontSize.md, color: colors.text },
  sheetMeta: { fontFamily: fontFamily.body, fontSize: fontSize.xs, color: colors.textMuted },
  closeBtn: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm },
  closeText: { fontFamily: fontFamily.body, fontSize: fontSize.md, color: colors.textSecondary },
});
