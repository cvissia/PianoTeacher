import React from 'react';
import { BarChart, Clock, Music, TrendingUp } from 'lucide-react';
import StorageService from '../services/storageService';

const ProgressDashboard = ({ isVisible, onClose }) => {
  const stats = StorageService.getPracticeStats();
  const recentFiles = StorageService.getRecentFiles();
  
  const calculateStreak = () => {
    const daily = stats.daily;
    const dates = Object.keys(daily).sort().reverse();
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]);
      const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  if (!isVisible) return null;