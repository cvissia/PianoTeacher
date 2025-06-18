// src/hooks/useLocalStorage.js

import { useState, useEffect } from 'react';
import StorageService from '../services/storageService';

// Custom hook for localStorage with React state sync
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    return StorageService.getItem(key, defaultValue);
  });

  useEffect(() => {
    StorageService.setItem(key, value);
  }, [key, value]);

  return [value, setValue];
}

// Hook for user preferences
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

// Hook for song progress
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

// Hook for practice statistics
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