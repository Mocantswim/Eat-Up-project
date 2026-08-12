import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDailyTotal } from '../db/exerciseLogDao';
import { todayKey } from './date';

/**
 * 撒花触发判定（决策 #5：每日首次达标 500kcal 触发一次）。
 * 只在“今日”判定；触发后写本地标记，当天不再重复。
 */
export async function shouldTriggerConfetti(date: string): Promise<boolean> {
  if (date !== todayKey()) return false;
  const key = `confetti_${date}`;
  const flag = await AsyncStorage.getItem(key);
  if (flag === '1') return false;
  const total = await getDailyTotal(date);
  if (total >= 500) {
    await AsyncStorage.setItem(key, '1');
    return true;
  }
  return false;
}
