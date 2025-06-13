import React, { useState, useEffect, useRef } from 'react';

const PianoKeyboard = ({ activeNotes = [], onNoteClick }) => {
  const [scrollPosition, setScrollPosition] = useState(50);
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
  
  // Create visual layout
  const createKeyboard = () => {
    const whiteKeys = allKeys.filter(k => !k.isBlack);
    const blackKeys = allKeys.filter(k => k.isBlack);
    
    return (
      <div className="relative" style={{ height: '150px' }}>
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
                style={{ width: '30px', height: '100%' }}
                title={key.note}
              >
                <span className="absolute bottom-1 left-0 right-0 text-[10px] text-center text-gray-600 select-none">
                  {key.note}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Black keys layer */}
        <div className="absolute inset-0 flex pointer-events-none">
          {whiteKeys.map((whiteKey, idx) => {
            // Check if there should be a black key after this white key
            const nextWhiteKey = whiteKeys[idx + 1];
            if (!nextWhiteKey) return null;
            
            // Find black key between current and next white key
            const blackKey = blackKeys.find(bk => 
              bk.midi > whiteKey.midi && bk.midi < nextWhiteKey.midi
            );
            
            if (!blackKey) return null;
            
            const isActive = activeNotes.includes(blackKey.note);
            
            return (
              <div
                key={blackKey.note}
                className="relative flex-shrink-0"
                style={{ width: '30px' }}
              >
                <div
                  onClick={() => onNoteClick(blackKey.note)}
                  className={`
                    absolute bg-gray-900 cursor-pointer pointer-events-auto
                    hover:bg-gray-700 transition-colors duration-75 z-10
                    ${isActive ? '!bg-blue-600' : ''}
                  `}
                  style={{
                    width: '20px',
                    height: '100px',
                    right: '-10px',
                    top: '0'
                  }}
                  title={blackKey.note}
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
    if (activeNotes.length > 0 && keyboardRef.current) {
      const firstActiveNote = activeNotes[0];
      const whiteKeys = allKeys.filter(k => !k.isBlack);
      const noteIndex = whiteKeys.findIndex(k => k.note === firstActiveNote);
      
      if (noteIndex !== -1) {
        const keyWidth = 30;
        const scrollTo = noteIndex * keyWidth - (keyboardRef.current.clientWidth / 2) + (keyWidth / 2);
        keyboardRef.current.scrollLeft = scrollTo;
        
        // Update slider position
        const scrollWidth = keyboardRef.current.scrollWidth - keyboardRef.current.clientWidth;
        setScrollPosition((scrollTo / scrollWidth) * 100);
      }
    }
  }, [activeNotes, allKeys]);
  
  return (
    <div className="mb-8 p-4 bg-gray-100 rounded-lg shadow-inner">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Virtual Piano</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">Navigate:</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono">A0</span>
            <input
              type="range"
              min="0"
              max="100"
              value={scrollPosition}
              onChange={(e) => setScrollPosition(Number(e.target.value))}
              className="w-40"
            />
            <span className="text-xs font-mono">C8</span>
          </div>
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