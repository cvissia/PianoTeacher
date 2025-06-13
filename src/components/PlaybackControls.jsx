import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, SkipBack } from 'lucide-react';

const PlaybackControls = ({ 
  isPlaying, 
  onTogglePlay, 
  onStop, 
  onPrevious, 
  onNext,
  canGoPrevious,
  canGoNext 
}) => {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <button
        onClick={onPrevious}
        className="p-3 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        disabled={!canGoPrevious}
      >
        <SkipBack className="w-5 h-5" />
      </button>
      
      <button
        onClick={onTogglePlay}
        className="p-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
      >
        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </button>
      
      <button
        onClick={onStop}
        className="p-3 rounded-lg bg-gray-200 hover:bg-gray-300"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
      
      <button
        onClick={onNext}
        className="p-3 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        disabled={!canGoNext}
      >
        <SkipForward className="w-5 h-5" />
      </button>
    </div>
  );
};

export default PlaybackControls;