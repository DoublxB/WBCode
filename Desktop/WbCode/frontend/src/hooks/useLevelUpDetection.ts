import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../api/hooks';

export const useLevelUpDetection = () => {
  const { data: profile } = useProfile();
  const previousLevelRef = useRef(profile?.level || 1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);

  useEffect(() => {
    if (profile?.level && profile.level > previousLevelRef.current) {
      setNewLevel(profile.level);
      setShowLevelUp(true);
      previousLevelRef.current = profile.level;
    }
  }, [profile?.level]);

  const handleCloseLevelUp = () => {
    setShowLevelUp(false);
  };

  return {
    showLevelUp,
    newLevel,
    handleCloseLevelUp
  };
};

