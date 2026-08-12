/** 固定食物库（策划书 §2.2.1，10 种，不可修改） */
export interface FoodInfo {
  id: string;
  name: string;
  unit: string; // 数量单位标签，如 碗/个/瓶
  calories: number; // 单品热量 kcal
  emoji: string; // 扁平可爱图标
  bg: string; // 图标圆底柔色
}

export const FOODS: FoodInfo[] = [
  { id: 'rice', name: '米饭', unit: '碗', calories: 116, emoji: '🍚', bg: '#FFF3E0' },
  { id: 'apple', name: '苹果', unit: '个', calories: 95, emoji: '🍎', bg: '#FFEBEE' },
  { id: 'egg', name: '鸡蛋', unit: '个', calories: 70, emoji: '🥚', bg: '#FFF8E1' },
  { id: 'bread', name: '面包', unit: '片', calories: 70, emoji: '🍞', bg: '#FFF3E0' },
  { id: 'chicken', name: '鸡胸肉', unit: '份', calories: 133, emoji: '🍗', bg: '#FFEBEE' },
  { id: 'cola', name: '可乐', unit: '瓶', calories: 139, emoji: '🥤', bg: '#E1F5FE' },
  { id: 'icecream', name: '冰淇淋', unit: '球', calories: 120, emoji: '🍦', bg: '#F3E5F5' },
  { id: 'milk', name: '牛奶', unit: '杯', calories: 108, emoji: '🥛', bg: '#E8F5E9' },
  { id: 'banana', name: '香蕉', unit: '根', calories: 105, emoji: '🍌', bg: '#FFFDE7' },
  { id: 'broccoli', name: '西兰花', unit: '份', calories: 34, emoji: '🥦', bg: '#E8F5E9' },
];
