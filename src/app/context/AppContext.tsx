import React, { createContext, useContext, useState } from 'react';

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
}

interface AppContextType {
  isParentAuth: boolean;
  setIsParentAuth: (v: boolean) => void;
  isDeveloperAuth: boolean;
  setIsDeveloperAuth: (v: boolean) => void;
  selectedChild: ChildProfile;
  setSelectedChild: (v: ChildProfile) => void;
  totalStars: number;
  setTotalStars: (v: number) => void;
  completedLevels: number[];
  setCompletedLevels: (v: number[]) => void;
  collectedLevelIds: number[];
  setCollectedLevelIds: (v: number[]) => void;
  currentLevel: number;
  setCurrentLevel: (v: number) => void;
  lastGameScore: number;
  setLastGameScore: (v: number) => void;
  distractorLevel: 'off' | 'low' | 'medium' | 'high' | 'extreme';
  setDistractorLevel: (v: 'off' | 'low' | 'medium' | 'high' | 'extreme') => void;
  eyeDistanceLock: boolean;
  setEyeDistanceLock: (v: boolean) => void;
  toleranceThreshold: number;
  setToleranceThreshold: (v: number) => void;
  /** 分心等事件是否播放音效提示 */
  soundHintEnabled: boolean;
  setSoundHintEnabled: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** 示意：錄製／截圖介面偏好模糊（產品層可自行接資料） */
  privacyBlurEnabled: boolean;
  setPrivacyBlurEnabled: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** 找不同：場景順序是否隨機（治療師端可調） */
  spotSceneRandomEnabled: boolean;
  setSpotSceneRandomEnabled: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** 找不同：隨機種子（同一種子可重現同一排序） */
  spotSceneRandomSeed: number;
  setSpotSceneRandomSeed: (v: number | ((prev: number) => number)) => void;
  /** 找不同：每局秒數（治療師可調） */
  spotTimeLimitSec: number;
  setSpotTimeLimitSec: (v: number | ((prev: number) => number)) => void;
  /** 找不同：最多錯誤點擊次數 */
  spotMaxMistakes: number;
  setSpotMaxMistakes: (v: number | ((prev: number) => number)) => void;
  /** 記憶配對：記憶展示秒數 */
  memoryShowSeconds: number;
  setMemoryShowSeconds: (v: number | ((prev: number) => number)) => void;
  /** 記憶配對：作答秒數 */
  memoryPlayLimitSec: number;
  setMemoryPlayLimitSec: (v: number | ((prev: number) => number)) => void;
}

const defaultChild: ChildProfile = {
  id: '1',
  name: '小明',
  age: 7,
  avatar: '🦊',
};

const SEEDED_COMPLETED_LEVELS = Array.from({ length: 42 }, (_, i) => i + 1);
const SEEDED_CURRENT_LEVEL = 43;

const AppContext = createContext<AppContextType>({
  isParentAuth: false,
  setIsParentAuth: () => {},
  isDeveloperAuth: false,
  setIsDeveloperAuth: () => {},
  selectedChild: defaultChild,
  setSelectedChild: () => {},
  totalStars: 30,
  setTotalStars: () => {},
  /** 測試用預設：已通過前 42 關，直接從後段章節開始測 */
  completedLevels: SEEDED_COMPLETED_LEVELS,
  setCompletedLevels: () => {},
  collectedLevelIds: SEEDED_COMPLETED_LEVELS,
  setCollectedLevelIds: () => {},
  currentLevel: SEEDED_CURRENT_LEVEL,
  setCurrentLevel: () => {},
  lastGameScore: 0,
  setLastGameScore: () => {},
  distractorLevel: 'medium',
  setDistractorLevel: () => {},
  eyeDistanceLock: true,
  setEyeDistanceLock: () => {},
  toleranceThreshold: 1.5,
  setToleranceThreshold: () => {},
  soundHintEnabled: true,
  setSoundHintEnabled: () => {},
  privacyBlurEnabled: false,
  setPrivacyBlurEnabled: () => {},
  spotSceneRandomEnabled: true,
  setSpotSceneRandomEnabled: () => {},
  spotSceneRandomSeed: 20260505,
  setSpotSceneRandomSeed: () => {},
  spotTimeLimitSec: 40,
  setSpotTimeLimitSec: () => {},
  spotMaxMistakes: 6,
  setSpotMaxMistakes: () => {},
  memoryShowSeconds: 5.5,
  setMemoryShowSeconds: () => {},
  memoryPlayLimitSec: 30,
  setMemoryPlayLimitSec: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isParentAuth, setIsParentAuth] = useState(false);
  const [isDeveloperAuth, setIsDeveloperAuth] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildProfile>(defaultChild);
  const [totalStars, setTotalStars] = useState(30);
  const [completedLevels, setCompletedLevels] = useState<number[]>(SEEDED_COMPLETED_LEVELS);
  const [collectedLevelIds, setCollectedLevelIds] = useState<number[]>(SEEDED_COMPLETED_LEVELS);
  const [currentLevel, setCurrentLevel] = useState(SEEDED_CURRENT_LEVEL);
  const [lastGameScore, setLastGameScore] = useState(0);
  const [distractorLevel, setDistractorLevel] = useState<'off' | 'low' | 'medium' | 'high' | 'extreme'>('medium');
  const [eyeDistanceLock, setEyeDistanceLock] = useState(true);
  const [toleranceThreshold, setToleranceThreshold] = useState(1.5);
  const [soundHintEnabled, setSoundHintEnabled] = useState(true);
  const [privacyBlurEnabled, setPrivacyBlurEnabled] = useState(false);
  const [spotSceneRandomEnabled, setSpotSceneRandomEnabled] = useState(true);
  const [spotSceneRandomSeed, setSpotSceneRandomSeed] = useState(20260505);
  const [spotTimeLimitSec, setSpotTimeLimitSec] = useState(40);
  const [spotMaxMistakes, setSpotMaxMistakes] = useState(6);
  const [memoryShowSeconds, setMemoryShowSeconds] = useState(5.5);
  const [memoryPlayLimitSec, setMemoryPlayLimitSec] = useState(30);

  return (
    <AppContext.Provider value={{
      isParentAuth, setIsParentAuth,
      isDeveloperAuth, setIsDeveloperAuth,
      selectedChild, setSelectedChild,
      totalStars, setTotalStars,
      completedLevels, setCompletedLevels,
      collectedLevelIds, setCollectedLevelIds,
      currentLevel, setCurrentLevel,
      lastGameScore, setLastGameScore,
      distractorLevel, setDistractorLevel,
      eyeDistanceLock, setEyeDistanceLock,
      toleranceThreshold, setToleranceThreshold,
      soundHintEnabled, setSoundHintEnabled,
      privacyBlurEnabled, setPrivacyBlurEnabled,
      spotSceneRandomEnabled, setSpotSceneRandomEnabled,
      spotSceneRandomSeed, setSpotSceneRandomSeed,
      spotTimeLimitSec, setSpotTimeLimitSec,
      spotMaxMistakes, setSpotMaxMistakes,
      memoryShowSeconds, setMemoryShowSeconds,
      memoryPlayLimitSec, setMemoryPlayLimitSec,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
