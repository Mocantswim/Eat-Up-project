import { dayTitle, daysInMonth, fromDateKey, pad2, toDateKey, weekdayIndex } from '../date';

describe('pad2', () => {
  it('补零', () => {
    expect(pad2(1)).toBe('01');
    expect(pad2(12)).toBe('12');
  });
});

describe('toDateKey / fromDateKey', () => {
  it('格式化 YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 7, 11))).toBe('2026-08-11');
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('解析回 Date', () => {
    const d = fromDateKey('2026-08-11');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(11);
  });
});

describe('daysInMonth', () => {
  it('2026-02 = 28（平年）', () => {
    expect(daysInMonth(2026, 1)).toBe(28);
  });
  it('2028-02 = 29（闰年）', () => {
    expect(daysInMonth(2028, 1)).toBe(29);
  });
  it('2026-08 = 31', () => {
    expect(daysInMonth(2026, 7)).toBe(31);
  });
});

describe('weekdayIndex（周一=0）', () => {
  it('2026-08-11 是周二 → 1', () => {
    expect(weekdayIndex(2026, 7, 11)).toBe(1);
  });
  it('2026-08-09 是周日 → 6', () => {
    expect(weekdayIndex(2026, 7, 9)).toBe(6);
  });
});

describe('dayTitle', () => {
  it('2026-08-11 → 8月11日 周二', () => {
    const t = dayTitle('2026-08-11');
    expect(t.month).toBe(8);
    expect(t.day).toBe(11);
    expect(t.weekName).toBe('周二');
  });
});
