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

/** 次数型运动（如引体向上）：kcal = 次数 × 体重(kg) × 系数 */
export function calcRepsCalories(
  reps: number,
  weightKg: number,
  factor: number
): number {
  if (!isFinite(reps) || !isFinite(weightKg) || !isFinite(factor)) return 0;
  if (reps <= 0 || weightKg <= 0 || factor <= 0) return 0;
  return round1(reps * weightKg * factor);
}

/** 重量型运动（如卧推）：kcal = 重量(kg) × 次数 × 系数 */
export function calcWeightCalories(
  loadKg: number,
  reps: number,
  factor: number
): number {
  if (!isFinite(loadKg) || !isFinite(reps) || !isFinite(factor)) return 0;
  if (loadKg <= 0 || reps <= 0 || factor <= 0) return 0;
  return round1(loadKg * reps * factor);
}

/** 距离型运动（如跑步）：kcal = 距离(km) × 体重(kg) × 系数 */
export function calcDistanceCalories(
  distanceKm: number,
  weightKg: number,
  factor: number
): number {
  if (!isFinite(distanceKm) || !isFinite(weightKg) || !isFinite(factor)) return 0;
  if (distanceKm <= 0 || weightKg <= 0 || factor <= 0) return 0;
  return round1(distanceKm * weightKg * factor);
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
