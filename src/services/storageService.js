const STORAGE_PREFIX = 'pianoTeacher_';

const KEYS = {
  USER_PREFERENCES: `${STORAGE_PREFIX}preferences`,
  SONG_PROGRESS: `${STORAGE_PREFIX}songProgress`,
  PRACTICE_STATS: `${STORAGE_PREFIX}practiceStats`,
  RECENT_FILES: `${STORAGE_PREFIX}recentFiles`,
  SETTINGS: `${STORAGE_PREFIX}settings`
};

class StorageService {
  static setItem(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  static getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  static isAvailable() {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  static savePreferences(preferences) {
    return this.setItem(KEYS.USER_PREFERENCES, {
      ...this.getPreferences(),
      ...preferences,
      lastUpdated: Date.now()
    });
  }

  static getPreferences() {
    return this.getItem(KEYS.USER_PREFERENCES, {
      playbackRate: 1,
      volume: 75,
      selectedHand: 'both',
      barsPerSection: 4,
      isLooping: false,
      theme: 'light'
    });
  }

  static saveSongProgress(songId, progress) {
    const allProgress = this.getSongProgress();
    allProgress[songId] = {
      ...progress,
      lastPlayed: Date.now()
    };
    return this.setItem(KEYS.SONG_PROGRESS, allProgress);
  }

  static getSongProgress(songId = null) {
    const allProgress = this.getItem(KEYS.SONG_PROGRESS, {});
    return songId ? allProgress[songId] || null : allProgress;
  }

  static updatePracticeStats(sessionData) {
    const stats = this.getPracticeStats();
    const today = new Date().toISOString().split('T')[0];
    
    if (!stats.daily[today]) {
      stats.daily[today] = {
        minutesPracticed: 0,
        sectionsCompleted: 0,
        notesPlayed: 0
      };
    }
    
    stats.daily[today].minutesPracticed += sessionData.duration || 0;
    stats.daily[today].sectionsCompleted += sessionData.sectionsCompleted || 0;
    stats.daily[today].notesPlayed += sessionData.notesPlayed || 0;
    
    stats.total.minutesPracticed += sessionData.duration || 0;
    stats.total.sectionsCompleted += sessionData.sectionsCompleted || 0;
    stats.total.sessionsCompleted += 1;
    
    stats.lastSession = Date.now();
    
    return this.setItem(KEYS.PRACTICE_STATS, stats);
  }

  static getPracticeStats() {
    return this.getItem(KEYS.PRACTICE_STATS, {
      daily: {},
      total: {
        minutesPracticed: 0,
        sectionsCompleted: 0,
        sessionsCompleted: 0
      },
      lastSession: null
    });
  }

  static addRecentFile(fileInfo) {
    const recentFiles = this.getRecentFiles();
    
    const filtered = recentFiles.filter(f => f.name !== fileInfo.name);
    
    filtered.unshift({
      ...fileInfo,
      lastOpened: Date.now()
    });
    
    const trimmed = filtered.slice(0, 10);
    
    return this.setItem(KEYS.RECENT_FILES, trimmed);
  }

  static getRecentFiles() {
    return this.getItem(KEYS.RECENT_FILES, []);
  }

  static clearAllData() {
    Object.values(KEYS).forEach(key => {
      this.removeItem(key);
    });
  }

  static exportData() {
    const data = {};
    Object.entries(KEYS).forEach(([name, key]) => {
      data[name] = this.getItem(key);
    });
    return data;
  }

  static importData(data) {
    try {
      Object.entries(KEYS).forEach(([name, key]) => {
        if (data[name]) {
          this.setItem(key, data[name]);
        }
      });
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export default StorageService;
