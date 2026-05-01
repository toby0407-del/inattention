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
}

const defaultChild: ChildProfile = {
  id: '1',
  name: '小明',
  age: 7,
  avatar: '🦊',
};

const AppContext = createContext<AppContextType>({
  isParentAuth: false,
  setIsParentAuth: () => {},
  isDeveloperAuth: false,
  setIsDeveloperAuth: () => {},
  selectedChild: defaultChild,
  setSelectedChild: () => {},
  totalStars: 12,
  setTotalStars: () => {},
  completedLevels: [1],
  setCompletedLevels: () => {},
  collectedLevelIds: [1],
  setCollectedLevelIds: () => {},
  currentLevel: 2,
  setCurrentLevel: () => {},
  lastGameScore: 0,
  setLastGameScore: () => {},
  distractorLevel: 'medium',
  setDistractorLevel: () => {},
  eyeDistanceLock: true,
  setEyeDistanceLock: () => {},
  toleranceThreshold: 1.5,
  setToleranceThreshold: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isParentAuth, setIsParentAuth] = useState(false);
  const [isDeveloperAuth, setIsDeveloperAuth] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildProfile>(defaultChild);
  const [totalStars, setTotalStars] = useState(12);
  const [completedLevels, setCompletedLevels] = useState<number[]>([1]);
  const [collectedLevelIds, setCollectedLevelIds] = useState<number[]>([1]);
  const [currentLevel, setCurrentLevel] = useState(2);
  const [lastGameScore, setLastGameScore] = useState(0);
  const [distractorLevel, setDistractorLevel] = useState<'off' | 'low' | 'medium' | 'high' | 'extreme'>('medium');
  const [eyeDistanceLock, setEyeDistanceLock] = useState(true);
  const [toleranceThreshold, setToleranceThreshold] = useState(1.5);

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
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
