import { useState, useEffect } from 'react';
import StorageService from '../services/storageService';

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    return StorageService.getItem(key, defaultValue);
  });

  useEffect(() => {
    StorageService.setItem(key, value);
  }, [key, value]);

  return [value, setValue];
}

export function usePreferences() {
  const [preferences, setPreferences] = useState(() => 
    StorageService.getPreferences()
  );

  const updatePreferences = (updates) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    StorageService.savePreferences(newPreferences);
  };

  return [preferences, updatePreferences];
}

export function useSongProgress(songId) {
  const [progress, setProgress] = useState(() => 
    StorageService.getSongProgress(songId) || {
      completedSections: {},
      currentSection: 0,
      totalPlayTime: 0,
      completionPercentage: 0
    }
  );

  const updateProgress = (updates) => {
    const newProgress = { ...progress, ...updates };
    setProgress(newProgress);
    if (songId) {
      StorageService.saveSongProgress(songId, newProgress);
    }
  };

  return [progress, updateProgress];
}

export function usePracticeStats() {
  const [stats, setStats] = useState(() => 
    StorageService.getPracticeStats()
  );

  const recordSession = (sessionData) => {
    StorageService.updatePracticeStats(sessionData);
    setStats(StorageService.getPracticeStats());
  };

  return [stats, recordSession];
}