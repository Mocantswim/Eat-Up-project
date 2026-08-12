import { convertToFoods, foodLabel, foodQuantity } from '../food';
import { FOODS } from '../../constants/foods';

describe('foodQuantity（数量 = 总消耗 ÷ 单品热量）', () => {
  it('302 ÷ 116（米饭）≈ 2.6', () => {
    expect(foodQuantity(302, 116)).toBe(2.6);
  });
  it('302 ÷ 95（苹果）≈ 3.2', () => {
    expect(foodQuantity(302, 95)).toBe(3.2);
  });
});

describe('convertToFoods', () => {
  it('总消耗 0 → 空数组（不展示）', () => {
    expect(convertToFoods(0, '2026-08-11')).toEqual([]);
  });

  it('取 2-3 种且数量 ≥ 0.5', () => {
    const res = convertToFoods(500, '2026-08-11');
    expect(res.length).toBeGreaterThanOrEqual(2);
    expect(res.length).toBeLessThanOrEqual(3);
    res.forEach((c) => expect(c.quantity).toBeGreaterThanOrEqual(0.5));
  });

  it('同一天种子随机 → 结果固定', () => {
    const a = convertToFoods(400, '2026-08-11');
    const b = convertToFoods(400, '2026-08-11');
    expect(a.map((x) => x.food.id)).toEqual(b.map((x) => x.food.id));
    expect(a.map((x) => x.quantity)).toEqual(b.map((x) => x.quantity));
  });

  it('不同日期 → 可正常执行（种子变化）', () => {
    const a = convertToFoods(400, '2026-08-11');
    const b = convertToFoods(400, '2026-08-12');
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
  });

  it('总消耗很小时用 0.1 阈值兜底', () => {
    const res = convertToFoods(30, '2026-08-11');
    expect(res.length).toBeGreaterThan(0);
  });

  it('所有换算结果均为 1 位小数', () => {
    const res = convertToFoods(777, '2026-08-11');
    res.forEach((c) => {
      expect(c.quantity * 10).toBe(Math.round(c.quantity * 10));
    });
  });
});

describe('foodLabel', () => {
  it('小数展示', () => {
    expect(foodLabel({ food: FOODS[0], quantity: 2.6 })).toBe('约 2.6 碗米饭');
  });
  it('整数省略小数位', () => {
    expect(foodLabel({ food: FOODS[0], quantity: 3 })).toBe('约 3 碗米饭');
  });
});
