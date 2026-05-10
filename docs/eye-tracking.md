# 眼動追蹤技術路線

> 本文件記錄專案中「使用者注意力 / 視線」相關功能的當前實作、限制、以及升級到真正眼動追蹤的計畫。
>
> 維護者：Anson  
> 最後更新：2026-05-11

---

## 1. 名詞定義

| 名詞 | 含義 |
|---|---|
| **Attention Detection（注意力偵測）** | 二元分類：使用者「有沒有看著螢幕」。輸出 boolean。 |
| **Gaze Estimation / Eye Tracking（眼動追蹤）** | 估計使用者視線在螢幕上的 (x, y) 注視點。輸出座標。 |
| **Fixation（注視）** | 視線在某個點停留 ≥ 100 ms。 |
| **Saccade（掃視）** | 視線在兩個 fixation 之間的快速跳動。 |

本專案目前只做到 attention detection，**沒有**做到 gaze estimation。本文件規劃從前者升級到後者。

---

## 2. 現況：v1 純 Web MediaPipe（已上線）

### 2.1 實作位置

```
src/app/hooks/useEyeGazeMonitor.ts   ← 偵測層
src/app/pages/Gameplay.tsx           ← 應用層（彈分心提醒）
```

### 2.2 技術棧

- **執行環境**：瀏覽器 / Capacitor WebView，跨平台
- **影像來源**：`navigator.mediaDevices.getUserMedia({ facingMode: 'user' })`
- **模型**：MediaPipe `FaceLandmarker`（float16），透過 jsdelivr CDN 載入
- **特徵**：478 個臉部 landmark，含虹膜 10 個點（索引 468–477）
- **判斷邏輯**：把虹膜中心相對眼眶算成 0–1 比例，落在 `[0.22, 0.78] × [0.2, 0.85]` 即視為「在看」

### 2.3 輸出

每幀更新兩個 boolean：
- `hasFace`：是否偵測到臉
- `isLookingAtScreen`：虹膜是否在中央區間

### 2.4 應用：分心提醒

`Gameplay.tsx` 用 `gazeLostStartedAtRef` 累計偏離時間，超過 `distractorLevel` 對應的容忍時間後彈出全螢幕「請看回這裡喔！」。

| distractorLevel | 容忍時間 |
|---|---|
| off | ∞ |
| low | 3000 ms |
| medium（預設） | 2200 ms |
| high | 1600 ms |
| extreme | 1000 ms |

### 2.5 已知限制

| 問題 | 影響 |
|---|---|
| 沒有頭部姿態補償 | 頭一轉就誤判（即使眼睛還盯螢幕） |
| 沒有個人化校準（門檻寫死） | 戴眼鏡 / 眼眶較細的使用者誤觸發率高 |
| 沒有距離補償 | 靠近螢幕時邊緣注視會被誤判 |
| 模型走 CDN | 離線無法使用，會落到「鏡頭不可用」 |
| 只輸出 boolean | 無法做注視熱區、找不同先看哪個差異等需求 |
| 沒有平滑 | 邊界值附近狀態會抖動 |

---

## 3. 路線比較

| 路線 | 支援裝置 | 精度 | 工程量 | 離線 | 需要 native |
|---|---|---|---|---|---|
| **A. Web + WebGazer / 自製校準** | 全部 iPad / Android / Web | 區塊級 50–200 px | 中 | 視模型來源 | ❌ |
| **B. iOS Vision Framework** | iOS 14+ 全部 iPad | 中（眼眶級） | 高 | ✅ | ✅ Capacitor Plugin |
| **C. iOS ARKit `ARFaceAnchor.lookAtPoint`** | A12+ 機型，TrueDepth 最佳 | 高（< 1 cm，TrueDepth） / 中（無 TrueDepth） | 高 | ✅ | ✅ Capacitor Plugin |

詳細比較見 commit history 或先前的 chat。

---

## 4. 選定路線：C（ARKit）+ A（Web fallback）

### 4.1 為什麼選 C

- 我們的硬體前提是 **iPad Pro M4（2024+）+ iPad Air（M2 / M3）**，全部支援 ARKit `ARFaceTrackingConfiguration`。
- ARKit 的 `lookAtPoint` 是 **3D 視線匯聚點**，已內建頭部姿態與眼球距離，**不必自己做校準**就有可用精度。
- 跑在 Apple Neural Engine，對 CPU / 電池友善。
- 完全離線，不依賴外部 CDN。

### 4.2 為什麼還要保留 A 作為 fallback

- 若日後支援其他平台（Android / Web demo / Mac），仍需 web 版邏輯。
- 若 ARKit session 啟動失敗（被其他 App 佔用相機、權限被拒），可降級到 web 版本維持基本功能。
- 開發階段在桌面瀏覽器測試也方便。

### 4.3 iPad 機型支援表（重要）

| 機型 | A 系列 chipset | TrueDepth | ARKit FaceTracking | `lookAtPoint` 精度 |
|---|---|---|---|---|
| iPad Pro M4（2024）11" / 13" | M4 | ✅ | ✅ | 高（< 1 cm） |
| iPad Pro M2（2022）11" / 12.9" | M2 | ✅ | ✅ | 高（< 1 cm） |
| iPad Air M2（2024）11" / 13" | M2 | ❌ | ✅（A12+ 即可） | 中（沒深度補償，誤差較大） |
| iPad Air M3（2025）11" / 13" | M3 | ❌ | ✅ | 中 |
| iPad mini A17 Pro（2024） | A17 Pro | ❌ | ✅ | 中 |
| iPad（基本款 11 代以下） | A14–A16 | ❌ | ✅ | 中 |

**重點**：`ARFaceTrackingConfiguration.isSupported` 在 iOS 14+ 對 A12+ 全部回傳 true，但**精度差異很大**：
- TrueDepth 機型有實體深度資料 → 高精度
- 非 TrueDepth 機型用單眼鏡頭 + ML 推估深度 → 精度較低

App 啟動時要記錄 `device.model`，在分析數據時應將兩類機型分開看。

---

## 5. v2 架構（要做的）

### 5.1 模組劃分

```
┌─────────────────────────────────────────────┐
│  src/app/hooks/useEyeGazeMonitor.ts         │
│  ↓ 自動偵測平台                                │
│  ├── isNativePlatform() → useNativeGaze     │
│  └── 否則 → 原本的 web MediaPipe              │
└─────────────────────────────────────────────┘
              ↓ Native 路徑
┌─────────────────────────────────────────────┐
│  src/app/native/gazeTracking.ts (TS bridge) │
│  registerPlugin<GazeTracking>('GazeTracking')│
└─────────────────────────────────────────────┘
              ↓ Capacitor IPC
┌─────────────────────────────────────────────┐
│  ios/App/App/GazeTrackingPlugin.swift       │
│  ARSession + ARFaceTrackingConfiguration    │
│  → notifyListeners('gazeUpdate', payload)    │
└─────────────────────────────────────────────┘
```

### 5.2 Native 與 Web 互斥（重要）

ARKit session 與 web 端 `getUserMedia` **同時使用前鏡頭會衝突**。規則：

1. App 啟動時呼叫 `GazeTracking.isSupported()` 檢測。
2. 若 `supported === true` → 進入 native 模式：
   - `useEyeGazeMonitor` **不**啟動 `getUserMedia`
   - 由 `GazeTracking.start()` 接管前鏡頭
   - 訊號透過 `gazeUpdate` event 進到 React state
3. 若不支援（理論上不會發生於 iPad Pro M4 / Air）→ 走 web fallback。

### 5.3 資料流（plugin 第一版）

每幀 ARKit 回傳：

```typescript
interface GazeUpdate {
  isTracked: boolean;
  // face-space coordinates (metres，原點在臉中央)
  lookAtFace: { x: number; y: number; z: number };
  // world-space（ARKit 啟動時的相機座標系）
  lookAtWorld: { x: number; y: number; z: number };
  leftEyeWorld: { x: number; y: number; z: number };
  rightEyeWorld: { x: number; y: number; z: number };
  // 4×4 face transform（column-major flatten 16 floats）
  faceTransform: number[];
  timestamp: number; // unix ms
}
```

### 5.4 投影到螢幕座標

從 ARKit 給的視線資料計算螢幕注視點 (x, y)：

```
gazeRay = ray(origin: eyesCenter, direction: normalize(lookAtWorld - eyesCenter))
screenPlane = z = 0 平面（ARKit 啟動時 == 相機平面）
hitPoint = intersect(gazeRay, screenPlane)

screenX = hitPoint.x + cameraOffsetX(設備機型)
screenY = -hitPoint.y + cameraOffsetY(設備機型)
```

`cameraOffsetX/Y` 是 **iPad 相機在螢幕上的物理位置 offset**（單位公尺）。
- iPad Pro M4 11"：相機在橫邊中央
- iPad Pro M4 13"：相機在橫邊中央
- iPad Air M2 11"：相機在橫邊中央（M2 起 Air 也移到橫邊）

各機型實測值需要建表（v2.1 任務）。

### 5.5 校準（v2.2）

ARKit 已內建大致正確的視線估計，但每位使用者仍有 0.5–1.5° 的個人偏差。校準流程：

1. 在 `Calibration.tsx` 顯示 5 個點（4 角 + 中央）
2. 每點停留 1.5 秒，記錄 ARKit 給的 `screenX/Y` 與目標 `screenX/Y`
3. 計算 2D 仿射變換 `T`（3×3 矩陣，least squares）
4. 把 `T` 存到 `localStorage`，後續所有 gaze point 都過 `T`

## 6. 階段性 milestone

### v2.0 — 通訊與資料流（**目前階段**）
- [x] 撰寫本文件
- [ ] 建立 `GazeTrackingPlugin.swift`，回傳原始 ARKit 資料
- [ ] 建立 web bridge `gazeTracking.ts`
- [ ] 建立測試頁 `/parent/gaze-test`，顯示 `lookAtFace` 三軸數值
- [ ] 在 iPad Pro M4 上實機驗證資料流

### v2.1 — 螢幕投影
- [ ] 建立各機型 camera offset 表
- [ ] Web 端把 `lookAtWorld + eye centers` 投影到螢幕 (x, y)
- [ ] 測試頁顯示綠色光點跟著視線移動
- [ ] 量測各機型在沒校準時的精度（角度誤差）

### v2.2 — 個人化校準
- [ ] `Calibration.tsx` 接 ARKit 資料蒐集樣本
- [ ] 計算 2D 仿射變換並儲存
- [ ] 校準後重新量測精度

### v2.3 — 整合到 Gameplay
- [ ] `useEyeGazeMonitor` 自動切換 native / web
- [ ] 分心判斷改用「注視點是否在螢幕內」
- [ ] 加入注視熱區紀錄（找不同：先看哪個差異）
- [ ] iPad Air（無 TrueDepth）vs iPad Pro 精度比較報告

### v2.4 — 進階分析（如需要）
- [ ] Fixation / Saccade 偵測
- [ ] 注視時間統計給家長端 Analytics
- [ ] 視線軌跡可視化

---

## 7. 已知風險

| 風險 | 緩解 |
|---|---|
| ARKit session 啟動慢（800–1500 ms） | 在 SplashScreen 預啟動，或顯示「正在準備鏡頭」 |
| iPad Air 精度不足以支撐校準 | v2.1 量測後決定是否要對 Air 做特殊處理 |
| 鏡頭被其他 App 佔用 | session error 時降級到 web fallback |
| App 進入背景時 ARKit 自動暫停 | 監聽 `applicationDidBecomeActive` 重啟 session |
| 使用者拒絕相機權限 | 仍維持遊戲可玩，停用注意力提醒 |
| 隱私顧慮（家長 / 醫療場景） | 影像永不離開裝置；本文件中明列；UI 顯示「本機處理」標示 |

---

## 8. 參考

- [ARFaceAnchor | Apple Developer](https://developer.apple.com/documentation/arkit/arfaceanchor)
- [ARFaceAnchor.lookAtPoint](https://developer.apple.com/documentation/arkit/arfaceanchor/2968191-lookatpoint)
- [Tracking and Visualizing Faces (Apple Sample)](https://developer.apple.com/documentation/arkit/content_anchors/tracking_and_visualizing_faces)
- [Capacitor 8 Custom Plugins (iOS)](https://capacitorjs.com/docs/plugins/ios)
- MediaPipe FaceLandmarker（v1 使用）
