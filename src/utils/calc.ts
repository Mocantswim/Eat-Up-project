/** 数值与健康计算（策划书 §2.1.1 / §2.5.1） */

/** 保留 1 位小数（四舍五入） */
export function round1(n: number): number {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

/** 消耗(kcal) = MET × 体重(kg) × 时长(小时)，1 位小数 */
export function calcCalories(met: number, weightKg: number, durationMin: number): number {
  if (!isFinite(met) || !isFinite(weightKg) || !isFinite(durationMin)) return 0;
  if (met <= 0 || weightKg <= 0 || durationMin <= 0) return 0;
  return round1(met * weightKg * (durationMin / 60));
}

/** BMI = 体重 / (身高/100)²，1 位小数；缺数据返回 null */
export function calcBMI(weightKg: number, heightCm: number): number | null {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const h = heightCm / 100;
  return round1(weightKg / (h * h));
}

/** Mifflin-St Jeor BMR，1 位小数；缺数据返回 null */
export function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female'
): number | null {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return round1(gender === 'male' ? base + 5 : base - 161);
}
