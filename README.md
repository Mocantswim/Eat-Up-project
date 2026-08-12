# 食光运动 🍱🏃

单机 Android 应用：**手动记录运动 → 自动计算热量 → 等价食物换算**，以月历为时间轴，融合趋势图表，建立运动认知。

## 技术栈

React Native (Expo SDK 57) + TypeScript · expo-sqlite · react-navigation · react-native-gifted-charts · reanimated

## 快速开始

```powershell
# 1. 安装依赖并自检（首次约 2-5 分钟）
.\setup.ps1

# 2. 启动开发预览
npx expo start
```

手机安装 **Expo Go** 后扫码预览；或按 `a` 打开安卓模拟器。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动 Expo 开发服务器 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm test` | 单元测试（jest-expo） |
| `npx expo start --android` | 直接在安卓设备/模拟器打开 |
| `eas build -p android --profile preview` | 打包预览 APK |

## 功能一览

- 10 种内置运动（固定 MET）+ 自定义运动
- 热量公式：`MET × 体重(kg) × 时长(小时)`，含体重快照
- 10 种食物等价换算（按日期种子随机 2-3 种）
- 自绘月历 + 有记录日期圆点 + 年月跳转
- 日期详情：当日体重（选填）/运动增删改/总消耗
- 统计页：每日消耗柱状图 / 体重趋势折线图 / 运动分布环形图（支持横屏）
- 我的：BMI / BMR（Mifflin-St Jeor）/ 自定义运动管理
- 每日消耗 ≥500kcal 撒花庆祝（当日一次）

## 数据与隐私

- 全部数据仅存本机（应用私有目录），无网络、无账号
- **`android:allowBackup=false`**：卸载应用即彻底清除，重装不自动恢复

## 目录结构

```
├── App.tsx                     # 根组件
├── app.json / app.plugin.js    # Expo 配置（含卸载彻底性插件）
├── setup.ps1                   # 一键安装自检脚本
└── src/
    ├── theme/                  # 设计规范（颜色/间距/字号）
    ├── constants/              # 内置运动、食物库
    ├── db/                     # 建表 + 4 个 DAO
    ├── utils/                  # 日期/热量/BMI/食物换算/种子随机/撒花
    ├── components/             # 月历/食物卡/撒花/分段选择器等
    ├── navigation/             # 三 Tab + 页面栈
    └── screens/                # 全部 10 个页面
```
