import React, { useState, useEffect, useRef } from 'react';

const PianoKeyboard = ({ activeNotes = [], onNoteClick }) => {
  const [scrollPosition, setScrollPosition] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(1); // 0.3 to 2
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const keyboardRef = useRef(null);
  
  const octavePattern = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const generateAllKeys = () => {
    const keys = [];
    
    keys.push({ note: 'A0', midi: 21, isBlack: false });
    keys.push({ note: 'A#0', midi: 22, isBlack: true });
    keys.push({ note: 'B0', midi: 23, isBlack: false });
    
    for (let octave = 1; octave <= 7; octave++) {
      octavePattern.forEach((note, idx) => {
        const isBlack = note.includes('#');
        const midiNumber = 24 + (octave - 1) * 12 + idx;
        keys.push({
          note: `${note}${octave}`,
          midi: midiNumber,
          isBlack: isBlack
        });
      });
    }
    
    keys.push({ note: 'C8', midi: 108, isBlack: false });
    
    return keys;
  };
  
  const allKeys = generateAllKeys();
  
  const hasBlackKeyAfter = (noteName) => {
    const note = noteName.replace(/\d+/, '');
    return note !== 'E' && note !== 'B';
  };
  
  const createKeyboard = () => {
    const whiteKeys = allKeys.filter(k => !k.isBlack);
    const keyWidth = 30 * zoomLevel;
    const blackKeyWidth = 20 * zoomLevel;
    const blackKeyHeight = 100 * zoomLevel;
    
    return (
      <div className="relative" style={{ height: `${150 * zoomLevel}px` }}>
        <div className="absolute inset-0 flex">
          {whiteKeys.map((key, idx) => {
            const activeNote = activeNotes.find(n => 
              typeof n === 'string' ? n === key.note : n.name === key.note
            );
            const isActive = !!activeNote;
            const trackIndex = typeof activeNote === 'object' ? activeNote.trackIndex : null;
            return (
              <div
                key={key.note}
                onClick={() => onNoteClick(key.note)}
                className={`
                  relative flex-shrink-0 bg-white border border-gray-400 cursor-pointer
                  hover:bg-gray-100 transition-colors duration-75
                  ${isActive ? (trackIndex === 0 ? '!bg-blue-400' : trackIndex === 1 ? '!bg-green-400' : '!bg-blue-400') : ''}
                `}
                style={{ width: `${keyWidth}px`, height: '100%' }}
                title={key.note}
              >
                <span 
                  className="absolute bottom-1 left-0 right-0 text-center text-gray-600 select-none"
                  style={{ fontSize: `${10 * Math.min(zoomLevel, 1.2)}px` }}
                >
                  {key.note}
                </span>
              </div>
            );
          })}
        </div>
        <div className="absolute inset-0 pointer-events-none">
          {whiteKeys.map((whiteKey, idx) => {
            if (!hasBlackKeyAfter(whiteKey.note)) return null;
            
            const blackKeyNote = whiteKey.note.replace(/([A-G])(\d+)/, (_, note, octave) => {
              return `${note}#${octave}`;
            });
            
            const activeNote = activeNotes.find(n => 
              typeof n === 'string' ? n === blackKeyNote : n.name === blackKeyNote
            );
            const isActive = !!activeNote;
            const trackIndex = typeof activeNote === 'object' ? activeNote.trackIndex : null;
            
            return (
              <div
                key={`black-${idx}`}
                className="absolute pointer-events-auto"
                style={{
                  left: `${(idx + 1) * keyWidth - blackKeyWidth / 2}px`,
                  width: `${blackKeyWidth}px`,
                  height: `${blackKeyHeight}px`,
                  top: '0'
                }}
              >
                <div
                  onClick={() => onNoteClick(blackKeyNote)}
                  className={`
                    w-full h-full bg-gray-900 cursor-pointer
                    hover:bg-gray-700 transition-colors duration-75 z-10
                    ${isActive ? (trackIndex === 0 ? '!bg-blue-600' : trackIndex === 1 ? '!bg-green-600' : '!bg-blue-600') : ''}
                  `}
                  title={blackKeyNote}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  useEffect(() => {
    if (keyboardRef.current) {
      const scrollWidth = keyboardRef.current.scrollWidth - keyboardRef.current.clientWidth;
      keyboardRef.current.scrollLeft = (scrollPosition / 100) * scrollWidth;
    }
  }, [scrollPosition]);
  
  useEffect(() => {
    if (activeNotes.length > 0 && keyboardRef.current && autoScrollEnabled) {
      const firstActiveNote = typeof activeNotes[0] === 'string' ? activeNotes[0] : activeNotes[0].name;
      const whiteKeys = allKeys.filter(k => !k.isBlack);
      const noteIndex = whiteKeys.findIndex(k => k.note === firstActiveNote);
      
      if (noteIndex !== -1) {
        const keyWidth = 30 * zoomLevel;
        const scrollTo = noteIndex * keyWidth - (keyboardRef.current.clientWidth / 2) + (keyWidth / 2);
        keyboardRef.current.scrollLeft = scrollTo;
        
        const scrollWidth = keyboardRef.current.scrollWidth - keyboardRef.current.clientWidth;
        setScrollPosition((scrollTo / scrollWidth) * 100);
      }
    }
  }, [activeNotes, allKeys, zoomLevel, autoScrollEnabled]);
  
  return (
    <div className="mb-8 p-4 bg-gray-100 rounded-lg shadow-inner">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Virtual Piano</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Zoom:</span>
            <input
              type="range"
              min="0.3"
              max="2"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-xs font-mono w-12">{Math.round(zoomLevel * 100)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Navigate:</span>
            <span className="text-xs font-mono">A0</span>
            <input
              type="range"
              min="0"
              max="100"
              value={scrollPosition}
              onChange={(e) => setScrollPosition(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-xs font-mono">C8</span>
          </div>
          
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScrollEnabled}
              onChange={(e) => setAutoScrollEnabled(e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-xs text-gray-600">Auto-scroll</span>
          </label>
        </div>
      </div>
      
      <div 
        ref={keyboardRef}
        className="overflow-x-auto overflow-y-hidden bg-gray-800 p-2 rounded-lg"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{ width: 'max-content', padding: '10px 0' }}>
          {createKeyboard()}
        </div>
      </div>
      
      <div className="mt-2 flex justify-between text-xs text-gray-600">
        <span>🎹 88 Keys (A0 - C8)</span>
        <span>Click keys to play • Left hand: green, Right hand: blue</span>
      </div>
    </div>
  );
};

export default PianoKeyboard;