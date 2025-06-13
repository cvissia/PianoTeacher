import React from 'react';

const ProgressBar = ({ current = 0, total = 0, onSeek }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{formatTime(current)}</span>
        <span>{formatTime(total)}</span>
      </div>
      <div 
        className="w-full h-3 bg-gray-300 rounded-full cursor-pointer relative overflow-hidden"
        onClick={(e) => {
          if (!onSeek || total === 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const clickedPercentage = x / rect.width;
          onSeek(clickedPercentage * total);
        }}
      >
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-100"
          style={{ width: `${percentage}%` }}
        />
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;