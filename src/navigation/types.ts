/** 导航路由类型（页面与导航 §7） */

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  DayDetail: { date: string };
  AddEditExercise: {
    date: string;
    logId?: number;
    prefillSport?: string; // 计时器打通：预填运动类型
    prefillDurationMin?: number; // 计时器打通：预填时长(分钟)
  };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  CustomSports: undefined;
  CustomSportForm: { sportId?: number };
  Achievements: undefined;
  About: undefined;
};

export type StatsTabParamList = {
  Stats: undefined;
};

/** 全局导航类型声明（供 useNavigation / navigation 补全） */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
