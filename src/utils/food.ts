import { FOODS, type FoodInfo } from '../constants/foods';
import { round1 } from './calc';
import { hashString, pickRandom } from './seededRandom';

/** 单条食物换算结果 */
export interface FoodConversion {
  food: FoodInfo;
  quantity: number; // 1 位小数
}

/** 数量 = 总消耗 ÷ 单品热量，1 位小数 */
export function foodQuantity(totalCalories: number, foodCalories: number): number {
  return round1(totalCalories / foodCalories);
}

/**
 * 当日总消耗 → 2-3 种等价食物（已确认决策 #1/#2）。
 * - 数量 ≥ 0.5 为候选；不足 2 种时阈值放宽到 0.1 兜底
 * - 以日期键为种子随机，当天结果固定、跨天变化
 * - 总消耗 ≤ 0 时返回空数组（不展示）
 */
export function convertToFoods(totalCalories: number, dateKey: string): FoodConversion[] {
  if (totalCalories <= 0) return [];

  let candidates = FOODS.filter((f) => totalCalories / f.calories >= 0.5);
  if (candidates.length < 2) {
    candidates = FOODS.filter((f) => totalCalories / f.calories >= 0.1);
  }
  if (candidates.length === 0) return [];

  const seed = hashString(dateKey);
  // 从候选集中取 2 或 3 种（种子第二分量决定）
  const want =
    candidates.length <= 2 ? candidates.length : 2 + (hashString(`${dateKey}:n`) % 2);

  const picked = pickRandom(candidates, want, seed);
  return picked.map((food) => ({ food, quantity: foodQuantity(totalCalories, food.calories) }));
}

/** 展示文本，如「约 2.6 碗米饭」；整数时省略小数位 */
export function foodLabel(conv: FoodConversion): string {
  const q = conv.quantity % 1 === 0 ? String(conv.quantity) : conv.quantity.toFixed(1);
  return `约 ${q} ${conv.food.unit}${conv.food.name}`;
}
