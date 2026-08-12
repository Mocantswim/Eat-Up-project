# 《食光运动》开发实施计划

> 版本：V1.0　日期：2026-08-11
> 依据：《食光运动》产品策划书 V1.0（定稿）
> 状态：**待评审** —— 您确认本计划后即开工

## 0. 说明

策划书已定稿。此前提出的 11 个待确认点已全部采纳建议；您新增了一条硬性要求：

> **本应用在手机上使用；卸载时必须彻底清除数据（不残留、不恢复）。**

该要求已作为独立章节（§8）纳入本计划，并配有验收用例。

## 1. 已确认决策汇总（12 项）

| # | 决策点 | 最终方案 |
|---|--------|----------|
| 1 | 食物换算随机性 | 以“日期字符串”为随机种子，当天随机结果全天固定，跨天变化 |
| 2 | 食物数量下限 | 仅从“数量 ≥ 0.5”的食物中随机取 2–3 种；不足 2 种时阈值降至 0.1 兜底 |
| 3 | 同日体重录入 | `weight_records.date` 加 UNIQUE，同日重复录入按 upsert 覆盖 |
| 4 | 删除自定义运动 | 仅从选择列表中移除，历史运动记录完整保留（依赖快照字段） |
| 5 | 撒花特效 | 每日消耗首次 ≥500kcal 触发一次；本地标记“当日已触发”，重启当天不重复 |
| 6 | 资料必填性 | 首启引导强制填写体重；身高/年龄/性别选填；缺失时 BMI/BMR 显示 “—” |
| 7 | 姓名 | V1 不加入姓名字段，头像用默认插画占位 |
| 8 | 横竖屏 | 全局锁定竖屏；统计页进入时解锁横屏、离开恢复竖屏 |
| 9 | 图表库 | 见 §3.1 调整说明（建议 react-native-gifted-charts） |
| 10 | 撒花实现 | react-native-reanimated 自绘星星/粒子，不引入 Lottie 素材 |
| 11 | 月历 | 自绘轻量月历组件（网格+圆点+左右滑动+年月跳转） |
| 12 | 卸载彻底性 | `android:allowBackup=false` + 数据仅存应用私有目录（详见 §8） |

## 2. 目标环境与约束

- 单机 Android 应用，**最低 Android 8.0（API 26）**。
- Expo managed workflow + TypeScript（严格模式）。
- 无网络请求、无账号体系、无远程数据。
- 所有数据仅在本地；**卸载即彻底清除**（§8）。

## 3. 技术栈（最终）

| 用途 | 依赖 | 说明 |
|------|------|------|
| 框架 | expo（SDK 57 稳定版）+ react-native + typescript | `create-expo-app` 初始化 |
| 导航 | @react-navigation/native + native-stack + bottom-tabs | 底部三 Tab + 栈式页面 |
| 数据库 | expo-sqlite | 现代 API（openDatabaseSync / SQLiteProvider） |
| 图表 | react-native-gifted-charts | 见 §3.1 |
| 图表支撑 | react-native-svg、expo-linear-gradient | gifted-charts 的 peer 依赖 |
| 动画 | react-native-reanimated | 食物弹出、撒花粒子、日历滑动 |
| 手势 | react-native-gesture-handler | 日历左右滑动 |
| 触感反馈 | expo-haptics | 添加成功轻振动 |
| 屏幕方向 | expo-screen-orientation | 统计页横屏 |
| 图标 | @expo/vector-icons（UI 图标）+ 自绘 react-native-svg（食物插画） | 扁平可爱风格 |
| 字体 | expo-font + 站酷快乐体 TTF | 见 §14 资源项 |
| 本地标记 | @react-native-async-storage/async-storage | 撒花“当日已触发”标记 |
| 单测 | jest-expo + jest | 纯逻辑单测（§11） |

### 3.1 图表库调整说明（评审点）

原确认项 #9 是 `victory-native + @shopify/react-native-skia`。开发前查证结论：

- victory-native（XL）当前为 **MIT 许可**，无商用收费问题 ✅；
- 但它强依赖 **@shopify/react-native-skia + reanimated + gesture-handler**，原生体积与构建复杂度较高；
- **建议改为 `react-native-gifted-charts`**：MIT 许可、纯 JS 实现、仅依赖 `react-native-svg` 与 `expo-linear-gradient`，柱状/折线/饼图/环形图 + 动画全覆盖，与 Expo 集成最简单，完全满足本产品三种图表需求。

> 默认采用 gifted-charts。若您坚持 victory-native 也完全可行（无许可风险），仅体积增大——请在评审时给出结论。

## 4. 项目目录结构

```
食光计划/
├── app.json / app.config.js        # Expo 配置（含 build-properties 插件）
├── eas.json                        # EAS 构建配置（preview/release）
├── package.json / tsconfig.json
├── assets/fonts/ZCOOL-KuaiLe.ttf   # 站酷快乐体（需提供，见 §14）
└── src/
    ├── theme/          # 颜色、间距、圆角、字号常量
    ├── constants/      # sports.ts（内置运动）、foods.ts（食物库）
    ├── db/             # database.ts（建表+迁移）、userProfileDao.ts、
    │                   # exerciseLogDao.ts、weightRecordDao.ts、customSportDao.ts
    ├── utils/          # date.ts、calc.ts、food.ts（换算）、seededRandom.ts
    ├── components/     # Calendar.tsx、FoodCard.tsx、FoodIcon/ 10 个 SVG、
    │                   # Confetti.tsx、SportIcon.tsx、FAB.tsx、FormRow.tsx 等
    ├── navigation/     # RootNavigator.tsx、TabNavigator.tsx、types.ts
    └── screens/
        ├── OnboardingScreen.tsx    # 首启引导（体重必填）
        ├── HomeScreen.tsx          # 月历 + 今日卡片
        ├── DayDetailScreen.tsx     # 日期详情
        ├── AddEditExerciseScreen.tsx
        ├── StatsScreen.tsx         # 三图表切换 + 横屏
        ├── ProfileScreen.tsx       # 我的
        ├── EditProfileScreen.tsx   # 资料编辑
        ├── CustomSportsScreen.tsx / CustomSportFormScreen.tsx
        └── AboutScreen.tsx
```

## 5. 数据库设计（定稿）

建表 SQL（expo-sqlite 初始化时执行；`CREATE TABLE IF NOT EXISTS`，预留 version 迁移机制）：

```sql
-- 用户资料（单行，id 恒为 1）
CREATE TABLE IF NOT EXISTS user_profile (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  weight      REAL,              -- 当前体重 kg（新增运动时使用）
  height      REAL,              -- 身高 cm（BMI/BMR）
  age         INTEGER,
  gender      TEXT,              -- 'male' | 'female' | NULL
  updated_at  TEXT
);

-- 体重记录（趋势图用，与当前体重解耦）
CREATE TABLE IF NOT EXISTS weight_records (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  date    TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD，同日覆盖
  weight  REAL NOT NULL
);

-- 运动记录（快照机制）
CREATE TABLE IF NOT EXISTS exercise_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  date          TEXT NOT NULL,   -- YYYY-MM-DD
  sport_type    TEXT NOT NULL,   -- 运动名称（自定义删除后历史仍显示）
  duration_min  REAL NOT NULL,   -- 分钟
  met_value     REAL NOT NULL,   -- 计算时 MET 快照
  weight_used   REAL NOT NULL,   -- 计算时体重快照
  calories      REAL NOT NULL,   -- 消耗 kcal（1 位小数）
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exercise_log_date ON exercise_log (date);

-- 自定义运动
CREATE TABLE IF NOT EXISTS custom_sports (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  met_value  REAL NOT NULL
);
```

设计要点：
1. `exercise_log` 全字段快照 → 修改体重/自定义运动均不影响历史数据。
2. `weight_records.date UNIQUE` → 同日体重 upsert（先 UPDATE 无果则 INSERT）。
3. 撒花“当日已触发”用 AsyncStorage 键 `confetti_<YYYY-MM-DD>` 记录，不进 SQLite。

## 6. 核心业务逻辑

### 6.1 热量计算
```
消耗(kcal) = MET × 体重(kg) × (时长分钟 / 60)
结果保留 1 位小数（四舍五入）。
```

### 6.2 BMI / BMR（Mifflin-St Jeor）
```
BMI = 体重 / (身高/100)²          → 1 位小数
BMR(男) = 10×体重 + 6.25×身高 − 5×年龄 + 5
BMR(女) = 10×体重 + 6.25×身高 − 5×年龄 − 161
身高单位为 cm；BMR 结果 1 位小数。
身高/年龄/性别缺失 → BMI/BMR 显示 “—”。
```

### 6.3 食物换算
- 当日总消耗 T = Σ(当日 exercise_log.calories)；T ≤ 0 时不展示。
- 候选集 C = { 食物 | T / 食物kcal ≥ 0.5 }；若 |C| < 2 则放宽阈值到 0.1。
- 用种子随机（`hash(YYYY-MM-DD) → mulberry32`）从 C 中取 2–3 种（C 不足则全取）。
- 数量 = T / 单品kcal，保留 1 位小数；格式：“约 2.6 碗米饭”。

食物单位标签（定稿建议，见 §14 评审）：

| 食物 | kcal | 单位标签 |
|------|------|----------|
| 米饭 | 116/100g | 碗 |
| 苹果 | 95/个 | 个 |
| 鸡蛋 | 70/个 | 个 |
| 面包 | 70/片 | 片 |
| 鸡胸肉 | 133/100g | 份 |
| 可乐 | 139/330ml | 瓶 |
| 冰淇淋 | 120/球 | 球 |
| 牛奶 | 108/200ml | 杯 |
| 香蕉 | 105/根 | 根 |
| 西兰花 | 34/100g | 份 |

### 6.4 撒花判定
- 添加/编辑运动后重算当日总消耗；≥500 且 AsyncStorage 无 `confetti_<当日>` 键 → 播放一次撒花并写标记。
- 历史回填不触发；跨天重置。

### 6.5 自定义运动
- 新增/编辑：名称唯一校验；MET 范围建议 1.0–16.0（超出给提示，不强制）。
- 删除：Alert 二次确认，提示“历史记录将保留”；仅删 custom_sports 行。

### 6.6 体重录入
- 详情页体重输入 → `weight_records` upsert（date 唯一）；留空则不写入/不删除。

## 7. 页面与导航

```
Root Stack
├── Onboarding（仅首次启动显示；体重必填，可跳过身高/年龄/性别）
└── Main（Bottom Tabs）
    ├── 首页 Tab
    │     Home（月历+今日卡片）
    │       └── DayDetail（日期详情：体重/运动列表/总消耗与食物）
    │             └── AddEditExercise（添加/编辑运动）
    ├── 统计 Tab → Stats（日消耗柱状图｜体重折线图｜运动分布环形图）
    └── 我的 Tab
          Profile（资料卡片/BMI/BMR/入口）
            ├── EditProfile（体重/身高/年龄/性别）
            ├── CustomSports（列表+内置参考）→ CustomSportForm（新增/编辑）
            └── About（版本/开发者/字体版权说明）
```

各页要点：
- **Home**：顶部“食光运动”标题（点击弹年月跳转面板）；今日总消耗大字 + 食物换算卡片（2–3 种食物，错位弹出动画）；自绘月历网格（今天高亮、有记录淡蓝圆点、左右滑动切月）；有记录的日期点按进入详情。
- **DayDetail**：返回 + “M月D日 周X”；当日体重输入（upsert）；运动列表（图标/名称/时长/消耗，右侧编辑删除）；底部总消耗 + 食物换算；悬浮 “+” FAB。
- **AddEditExercise**：运动类型下拉（内置+自定义，含搜索过滤）、时长输入（数字键盘，1–1440 校验）、实时显示预估消耗；保存后 haptics 轻反馈。
- **Stats**：三段式切换；柱状图（本月/本周）；折线图（近一月/三月/一年，仅绘制有体重记录的点）；环形图（本月各运动消耗占比）；进入页面解锁横屏、离开恢复竖屏；颜色用淡蓝主系 + 暖色点缀。
- **Profile**：当前体重/身高/年龄/性别（可编辑）、BMI/BMR 展示、“自定义运动管理”“关于”入口、版本号。
- **Onboarding**：简介插画 + 体重输入（必填）+ 可选身高/年龄/性别 → 保存后进主界面；后续可在“我的”修改。

## 8. 卸载彻底性方案（您新增的硬性要求）

目标：卸载 App 后，本机不残留任何业务数据；重装不自动恢复旧数据。

实现（三道防线）：

1. **关闭 Android 自动备份**：通过 `expo-build-properties` 配置 `android.allowBackup: false`，并注入 `android:dataExtractionRules`（API 31+）禁用备份。若某版本插件不支持该属性，则写一个本地 config plugin（`app.plugin.js`）在 prebuild 时强制注入 `android:allowBackup="false"`（确定性兜底，必达目标）。
2. **数据仅存应用私有目录**：expo-sqlite（默认 `/data/data/<包名>/databases/`）与 AsyncStorage（默认私有目录）均属应用私有存储；**不写入**相册、下载、共享存储等公共目录；V1 无导出功能，从源头杜绝残留。
3. **无任何网络/云端写入**：全程无网络权限，卸载后无服务端残留。

验证用例（必测）：
```
① 安装 → 录入运动与体重 → 确认正常显示
② 卸载 App
③ 系统“设置 → 应用”确认已卸载干净
④ 重新安装 → 打开 → 应为全新空白状态（无任何历史数据、无自动恢复）
```

补充说明：Android 系统“自动备份”（Auto Backup）默认可能把应用数据备份到云端，卸载重装时会自动恢复旧数据，这正是“卸载不彻底”的最大来源；`allowBackup=false` 从根上切断它。

## 9. 内置数据常量（定稿）

### 9.1 内置运动（10 种，固定，不可删除）

| 运动 | MET | 备注 |
|------|-----|------|
| 跑步 | 8.0 | 约 8km/h 慢跑 |
| 快走 | 5.0 | 约 6km/h |
| 游泳 | 6.0 | 慢速自由泳 |
| 骑行 | 6.8 | 16–19km/h |
| 跳绳 | 8.0 | 中等速度 |
| 瑜伽 | 2.5 | 哈他瑜伽 |
| 爬楼梯 | 4.0 | 一般上楼梯 |
| 健身操 | 5.0 | 中等强度有氧操 |
| 仰卧起坐 | 3.8 | 中等强度 |
| 俯卧撑 | 3.8 | 中等强度 |

内置运动写入代码常量 `constants/sports.ts`，不落库。

### 9.2 食物库（10 种，固定）

见 §6.3 表格（含单位标签）。

## 10. 里程碑与验收（10 步，可增量验收）

| 阶段 | 内容 | 验收标准 |
|------|------|----------|
| M0 资源准备 | 获取站酷快乐体 TTF；确认包名 | 字体文件入 assets；app.json 包名确定 |
| M1 脚手架 | create-expo-app + TS + 导航骨架 + 主题常量 | 三 Tab 可切换，5 大页面空态可打开 |
| M2 数据层 | 建表 + 4 个 DAO + 常量 + calc/换算/seededRandom/date 工具 | 单测全绿（jest-expo） |
| M3 引导+我的 | Onboarding、Profile、EditProfile、BMI/BMR、CustomSports 增删改 | 首启强填体重；BMI/BMR 正确；自定义运动 CURD |
| M4 运动记录 | 添加/编辑/删除 + 热量计算 + 体重快照 + 二次确认 | 旧记录不受体重修改影响；删除有确认框 |
| M5 食物换算 | 食物卡片 + 日期种子随机 + 数量阈值 + 错位弹出动画 | 同一天多次进入结果一致；次日变化 |
| M6 月历+详情 | 自绘月历 + 圆点 + 年月跳转 + DayDetail + 当日体重 upsert | 跨年翻月正确；无记录无圆点；体重同日覆盖 |
| M7 统计 | 三图表 + 周/月、近一月/三月/一年切换 + 横屏 | 空数据不崩；体重折线仅有点；横屏正常 |
| M8 动效打磨 | 撒花（当日一次）+ 字体/圆角/空态/振动统一 | 首达 500 撒花一次；重启当天不重复 |
| M9 测试 | 单测补全 + 真机用例清单逐条跑 | 见 §11 |
| M10 打包 | eas build preview/release APK + 签名 | APK 安装成功，卸载彻底性用例通过 |

## 11. 测试计划

### 11.1 单元测试（jest-expo）
- `calc.test.ts`：热量公式、1 位小数、边界（0 分钟、1440 分钟）。
- `food.test.ts`：数量公式、0.5 阈值与 0.1 兜底、种子随机同天稳定/跨天不同、取 2–3 种。
- `date.test.ts`：YYYY-MM-DD 格式化、跨月/跨年、周几计算、当月天数。
- `bmr.test.ts`：男/女公式、缺失字段返回 null。

### 11.2 手动验收用例（覆盖策划书 §八 + 新增）
1. 体重修改后：新运动用新体重，旧记录数值不变。
2. 日历：无记录无圆点，有记录有淡蓝圆点；跨年翻月正确。
3. 自定义运动：新增后出现在选择列表；编辑/删除生效；删除二次确认。
4. 食物换算：同天刷新结果一致；数量 1 位小数；总消耗 0 不展示。
5. 删除运动：二次确认；删除后当日总消耗/换算即时更新。
6. 体重趋势：仅绘制有记录的点；近一月/三月/一年切换正确。
7. 撒花：当日首达 500 触发一次；重启当天不重复。
8. **卸载彻底性**：§8 用例（装→录→卸→装→空白）。
9. 统计页横屏：旋转后图表自适应，返回竖屏。
10. 首启流程：首次进入必须填体重；跳过可选字段后可在“我的”补齐。

## 12. 打包与发布

- `eas.json`：`development`（调试）、`preview`（apk，非上架测试）、`production`（release 签名）。
- 关键配置（app.json / eas）：
  - `android.package`：评审确认包名（建议 `com.shiguang.sport`，可改）。
  - `android.minSdkVersion = 26`（经 expo-build-properties）。
  - `android.allowBackup = false`（§8）。
  - `orientation` 策略：主 app 竖屏锁定，统计页代码内动态解锁。
  - 图标/启动图：生成适配多尺寸。
- 命令：`eas build -p android --profile preview`；签名密钥由开发者保管并加入 `.gitignore`。

## 13. 风险与缓冲

| 风险 | 应对 |
|------|------|
| 图表库集成细节 | 评审时锁定选型；必要时换 victory-native（MIT 无许可问题） |
| 字体 TTF 获取/版权 | 站酷快乐体免费商用；请提供 TTF 或确认下载渠道；缺字时系统字体兜底 |
| 真机兼容（旧机型 API 26） | M9 安排 2 台以上低版本真机；reanimated 相关降级预案 |
| 统计页横屏布局 | 图表容器 flex 自适应 + 横屏专属间距 |

## 14. 请评审时拍板的最后事项

1. 图表库：采纳调整后的 **react-native-gifted-charts**，还是维持 victory-native？
2. 包名：使用 `com.shiguang.sport` 还是指定其他？
3. 字体：您提供“站酷快乐体”TTF 文件，还是授权我下载？
4. 食物单位标签（§6.3 表）：按建议执行，还是调整个别单位？

---

**开工条件**：您对本计划给出确认（或对 §14 给出答复）。之后我将按 M1→M10 顺序进入实现，每一步完成可运行的增量并验证。





