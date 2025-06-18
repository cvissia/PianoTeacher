import React, { useState, useEffect, useRef } from 'react';

const PianoKeyboard = ({ activeNotes = [], onNoteClick }) => {
  const [scrollPosition, setScrollPosition] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(1); // 0.3 to 2
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const keyboardRef = useRef(null);
  
  // Piano key definitions
  const octavePattern = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Generate all 88 keys
  const generateAllKeys = () => {
    const keys = [];
    
    // A0, A#0, B0
    keys.push({ note: 'A0', midi: 21, isBlack: false });
    keys.push({ note: 'A#0', midi: 22, isBlack: true });
    keys.push({ note: 'B0', midi: 23, isBlack: false });
    
    // Octaves 1-7 (full octaves)
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
    
    // C8
    keys.push({ note: 'C8', midi: 108, isBlack: false });
    
    return keys;
  };
  
  const allKeys = generateAllKeys();
  
  // Helper function to determine if a white key should have a black key after it
  const hasBlackKeyAfter = (noteName) => {
    const note = noteName.replace(/\d+/, ''); // Remove octave number
    return note !== 'E' && note !== 'B';
  };
  
  // Create visual layout
  const createKeyboard = () => {
    const whiteKeys = allKeys.filter(k => !k.isBlack);
    const keyWidth = 30 * zoomLevel;
    const blackKeyWidth = 20 * zoomLevel;
    const blackKeyHeight = 100 * zoomLevel;
    
    return (
      <div className="relative" style={{ height: `${150 * zoomLevel}px` }}>
        {/* White keys layer */}
        <div className="absolute inset-0 flex">
          {whiteKeys.map((key, idx) => {
            const isActive = activeNotes.includes(key.note);
            return (
              <div
                key={key.note}
                onClick={() => onNoteClick(key.note)}
                className={`
                  relative flex-shrink-0 bg-white border border-gray-400 cursor-pointer
                  hover:bg-gray-100 transition-colors duration-75
                  ${isActive ? '!bg-blue-400' : ''}
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
        
        {/* Black keys layer */}
        <div className="absolute inset-0 pointer-events-none">
          {whiteKeys.map((whiteKey, idx) => {
            // Check if this white key should have a black key after it
            if (!hasBlackKeyAfter(whiteKey.note)) return null;
            
            // Find the corresponding black key
            const blackKeyNote = whiteKey.note.replace(/([A-G])(\d+)/, (match, note, octave) => {
              return `${note}#${octave}`;
            });
            
            const isActive = activeNotes.includes(blackKeyNote);
            
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
                    ${isActive ? '!bg-blue-600' : ''}
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
  
  // Handle scroll
  useEffect(() => {
    if (keyboardRef.current) {
      const scrollWidth = keyboardRef.current.scrollWidth - keyboardRef.current.clientWidth;
      keyboardRef.current.scrollLeft = (scrollPosition / 100) * scrollWidth;
    }
  }, [scrollPosition]);
  
  // Auto-scroll to active notes
  useEffect(() => {
    if (activeNotes.length > 0 && keyboardRef.current && autoScrollEnabled) {
      const firstActiveNote = activeNotes[0];
      const whiteKeys = allKeys.filter(k => !k.isBlack);
      const noteIndex = whiteKeys.findIndex(k => k.note === firstActiveNote);
      
      if (noteIndex !== -1) {
        const keyWidth = 30 * zoomLevel;
        const scrollTo = noteIndex * keyWidth - (keyboardRef.current.clientWidth / 2) + (keyWidth / 2);
        keyboardRef.current.scrollLeft = scrollTo;
        
        // Update slider position
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
          {/* Zoom Control */}
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
          
          {/* Navigation Control */}
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
          
          {/* Auto-scroll Toggle */}
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
        <span>Click keys to play • Active notes highlighted in blue</span>
      </div>
    </div>
  );
};

export default PianoKeyboard;