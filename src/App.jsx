import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { Settings, Upload, Volume2, Hand, Save, Download, BarChart } from 'lucide-react';
import PianoKeyboard from './components/PianoKeyboard';
import SectionSelector from './components/SectionSelector';
import ProgressBar from './components/ProgressBar';
import PlaybackControls from './components/PlaybackControls';
import StorageService from './services/storageService';
import { usePreferences, useSongProgress, usePracticeStats } from './hooks/useLocalStorage';

function App() {
  const [midiData, setMidiData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeNotes, setActiveNotes] = useState([]);
  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [sectionProgress, setSectionProgress] = useState({});
  const [trackInfo, setTrackInfo] = useState([]);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [showStats, setShowStats] = useState(false);
  
  // localStorage hooks
  const [preferences, updatePreferences] = usePreferences();
  const [songProgress, updateSongProgress] = useSongProgress(currentSongId);
  const [practiceStats, recordSession] = usePracticeStats();
  
  // Initialize state from preferences
  const [barsPerSection, setBarsPerSection] = useState(preferences.barsPerSection || 4);
  const [playbackRate, setPlaybackRate] = useState(preferences.playbackRate || 1);
  const [isLooping, setIsLooping] = useState(preferences.isLooping ?? true);
  const [volume, setVolume] = useState(preferences.volume || 75);
  const [selectedHand, setSelectedHand] = useState(preferences.selectedHand || 'both');
  
  const synthRef = useRef(null);
  const transportRef = useRef(null);
  const scheduledEventsRef = useRef([]);
  const fileInputRef = useRef(null);
  const originalMidiRef = useRef(null);
  
  // Session tracking for stats
  const sessionStartTime = useRef(null);
  const notesPlayedCount = useRef(0);
  const practiceTime = useRef(0);
  
  // Initialize Tone.js
  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    synthRef.current.volume.value = -12;
    
    // Start session tracking
    sessionStartTime.current = Date.now();
    
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
      
      // Save session stats on unmount
      if (practiceTime.current > 0) {
        recordSession({
          duration: practiceTime.current / 60, // Convert to minutes
          sectionsCompleted: Object.keys(sectionProgress).length,
          notesPlayed: notesPlayedCount.current
        });
      }
    };
  }, []);
  
  // Save preferences when they change
  useEffect(() => {
    updatePreferences({
      playbackRate,
      volume,
      selectedHand,
      barsPerSection,
      isLooping
    });
  }, [playbackRate, volume, selectedHand, barsPerSection, isLooping]);
  
  // Update volume
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = -30 + (volume / 100) * 30;
    }
  }, [volume]);
  
  // Save song progress when it changes
  useEffect(() => {
    if (currentSongId && sections.length > 0) {
      updateSongProgress({
        currentSection,
        completedSections: sectionProgress,
        totalSections: sections.length,
        completionPercentage: Math.round((Object.keys(sectionProgress).length / sections.length) * 100) || 0,
        lastPlayed: Date.now()
      });
    }
  }, [currentSection, sectionProgress, sections.length, currentSongId]);
  
  // Track practice time
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        practiceTime.current += 1; // Add 1 second
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  // Parse MIDI file
  const parseMidiFile = async (file) => {
    try {
      console.log('Starting to parse file:', file.name);
      const arrayBuffer = await file.arrayBuffer();
      console.log('File loaded, size:', arrayBuffer.byteLength);
      
      const midi = new Midi(arrayBuffer);
      originalMidiRef.current = midi;
      
      console.log('MIDI parsed:', midi);
      console.log('Number of tracks:', midi.tracks.length);
      console.log('Duration:', midi.duration);
      
      // Generate unique ID for the song
      const songId = `${file.name}_${file.size}_${file.lastModified}`;
      setCurrentSongId(songId);
      setCurrentFileName(file.name);
      
      // Add to recent files
      StorageService.addRecentFile({
        name: file.name,
        size: file.size,
        duration: midi.duration,
        tracks: midi.tracks.length,
        songId: songId
      });
      
      // Check if MIDI has tracks and notes
      if (!midi.tracks || midi.tracks.length === 0) {
        alert('MIDI file has no tracks');
        return;
      }
      
      // Analyze tracks
      const tracks = [];
      midi.tracks.forEach((track, trackIndex) => {
        if (track.notes.length > 0) {
          const avgPitch = track.notes.reduce((sum, note) => sum + note.midi, 0) / track.notes.length;
          const handGuess = avgPitch < 60 ? 'left' : 'right';
          
          tracks.push({
            index: trackIndex,
            name: track.name || `Track ${trackIndex}`,
            noteCount: track.notes.length,
            handGuess: handGuess,
            avgPitch: avgPitch
          });
        }
      });
      
      setTrackInfo(tracks);
      console.log('Track analysis:', tracks);
      
      // Load existing progress if available
      const existingProgress = StorageService.getSongProgress(songId);
      if (existingProgress) {
        setCurrentSection(existingProgress.currentSection || 0);
        setSectionProgress(existingProgress.completedSections || {});
      } else {
        setCurrentSection(0);
        setSectionProgress({});
      }
      
      // Process all tracks initially
      processTracksIntoSections(midi, selectedHand);
      
    } catch (error) {
      console.error('Detailed error parsing MIDI file:', error);
      console.error('Error stack:', error.stack);
      alert('Error parsing MIDI file. Please check the browser console for details and try a different file.');
    }
  };
  
  // Process tracks based on hand selection
  const processTracksIntoSections = (midi, handSelection) => {
    const allNotes = [];
    
    midi.tracks.forEach((track, trackIndex) => {
      if (handSelection === 'both' || 
          (handSelection === 'left' && trackIndex === 0) ||
          (handSelection === 'right' && trackIndex === 1)) {
        
        track.notes.forEach(note => {
          allNotes.push({
            time: note.time,
            duration: note.duration,
            name: note.name,
            velocity: note.velocity,
            trackIndex: trackIndex
          });
        });
      }
    });
    
    console.log(`Processing ${handSelection} hand(s): ${allNotes.length} notes`);
    
    if (allNotes.length === 0) {
      alert('No notes found for selected hand(s)');
      return;
    }
    
    allNotes.sort((a, b) => a.time - b.time);
    
    const tempo = midi.header.tempos?.[0]?.bpm || 120;
    const timeSignature = midi.header.timeSignatures?.[0] || { beats: 4, beatType: 4 };
    const beats = timeSignature.beats || 4;
    
    const timePerBar = (60 / tempo) * beats;
    const totalBars = Math.ceil(midi.duration / timePerBar);
    const sectionCount = Math.ceil(totalBars / barsPerSection);
    
    const newSections = [];
    for (let i = 0; i < sectionCount; i++) {
      const startTime = i * barsPerSection * timePerBar;
      const endTime = Math.min((i + 1) * barsPerSection * timePerBar, midi.duration);
      
      const sectionNotes = allNotes.filter(note => 
        note.time >= startTime && note.time < endTime
      );
      
      newSections.push({
        start: startTime,
        end: endTime,
        notes: sectionNotes
      });
    }
    
    setMidiData({
      notes: allNotes,
      duration: midi.duration,
      tempo: tempo
    });
    
    setSections(newSections);
    setDuration(midi.duration);
  };
  
  // Handle hand selection change
  const handleHandChange = (hand) => {
    setSelectedHand(hand);
    if (originalMidiRef.current) {
      stopPlayback();
      processTracksIntoSections(originalMidiRef.current, hand);
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'audio/midi' || file.type === 'audio/mid' || file.name.endsWith('.mid') || file.name.endsWith('.midi'))) {
      parseMidiFile(file);
    } else if (file) {
      alert('Please upload a valid MIDI file (.mid or .midi)');
    }
  };
  
  // Play current section
  const playSection = useCallback(() => {
    if (!sections[currentSection] || !synthRef.current) return;
    
    const section = sections[currentSection];
    Tone.Transport.cancel();
    
    section.notes.forEach(note => {
      const relativeTime = note.time - section.start;
      
      Tone.Transport.schedule((time) => {
        synthRef.current.triggerAttackRelease(note.name, note.duration, time, note.velocity);
        
        Tone.Draw.schedule(() => {
          setActiveNotes(prev => [...prev, note.name]);
          setTimeout(() => {
            setActiveNotes(prev => prev.filter(n => n !== note.name));
          }, note.duration * 1000);
        }, time);
      }, relativeTime);
    });
    
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = section.end - section.start;
    Tone.Transport.loop = isLooping;
    
    Tone.Transport.bpm.value = 120 * playbackRate;
    
    Tone.Transport.position = 0;
    Tone.Transport.start();
    setIsPlaying(true);
  }, [currentSection, sections, isLooping, playbackRate]);
  
  // Stop playback
  const stopPlayback = () => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    setIsPlaying(false);
    setActiveNotes([]);
    setCurrentTime(0);
  };
  
  // Toggle play/pause
  const togglePlayback = async () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      await Tone.start();
      playSection();
    }
  };
  
  // Handle section change
  const changeSection = (idx) => {
    stopPlayback();
    setCurrentSection(idx);
    setCurrentTime(0);
  };
  
  // Navigation controls
  const previousSection = () => {
    if (currentSection > 0) {
      changeSection(currentSection - 1);
    }
  };
  
  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setSectionProgress(prev => ({
        ...prev,
        [currentSection]: 100
      }));
      changeSection(currentSection + 1);
    }
  };
  
  // Update current time
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const position = Tone.Transport.position;
        const positionInSeconds = Tone.Time(position).toSeconds();
        setCurrentTime(positionInSeconds);
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying]);
  
  // Play note when clicked
  const handleNoteClick = (note) => {
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease(note, '8n');
      notesPlayedCount.current += 1; // Track notes played
    }
  };
  
  // Export/Import data functions
  const exportData = () => {
    const data = StorageService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piano-teacher-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const importData = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (StorageService.importData(data)) {
            alert('Data imported successfully! The page will reload.');
            window.location.reload();
          } else {
            alert('Failed to import data.');
          }
        } catch (error) {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    }
  };
  
  // Recent files component
  const RecentFiles = () => {
    const recentFiles = StorageService.getRecentFiles();
    if (recentFiles.length === 0) return null;
    
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Recent Files</h3>
        <div className="space-y-2">
          {recentFiles.slice(0, 5).map((file, idx) => (
            <button
              key={idx}
              className="w-full text-left p-2 hover:bg-gray-100 rounded flex justify-between items-center"
              onClick={() => {
                // You'd need to store and retrieve the actual file data
                // For now, just show the info
                alert(`Would load: ${file.name}`);
              }}
            >
              <span className="truncate">{file.name}</span>
              <span className="text-sm text-gray-500">
                {new Date(file.lastOpened).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Piano Teacher</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            title="View Statistics"
          >
            <BarChart className="w-5 h-5" />
            Stats
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            title="Export Progress"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
          <label className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 cursor-pointer"
                 title="Import Progress">
            <Upload className="w-5 h-5" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      {/* Statistics Dashboard */}
      {showStats && (
        <div className="mb-8 p-6 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Practice Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {Math.round(practiceStats.total.minutesPracticed)} min
              </div>
              <div className="text-sm text-gray-600">Total Practice Time</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {practiceStats.total.sectionsCompleted}
              </div>
              <div className="text-sm text-gray-600">Sections Mastered</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-500">
                {practiceStats.total.sessionsCompleted}
              </div>
              <div className="text-sm text-gray-600">Practice Sessions</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Files */}
      {!midiData && <RecentFiles />}
      
      {/* File Upload */}
      {!midiData && (
        <div className="mb-8 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <input
            ref={fileInputRef}
            type="file"
            accept=".mid,.midi"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Upload MIDI File
          </button>
          <p className="mt-2 text-sm text-gray-500">
            Accepts .mid and .midi files
          </p>
        </div>
      )}
      
      {midiData && (
        <>
          {/* Current File Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
            <span className="font-medium">Now Playing: {currentFileName}</span>
            <button
              onClick={() => {
                if (confirm('Load a new file? Current progress will be saved.')) {
                  setMidiData(null);
                  setCurrentSongId(null);
                  stopPlayback();
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Change File
            </button>
          </div>
          
          {/* Hand Selection */}
          {trackInfo.length > 1 && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                <Hand className="w-5 h-5" />
                Hand Selection
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleHandChange('both')}
                  className={`px-4 py-2 rounded ${
                    selectedHand === 'both' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Both Hands
                </button>
                <button
                  onClick={() => handleHandChange('left')}
                  className={`px-4 py-2 rounded ${
                    selectedHand === 'left' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Right Hand (Track 1)
                </button>
                <button
                  onClick={() => handleHandChange('right')}
                  className={`px-4 py-2 rounded ${
                    selectedHand === 'right' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Left Hand (Track 0)
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Track 0: {trackInfo[0]?.noteCount || 0} notes | 
                Track 1: {trackInfo[1]?.noteCount || 0} notes
              </p>
            </div>
          )}
          
          {/* Section Selector */}
          <SectionSelector
            sections={sections}
            currentSection={currentSection}
            onSectionChange={changeSection}
            sectionProgress={sectionProgress}
          />
          
          {/* Progress Bar */}
          <ProgressBar
            current={currentTime}
            total={sections[currentSection]?.end - sections[currentSection]?.start || 0}
            onSeek={(time) => {
              Tone.Transport.position = time;
              setCurrentTime(time);
            }}
          />
          
          {/* Playback Controls */}
          <PlaybackControls
            isPlaying={isPlaying}
            onTogglePlay={togglePlayback}
            onStop={stopPlayback}
            onPrevious={previousSection}
            onNext={nextSection}
            canGoPrevious={currentSection > 0}
            canGoNext={currentSection < sections.length - 1}
          />
          
          {/* Settings Panel */}
          <div className="mb-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Settings className="w-5 h-5" />
              Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bars per Section: {barsPerSection}
                </label>
                <input
                  type="range"
                  min="1"
                  max="16"
                  value={barsPerSection}
                  onChange={(e) => {
                    setBarsPerSection(Number(e.target.value));
                    if (originalMidiRef.current) {
                      processTracksIntoSections(originalMidiRef.current, selectedHand);
                    }
                  }}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Playback Speed: {Math.round(playbackRate * 100)}%
                </label>
                <input
                  type="range"
                  min="0.25"
                  max="1.5"
                  step="0.05"
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Volume2 className="w-4 h-4" />
                  Volume: {volume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isLooping}
                  onChange={(e) => setIsLooping(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Loop Section</span>
              </label>
            </div>
          </div>
          
          {/* Virtual Piano */}
          <PianoKeyboard 
            activeNotes={activeNotes}
            onNoteClick={handleNoteClick}
          />
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {currentSection + 1} / {sections.length}
              </div>
              <div className="text-sm text-gray-600">Current Section</div>
            </div>
            
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {Object.keys(sectionProgress).length}
              </div>
              <div className="text-sm text-gray-600">Sections Completed</div>
            </div>
            
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-500">
                {Math.round((Object.keys(sectionProgress).length / sections.length) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">Total Progress</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;