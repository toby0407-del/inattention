# Authentication and Dashboard Design — 系統架構（最新）

> 對應目前程式：**React 18 + Vite 6 + React Router 7**。此檔為單一事實來源，後續改路由／狀態／大地圖行為請同步更新圖。

## 總覽（路由／版面）

```mermaid
flowchart TB
  subgraph root["/` — Root"]
    AppProvider["AppProvider（全域狀態）"]
    Outlet["Outlet"]
  end

  subgraph splash["兒童／家長入口"]
    Splash["SplashScreen（`/` index）"]
  end

  subgraph parent["家長區 `/parent/*`"]
    PL["ParentLayout"]
    Dash["Dashboard"]
    Ana["Analytics"]
    Set["Settings"]
    Dev["Developer"]
  end

  subgraph child["兒童遊玩 `/child/*`"]
    QM["QuestMap（黃道星圖／關卡地圖）"]
    Cal["Calibration"]
    GP["Gameplay"]
    RW["Reward"]
  end

  AppProvider --> Outlet
  Outlet --> Splash
  Outlet --> PL
  Outlet --> QM
  Outlet --> Cal
  Outlet --> GP
  Outlet --> RW
  PL --> Dash
  PL --> Ana
  PL --> Set
  PL --> Dev
```

### 路由對照（`src/app/routes.tsx`）

| Path | 畫面 | 備註 |
|------|------|------|
| `/` | `SplashScreen` | PIN／兒童進入、`/child/lobby`、`/parent` |
| `/parent` | `Dashboard` | `ParentLayout` 子項 index |
| `/parent/analytics` | `Analytics` | |
| `/parent/settings` | `Settings` | |
| `/parent/dev` | `Developer` | 開發 PIN 後進入 |
| `/child/lobby` | `QuestMap` | 十二星座章節、星圖、圖鑑 |
| `/child/calibration` | `Calibration` | |
| `/child/play` | `Gameplay` | query：`mode`、`level` |
| `/child/reward` | `Reward` | |

---

## QuestMap／圖鑑（最新交互）

```mermaid
flowchart LR
  subgraph quest["QuestMap"]
    TopBar["頂欄：返回／星星／圖鑑捷徑"]
    MapSvg["SVG：示意星網 + 主線金線"]
    Nodes["主星節點（關卡）"]
    ModalLevel["選關卡彈窗"]
    ModalTip["章節『？』說明"]
    ModalBook["圖鑑全螢面板"]
  end

  subgraph book["圖鑑面板內容"]
    Globe["ConstellationGlobe<br/>（可拖曳／慢轉 3D 地球）"]
    Ring["黃道 12 標記／完成度配色"]
    List["詳細紀錄：每章主星格 + 典藏條 + 太陽區間約期"]
  end

  TopBar --> ModalBook
  ModalBook --> Globe
  Globe --> Ring
  ModalBook --> List
  Nodes --> ModalLevel
```

- **已完成判定（地球環上綠標）**：`isChapterComplete(chapter, completedLevels)`（該星座全部主星 `level.id` 皆在 `completedLevels`）。
- **圖鑑格子解鎖顯示**：`collectedLevelIds` 或 `completedLevels`（與典藏條計數一致；典藏在 UI 上以章內統計呈現）。

---

## 資料與關卡模型

```mermaid
flowchart TB
  subgraph data["src/app/data"]
    CH["chapters.ts"]
    LM["levels.ts（型別 + 背景主題函式）"]
  end

  CH -->|"CHAPTERS、`ConstellationGeometry`、每章 constellation"| QM2["QuestMap / Gameplay / Reward"]
  LM -->|"re-export：`CHAPTERS`、`mapLayoutCoords`、`constellationEdgesFor`、`isChapterComplete`"| QM2

  subgraph models["核心型別（摘錄）"]
    Z["ZodiacInfo：glyph、meaning、approxSunDates…"]
    L["LevelMeta：id、mode、zodiac、collectible…"]
    CD["ChapterDef：levels[]、constellation{stars,edges}"]
  end

  CH --> CD
  CH --> Z
  CH --> L
```

---

## 全域狀態（`AppContext`）

```mermaid
flowchart LR
  Ctx["AppContext"]

  Ctx --> S1["進度：`completedLevels`"]
  Ctx --> S2["收集：`collectedLevelIds`"]
  Ctx --> S3["主線：`currentLevel`"]
  Ctx --> S4["評分：`totalStars`、`lastGameScore`"]
  Ctx --> S5["親子／開發：`isParentAuth`、`isDeveloperAuth`"]
  Ctx --> S6["兒童檔：`selectedChild`"]
  Ctx --> S7["調教：`distractorLevel`、`eyeDistanceLock`、`toleranceThreshold`"]
```

下游主要消費者：`QuestMap`、`Gameplay`、`Reward`、`SplashScreen`、`Settings` 等頁。

---

## 目錄導覽（常改檔）

| 路徑 | 用途 |
|------|------|
| `src/app/routes.tsx` | 路由器設定 |
| `src/app/context/AppContext.tsx` | 全域狀態 |
| `src/app/data/chapters.ts` | 12 星座章節資料、星圖座標／邊、`LEVELS_META` |
| `src/app/data/levels.ts` | 型別、`themeBackground`、`getLevelMeta`、re-export |
| `src/app/pages/QuestMap.tsx` | 星圖 UI、章節切換、圖鑑、彈窗 |
| `src/app/components/ConstellationGlobe.tsx` | 圖鑑內地球＋十二星座完成配色 |
| `src/app/pages/Gameplay.tsx` | 關卡遊玩 |
| `src/app/pages/Reward.tsx` | 通關結算／鼓勵文案 |
| `src/app/layouts/ParentLayout.tsx` | 家長區共通版面 |

---

*最後更新：配合「圖鑑 → 旋轉地球 + 黄道 12 星座完成色系 + 詳細紀錄列表」行為。*
