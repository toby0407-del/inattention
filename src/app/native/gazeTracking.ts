import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface GazeUpdate {
  isTracked: boolean;
  /** lookAtPoint 在臉部座標系（公尺）。原點頭中央，y 上、x 右、z 前。 */
  lookAtFace: Vec3;
  /** lookAtPoint 在世界座標系（ARKit 啟動時的相機座標系，公尺） */
  lookAtWorld: Vec3;
  leftEyeWorld: Vec3;
  rightEyeWorld: Vec3;
  /** 4×4 face transform，column-major flatten 成 16 個 float */
  faceTransform: number[];
  /** unix timestamp ms */
  timestamp: number;
}

export interface GazeError {
  message: string;
}

export interface GazeInterruption {
  interrupted: boolean;
}

export interface IsSupportedResult {
  supported: boolean;
}

export interface GazeTrackingPlugin {
  isSupported(): Promise<IsSupportedResult>;
  start(): Promise<void>;
  stop(): Promise<void>;
  addListener(
    eventName: 'gazeUpdate',
    listenerFunc: (data: GazeUpdate) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'gazeError',
    listenerFunc: (data: GazeError) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'gazeInterruption',
    listenerFunc: (data: GazeInterruption) => void,
  ): Promise<PluginListenerHandle>;
}

/**
 * ARKit-based gaze tracking 原生 plugin。
 * 只在 iOS native（Capacitor 環境）可用；其他平台呼叫會 reject。
 */
export const GazeTracking = registerPlugin<GazeTrackingPlugin>('GazeTracking');

/** 是否在 iOS native runtime 中（決定要不要走 native 路徑） */
export function isNativeIOS(): boolean {
  return Capacitor.getPlatform() === 'ios' && Capacitor.isNativePlatform();
}
