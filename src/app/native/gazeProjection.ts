import type { Vec3 } from './gazeTracking';

/**
 * 把 ARKit 的世界座標視線投影到「螢幕平面」（z = 0），
 * 並用 2D 仿射變換對應到螢幕像素。
 *
 * 座標系約定：
 * - ARKit world：原點為相機，y 朝上、x 朝右、z 朝向使用者（face tracking config 預設）。
 * - 螢幕平面：z = 0（與相機嵌入位置同平面）。
 * - 仿射矩陣 T：把 ARKit 平面交點 (mx, my)（公尺）映射到螢幕像素 (px, py)。
 *
 * 校準前：用粗略線性映射，能看大致方向但不精準。
 * 校準後：用 fitCalibration() 算出的仿射矩陣，誤差會降到 cm 級。
 */

export interface ScreenPoint {
  /** 螢幕水平像素，0 為左 */
  px: number;
  /** 螢幕垂直像素，0 為上 */
  py: number;
}

export interface PlanePoint {
  /** 螢幕平面交點（公尺，ARKit world basis） */
  mx: number;
  my: number;
}

/**
 * 2D 仿射變換矩陣（行優先 2×3）。
 *   px = a * mx + b * my + tx
 *   py = c * mx + d * my + ty
 */
export interface CalibrationMatrix {
  a: number; b: number; tx: number;
  c: number; d: number; ty: number;
  /** 蒐集樣本數（用於除錯） */
  sampleCount: number;
  /** 擬合後的 RMSE（px，越小越準） */
  rmsePx: number;
  /** 校準時的螢幕像素尺寸（防止換螢幕方向後仍套用舊矩陣） */
  screenWidth: number;
  screenHeight: number;
  /** 校準時間 */
  createdAt: number;
}

const STORAGE_KEY = 'gazeCalibrationV1';

// ---------------------------------------------------------------------------
// 1. 從 ARKit 視線資料投影到螢幕平面（z = 0）
// ---------------------------------------------------------------------------

/**
 * 從兩眼世界座標位置 + lookAt 點，計算射線與 z=0 平面的交點（公尺）。
 * 若視線方向 z 分量太小（幾乎平行螢幕）則回傳 null。
 */
export function intersectGazeWithScreenPlane(
  lookAtWorld: Vec3,
  leftEyeWorld: Vec3,
  rightEyeWorld: Vec3,
): PlanePoint | null {
  const ex = (leftEyeWorld.x + rightEyeWorld.x) * 0.5;
  const ey = (leftEyeWorld.y + rightEyeWorld.y) * 0.5;
  const ez = (leftEyeWorld.z + rightEyeWorld.z) * 0.5;

  const dx = lookAtWorld.x - ex;
  const dy = lookAtWorld.y - ey;
  const dz = lookAtWorld.z - ez;

  // 視線必須朝螢幕方向（z 從正 → 負，dz < 0）
  if (Math.abs(dz) < 1e-4) return null;

  const t = -ez / dz;
  // 射線必須往前（不接受看著相機後方的反向交點）
  if (t < 0) return null;

  return {
    mx: ex + t * dx,
    my: ey + t * dy,
  };
}

// ---------------------------------------------------------------------------
// 2. 平面公尺 → 螢幕像素
// ---------------------------------------------------------------------------

/**
 * 把平面交點轉螢幕像素。
 * - 若 calib 提供 → 用仿射矩陣
 * - 否則用「粗略預設」：假設 ±0.15m 對應整個螢幕寬，±0.10m 對應整個高（對 iPad 一般觀看距離合理但極不精準）
 */
export function planePointToScreen(
  plane: PlanePoint,
  screenWidth: number,
  screenHeight: number,
  calib: CalibrationMatrix | null,
): ScreenPoint {
  if (calib) {
    return {
      px: calib.a * plane.mx + calib.b * plane.my + calib.tx,
      py: calib.c * plane.mx + calib.d * plane.my + calib.ty,
    };
  }
  const nx = (plane.mx + 0.15) / 0.30;
  const ny = 1 - (plane.my + 0.10) / 0.20;
  return {
    px: clamp(nx, 0, 1) * screenWidth,
    py: clamp(ny, 0, 1) * screenHeight,
  };
}

/** 一步到位：lookAt → 螢幕像素，失敗回 null */
export function projectGazeToScreen(
  lookAtWorld: Vec3,
  leftEyeWorld: Vec3,
  rightEyeWorld: Vec3,
  screenWidth: number,
  screenHeight: number,
  calib: CalibrationMatrix | null,
): ScreenPoint | null {
  const plane = intersectGazeWithScreenPlane(lookAtWorld, leftEyeWorld, rightEyeWorld);
  if (!plane) return null;
  return planePointToScreen(plane, screenWidth, screenHeight, calib);
}

/** 注視點是否在螢幕內（給 useEyeGazeMonitor 用）。容忍邊界 marginPx 像素。 */
export function isPointOnScreen(
  pt: ScreenPoint,
  screenWidth: number,
  screenHeight: number,
  marginPx = 0,
): boolean {
  return (
    pt.px >= -marginPx &&
    pt.px <= screenWidth + marginPx &&
    pt.py >= -marginPx &&
    pt.py <= screenHeight + marginPx
  );
}

// ---------------------------------------------------------------------------
// 3. 校準：用 5+ 對 (plane, target_px) 解 2D 仿射矩陣
// ---------------------------------------------------------------------------

export interface CalibrationSample {
  plane: PlanePoint;
  target: ScreenPoint;
}

/**
 * 用最小二乘擬合 2D 仿射變換。
 * 至少需要 3 個非共線樣本；建議 5–9 個並涵蓋四角 + 中央。
 */
export function fitCalibration(
  samples: CalibrationSample[],
  screenWidth: number,
  screenHeight: number,
): CalibrationMatrix | null {
  const n = samples.length;
  if (n < 3) return null;

  // px = a*x + b*y + tx
  // py = c*x + d*y + ty
  // 兩個獨立的 3 變數最小二乘問題，共用 3×3 normal matrix。
  let sxx = 0, sxy = 0, sx = 0, syy = 0, sy = 0;
  let sxu = 0, syu = 0, su = 0;
  let sxv = 0, syv = 0, sv = 0;

  for (const s of samples) {
    const x = s.plane.mx, y = s.plane.my;
    const u = s.target.px, v = s.target.py;
    sxx += x * x;
    sxy += x * y;
    sx += x;
    syy += y * y;
    sy += y;
    sxu += x * u; syu += y * u; su += u;
    sxv += x * v; syv += y * v; sv += v;
  }

  // M * [a, b, tx]^T = [sxu, syu, su]^T
  const M: number[][] = [
    [sxx, sxy, sx],
    [sxy, syy, sy],
    [sx, sy, n],
  ];

  const abx = solve3(M, [sxu, syu, su]);
  const cdy = solve3(M, [sxv, syv, sv]);
  if (!abx || !cdy) return null;

  const calib: CalibrationMatrix = {
    a: abx[0], b: abx[1], tx: abx[2],
    c: cdy[0], d: cdy[1], ty: cdy[2],
    sampleCount: n,
    rmsePx: 0,
    screenWidth,
    screenHeight,
    createdAt: Date.now(),
  };

  // 計算 RMSE
  let sse = 0;
  for (const s of samples) {
    const px = calib.a * s.plane.mx + calib.b * s.plane.my + calib.tx;
    const py = calib.c * s.plane.mx + calib.d * s.plane.my + calib.ty;
    const ex = px - s.target.px;
    const ey = py - s.target.py;
    sse += ex * ex + ey * ey;
  }
  calib.rmsePx = Math.sqrt(sse / n);
  return calib;
}

// ---------------------------------------------------------------------------
// 4. localStorage 持久化
// ---------------------------------------------------------------------------

export function saveCalibration(calib: CalibrationMatrix): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calib));
  } catch {
    /* swallow */
  }
}

export function loadCalibration(): CalibrationMatrix | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as CalibrationMatrix;
    if (
      typeof obj.a !== 'number' ||
      typeof obj.b !== 'number' ||
      typeof obj.tx !== 'number' ||
      typeof obj.c !== 'number' ||
      typeof obj.d !== 'number' ||
      typeof obj.ty !== 'number'
    ) {
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}

export function clearCalibration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* swallow */
  }
}

// ---------------------------------------------------------------------------
// 內部工具
// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * 解 3×3 線性系統 M * x = b（高斯消去法 + 部分主元）。
 * 失敗（奇異矩陣）回 null。
 */
function solve3(M: number[][], b: number[]): number[] | null {
  const A: number[][] = [
    [M[0][0], M[0][1], M[0][2], b[0]],
    [M[1][0], M[1][1], M[1][2], b[1]],
    [M[2][0], M[2][1], M[2][2], b[2]],
  ];
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let r = col + 1; r < 3; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
    }
    if (Math.abs(A[pivot][col]) < 1e-12) return null;
    if (pivot !== col) {
      const tmp = A[col]; A[col] = A[pivot]; A[pivot] = tmp;
    }
    const piv = A[col][col];
    for (let c = col; c < 4; c++) A[col][c] /= piv;
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = A[r][col];
      if (f === 0) continue;
      for (let c = col; c < 4; c++) A[r][c] -= f * A[col][c];
    }
  }
  return [A[0][3], A[1][3], A[2][3]];
}
