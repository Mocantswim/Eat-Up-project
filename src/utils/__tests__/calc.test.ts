import { calcCalories, calcBMI, calcBMR, round1 } from '../calc';

describe('round1', () => {
  it('保留一位小数（四舍五入）', () => {
    expect(round1(2.666)).toBe(2.7);
    expect(round1(2.64)).toBe(2.6);
    expect(round1(2)).toBe(2);
    expect(round1(2.05)).toBe(2.1);
  });
});

describe('calcCalories（MET × 体重 × 小时）', () => {
  it('跑步 MET 8.0 × 60kg × 30分钟 = 240', () => {
    expect(calcCalories(8.0, 60, 30)).toBe(240);
  });
  it('快走 MET 5.0 × 70kg × 90分钟 = 525', () => {
    expect(calcCalories(5.0, 70, 90)).toBe(525);
  });
  it('保留一位小数：骑行 MET 6.8 × 65kg × 35分钟 = 257.8', () => {
    expect(calcCalories(6.8, 65, 35)).toBe(257.8);
  });
  it('边界：0 分钟 → 0', () => {
    expect(calcCalories(8, 60, 0)).toBe(0);
  });
  it('边界：非法输入 → 0', () => {
    expect(calcCalories(0, 60, 30)).toBe(0);
    expect(calcCalories(8, 0, 30)).toBe(0);
    expect(calcCalories(8, 60, -5)).toBe(0);
  });
});

describe('calcBMI', () => {
  it('60kg / 170cm = 20.8', () => {
    expect(calcBMI(60, 170)).toBe(20.8);
  });
  it('缺数据 → null', () => {
    expect(calcBMI(0, 170)).toBeNull();
    expect(calcBMI(60, 0)).toBeNull();
  });
});

describe('calcBMR（Mifflin-St Jeor）', () => {
  it('男 70kg/175cm/30岁 = 1648.8', () => {
    // 10*70 + 6.25*175 - 5*30 + 5 = 1648.75
    expect(calcBMR(70, 175, 30, 'male')).toBe(1648.8);
  });
  it('女 55kg/160cm/25岁 = 1264', () => {
    // 10*55 + 6.25*160 - 5*25 - 161 = 1264
    expect(calcBMR(55, 160, 25, 'female')).toBe(1264);
  });
  it('缺数据 → null', () => {
    expect(calcBMR(0, 160, 25, 'female')).toBeNull();
  });
});
