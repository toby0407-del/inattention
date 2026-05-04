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
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
