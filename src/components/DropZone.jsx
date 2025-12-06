/**
 * DropZone - Lyrics collection area with integrated playback
 * Words animate in place when playing
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { audioService } from '../services/audioService';
import { elevenLabsService } from '../services/elevenLabsService';
import { syllableService } from '../services/syllableService';
import { stepSequencer } from '../services/stepSequencer';
import { magentaService } from '../services/magentaService';
import { melodyService, SYNONYM_SEED, ANTONYM_SEED } from '../services/melodyService';
import * as patternService from '../services/patternService';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PHASES = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  PLAYING: 'playing',
  CELEBRATION: 'celebration',
};

const LOOP_PHASES = {
  LISTEN: 'LISTEN',      // Loop 1: Voice + beats
  YOUR_TURN: 'YOUR_TURN', // Loop 2: Beats only, children repeat
};

// Instrument palettes for variety (hip-hop style)
const INSTRUMENT_PALETTES = [
  { strong: 'kick', accent: 'snare', light: 'hihatClosed' },
  { strong: 'kick', accent: 'cowbell', light: 'hihatClosed' },
  { strong: 'tomLow', accent: 'snare', light: 'hihatOpen' },
  { strong: 'kick', accent: 'woodblock', light: 'tambourine' },
  { strong: 'bongo', accent: 'snare', light: 'hihatClosed' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DropZone({
  droppedWords = [],
  onSing,
  onStopSing,
  isPlaying = false,
  modelsReady = false,
  backgroundGroove = null,
  onPlaybackComplete,
  onPlaybackStatusChange, // New prop to notify parent of detailed status
  onMusicDurationCalculated, // Callback to report total music duration
  onWordActive // Callback when a specific word starts playing
}) {
  // Playback state
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [sessionPhase, setSessionPhase] = useState(null);
  const [loopCount, setLoopCount] = useState(0);
  const [currentSyllableIndex, setCurrentSyllableIndex] = useState(-1);
  const [preparedWords, setPreparedWords] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Config
  const TEMPO = 120;
  // Simple 2-loop structure per word:
  // Loop 1: LISTEN (voice + beats)
  // Loop 2: YOUR_TURN (beats only, children repeat)

  // Refs
  const isPlayingRef = useRef(false);
  const playbackRef = useRef(null);
  const scheduledIdsRef = useRef([]);

  // ───────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ───────────────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    isPlayingRef.current = false;

    // Stop step sequencer (background beat)
    stepSequencer.stop();

    // Clear Tone.js scheduled events
    scheduledIdsRef.current.forEach(id => {
      Tone.Transport.clear(id);
    });
    scheduledIdsRef.current = [];

    audioService.stopContinuousPlayback();

    if (playbackRef.current) {
      clearTimeout(playbackRef.current);
      playbackRef.current = null;
    }

    setPhase(PHASES.IDLE);
    setCurrentWordIndex(-1);
    setSessionPhase(null);
    setCurrentSyllableIndex(-1);
    setLoopCount(0);
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // ───────────────────────────────────────────────────────────────────────────
  // Watch for external play trigger
  // ───────────────────────────────────────────────────────────────────────────

  // Notify parent of phase changes
  useEffect(() => {
    if (onPlaybackStatusChange) {
      // Only consider "playing" when actually in the PLAYING phase, not PREPARING
      onPlaybackStatusChange(phase === PHASES.PLAYING);
    }
  }, [phase, onPlaybackStatusChange]);

  useEffect(() => {
    if (isPlaying && phase === PHASES.IDLE) {
      // If already prepared, play immediately.
      // If still processing, wait for it (this logic can be improved)
      if (preparedWords.length === droppedWords.length && !isProcessing) {
        startPlayback(preparedWords);
      } else {
        // Wait or show warning? 
        // For now, let's assume the button is disabled if not ready
        // But if isPlaying comes from parent without button click...
        console.log("Waiting for preparation to finish...");
      }
    } else if (!isPlaying && phase !== PHASES.IDLE) {
      cleanup();
    }
  }, [isPlaying, preparedWords, isProcessing, droppedWords]);

  // ───────────────────────────────────────────────────────────────────────────
  // Background Preparation Pipeline
  // ───────────────────────────────────────────────────────────────────────────

  // Whenever droppedWords changes, prepare any new words in the background!
  useEffect(() => {
    if (droppedWords.length === 0) {
      setPreparedWords([]);
      return;
    }

    const prepareNewWords = async () => {
      // Filter words that are already prepared to avoid re-work
      const existingMap = new Map(preparedWords.map(w => [w.word, w]));
      const wordsToProcess = droppedWords.filter(w => !existingMap.has(w.text));

      if (wordsToProcess.length === 0) return;

      setIsProcessing(true);
      setLoadingMessage('Optimizing audio...'); // Less intrusive message

      try {
        const newPrepared = [...preparedWords];

        for (const wObj of wordsToProcess) {
          const word = wObj.text;
          const index = droppedWords.findIndex(dw => dw.text === word);

          // Step 1: Pre-generate voice audio (Text-to-Speech)
          const ttsData = await elevenLabsService.speak(word);

          // Step 2: Analyze audio for precise syllable timing
          const syllableData = syllableService.extractSyllableTimestamps(
            word,
            ttsData.charStartTimes || [],
            ttsData.characters || []
          );

          // Step 3: Generate AI-powered drum patterns
          let syllableDrumPattern = [];
          try {
            if (magentaService.isReady()) {
              const noteSeq = await magentaService.generateDrumPattern(
                syllableData.syllableTimestamps, 
                syllableData.stress, 
                TEMPO
              );
              syllableDrumPattern = magentaService.noteSequenceToToneEvents(noteSeq);
            }
          } catch (e) {
            console.warn('GrooVAE beat generation failed, using fallback', e);
          }

          if (!syllableDrumPattern || syllableDrumPattern.length === 0) {
             syllableDrumPattern = generateSyllableDrumPattern(syllableData, word);
          }

          // Step 4: Generate melody pattern
          let melody = null;
          let kidsMelody = null;

          try {
            if (magentaService.isReady()) {
              melody = await magentaService.generateMelody(1.0);
              
              if (melody) {
                  kidsMelody = { ...melody, notes: [] };
                  melody.notes.forEach(n => {
                      const duration = n.quantizedEndStep - n.quantizedStartStep;
                      const isLong = duration >= 2; 
                      
                      if (isLong) {
                          kidsMelody.notes.push({
                              ...n,
                              pitch: n.pitch + 12,
                              quantizedEndStep: n.quantizedStartStep + 1,
                              velocity: 120
                          });
                          kidsMelody.notes.push({
                              ...n,
                              pitch: n.pitch + 12 + 7, 
                              quantizedStartStep: n.quantizedStartStep + 1,
                              quantizedEndStep: n.quantizedEndStep,
                              velocity: 100
                          });
                      } else {
                          kidsMelody.notes.push({
                              ...n,
                              pitch: n.pitch + 12,
                              velocity: 115
                          });
                      }
                  });
              }
            }
          } catch (e) {
            console.warn('Magenta melody failed, using fallback', e);
          }

          if (!melody) {
             const seed = index % 2 === 0 ? SYNONYM_SEED : ANTONYM_SEED;
             melody = melodyService.fallbackMelodyGeneration(1.1, seed, TEMPO);
             kidsMelody = {
                 ...melody,
                 notes: melody.notes.map(n => ({ ...n, pitch: n.pitch + 12 }))
             };
          }

          // Step 5: Calculate timing
          const wordDuration = ttsData.duration || 1.5;
          const beatsPerSecond = TEMPO / 60;
          const wordBeats = Math.ceil(wordDuration * beatsPerSecond);
          const loopBeats = wordBeats + 1;
          const loopDuration = loopBeats / beatsPerSecond;

          newPrepared.push({
            word,
            ttsData,
            syllableData,
            syllableDrumPattern,
            melody,
            kidsMelody,
            wordDuration,
            loopDuration,
          });
        }

        // Re-order to match droppedWords order
        const orderedPrepared = droppedWords.map(dw => 
          newPrepared.find(p => p.word === dw.text)
        ).filter(Boolean);

        setPreparedWords(orderedPrepared);

      } catch (error) {
        console.error('Background preparation error:', error);
      } finally {
        setIsProcessing(false);
        setLoadingMessage('');
      }
    };

    prepareNewWords();
  }, [droppedWords]);

  // ───────────────────────────────────────────────────────────────────────────
  // Instrument selection & Helpers
  // ───────────────────────────────────────────────────────────────────────────

  const getInstrumentPalette = (word) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = word.charCodeAt(i) + ((hash << 5) - hash);
    }
    return INSTRUMENT_PALETTES[Math.abs(hash) % INSTRUMENT_PALETTES.length];
  };

  const generateSyllableDrumPattern = (syllableData, word) => {
    const palette = getInstrumentPalette(word);
    const events = [];

    syllableData.syllableTimestamps.forEach((time, index) => {
      let instrument = palette.light;
      let velocity = 0.7;

      if (index === 0) {
        instrument = palette.strong;
        velocity = 1.0;
      } else if (syllableData.stress && syllableData.stress[index] === 1) {
        instrument = palette.accent;
        velocity = 0.9;
      }

      events.push({
        time: Math.max(0, time),
        drum: instrument,
        velocity: velocity,
      });
    });

    return events;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Start playback - Play ALL words as a song/phrase
  // ───────────────────────────────────────────────────────────────────────────

  const startPlayback = async (prepared) => {
    if (prepared.length === 0) return;

    // Ensure audio context is running (user gesture required for resume)
    await audioService.initialize();

    setPhase(PHASES.PLAYING);
    isPlayingRef.current = true;

    // Initialize step sequencer
    await stepSequencer.initialize();
    stepSequencer.setBpm(TEMPO);
    stepSequencer.setHumanize(true, 0.12, 0.010); // Swing + variation

    // Convert backgroundGroove events to pattern format { kick[], snare[], hat[] }
    let pattern = null;
    if (backgroundGroove && backgroundGroove.length > 0) {
      pattern = eventsToPattern(backgroundGroove);
    } else {
      // Fallback pattern
      pattern = {
        kick:  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hat:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      };
    }

    // Start Tone.Transport FIRST (needed for step sequencer)
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = TEMPO;

    // Set pattern and start step sequencer (continuous background beat)
    stepSequencer.setPattern(pattern);
    stepSequencer.start();
    
    // Play all words as a continuous phrase
    playSongSequence(prepared);
    
    // Start Transport AFTER scheduling to ensure perfect alignment
    Tone.Transport.start();
  };

  /**
   * Convert event-based groove to 16-step pattern arrays
   */
  const eventsToPattern = (events) => {
    const pattern = {
      kick: Array(16).fill(0),
      snare: Array(16).fill(0),
      hat: Array(16).fill(0),
      hatOpen: Array(16).fill(0),
    };

    const sp16 = 60 / TEMPO / 4; // Seconds per 16th note (0.125s at 120 BPM)

    events.forEach(event => {
      // Calculate which step this event falls on
      const step = Math.round(event.time / sp16) % 16;
      
      if (event.drum === 'kick') {
        pattern.kick[step] = 1;
      } else if (event.drum === 'snare') {
        pattern.snare[step] = 1;
      } else if (event.drum === 'hihatClosed' || event.drum === 'hihatOpen') {
        pattern.hat[step] = 1;
        if (event.drum === 'hihatOpen') {
          pattern.hatOpen[step] = 1;
        }
      }
    });

    return pattern;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Play all words as a song (LISTEN phase then YOUR_TURN phase)
  // ───────────────────────────────────────────────────────────────────────────

  const playSongSequence = (prepared) => {
    // Start slightly in future to avoid "past time" warnings, but aligned to beat
    // Since Transport hasn't started yet, scheduling at 0 means "start of transport"
    let currentTime = 0;
    
    // Calculate total phrase duration
    const phraseDuration = prepared.reduce((sum, w) => sum + w.loopDuration, 0);
    const GAP_BETWEEN_PHASES = 0.8; // Small pause between LISTEN and YOUR_TURN

    // ═══════════════════════════════════════════════════════════════════════
    // LOOP 1: LISTEN - All words with voice + beats
    // ═══════════════════════════════════════════════════════════════════════
    
    const listenStart = currentTime;
    
    scheduleEvent(listenStart, () => {
      if (!isPlayingRef.current) return;
      setSessionPhase(LOOP_PHASES.LISTEN);
      setLoopCount(1);
    });

    let wordOffset = 0;
    prepared.forEach((wordData, wordIdx) => {
      const wordStartTime = listenStart + wordOffset;

      // Update current word indicator
      scheduleEvent(wordStartTime, () => {
        if (!isPlayingRef.current) return;
        setCurrentWordIndex(wordIdx);
        setCurrentSyllableIndex(-1);
        
        // Notify parent that this word is active!
        if (onWordActive) {
            onWordActive(wordData.word);
        }
      });

      // Schedule syllable beats
      wordData.syllableDrumPattern.forEach((event, sIdx) => {
        const eventTime = wordStartTime + event.time;

        scheduleEvent(eventTime, () => {
          if (!isPlayingRef.current) return;
          audioService.triggerDrum(event.drum, event.velocity);
          setCurrentSyllableIndex(sIdx);
        });
      });

      // Schedule melody
      if (wordData.melody && wordData.melody.notes) {
        wordData.melody.notes.forEach(note => {
          const stepDuration = 60 / TEMPO / 4;
          const noteStartTime = wordStartTime + (note.quantizedStartStep * stepDuration);
          const noteDuration = (note.quantizedEndStep - note.quantizedStartStep) * stepDuration;
          const freq = Tone.Frequency(note.pitch, "midi").toNote();
          
          const id = Tone.Transport.schedule((time) => {
            if (!isPlayingRef.current) return;
            audioService.triggerMelodyNote(freq, noteDuration, time, (note.velocity / 127) * 0.8);
          }, noteStartTime);
          scheduledIdsRef.current.push(id);
        });
      }

      // Schedule voice
      if (wordData.ttsData.audioBuffer && !wordData.ttsData.isFallback) {
        scheduleVoice(wordData.ttsData.audioBuffer, wordStartTime);
      }

      wordOffset += wordData.loopDuration;
    });

    currentTime = listenStart + phraseDuration + GAP_BETWEEN_PHASES;

    // ═══════════════════════════════════════════════════════════════════════
    // LOOP 2: YOUR TURN - All words with beats only (no voice)
    // ═══════════════════════════════════════════════════════════════════════
    
    const yourTurnStart = currentTime;

    scheduleEvent(yourTurnStart, () => {
      if (!isPlayingRef.current) return;
      setSessionPhase(LOOP_PHASES.YOUR_TURN);
      setLoopCount(2);
    });

    wordOffset = 0;
    prepared.forEach((wordData, wordIdx) => {
      const wordStartTime = yourTurnStart + wordOffset;

      // Update current word indicator
      scheduleEvent(wordStartTime, () => {
        if (!isPlayingRef.current) return;
        setCurrentWordIndex(wordIdx);
        setCurrentSyllableIndex(-1);
        // Notify parent again for the second loop!
        if (onWordActive) {
            onWordActive(wordData.word);
        }
      });

      // Schedule syllable beats (NO voice this time!)
      // QUANTIZED for tight musical feel in the "Your Turn" phase
      wordData.syllableDrumPattern.forEach((event, sIdx) => {
        // Quantize relative time to nearest 16th note (0.125s at 120 BPM)
        const quantizationGrid = 60 / TEMPO / 4;
        const rawTime = event.time;
        const quantizedTime = Math.round(rawTime / quantizationGrid) * quantizationGrid;
        
        // Use quantized time if it's close enough (max 0.2s drift)
        const finalTime = Math.abs(quantizedTime - rawTime) < 0.2 ? quantizedTime : rawTime;
        const eventTime = wordStartTime + finalTime;

        scheduleEvent(eventTime, () => {
          if (!isPlayingRef.current) return;
          audioService.triggerDrum(event.drum, event.velocity);
          setCurrentSyllableIndex(sIdx);
        });
      });

      // Schedule melody (YES melody this time!)
      // Use the KIDS FUN VARIATION if available, otherwise standard melody
      const melodyToPlay = wordData.kidsMelody || wordData.melody;
      
      if (melodyToPlay && melodyToPlay.notes) {
        melodyToPlay.notes.forEach(note => {
          const stepDuration = 60 / TEMPO / 4;
          const noteStartTime = wordStartTime + (note.quantizedStartStep * stepDuration);
          const noteDuration = (note.quantizedEndStep - note.quantizedStartStep) * stepDuration;
          const freq = Tone.Frequency(note.pitch, "midi").toNote();
          
          const id = Tone.Transport.schedule((time) => {
            if (!isPlayingRef.current) return;
            // Play slightly louder AND shorter (Staccato) for vibrant, bouncy feel!
            // noteDuration * 0.5 makes it punchy
            audioService.triggerMelodyNote(freq, noteDuration * 0.5, time, (note.velocity / 127) * 1.0);
          }, noteStartTime);
          scheduledIdsRef.current.push(id);
        });
      }

      wordOffset += wordData.loopDuration;
    });

    // ═══════════════════════════════════════════════════════════════════════
    // Schedule finish after both phases complete
    // ═══════════════════════════════════════════════════════════════════════
    
    const totalDuration = (phraseDuration * 2) + GAP_BETWEEN_PHASES;
    
    // Report duration to parent so train can sync
    if (onMusicDurationCalculated) {
      onMusicDurationCalculated(totalDuration);
    }
    
    playbackRef.current = setTimeout(() => {
      finishPlayback();
    }, totalDuration * 1000);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Schedule helpers
  // ───────────────────────────────────────────────────────────────────────────

  const scheduleEvent = (time, callback) => {
    const id = Tone.Transport.schedule((scheduledTime) => {
      Tone.Draw.schedule(callback, scheduledTime);
    }, time);
    scheduledIdsRef.current.push(id);
  };

  const scheduleVoice = (audioBuffer, startTime) => {
    try {
      const player = new Tone.Player(audioBuffer).toDestination();
      const id = Tone.Transport.schedule((time) => {
        if (!isPlayingRef.current) return;
        player.start(time);
        setTimeout(() => {
          try { player.dispose(); } catch (e) { /* ignore */ }
        }, (audioBuffer.duration + 1) * 1000);
      }, startTime);
      scheduledIdsRef.current.push(id);
    } catch (error) {
      console.warn('Voice error:', error);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Finish playback - stop background, celebrate
  // ───────────────────────────────────────────────────────────────────────────

  const finishPlayback = () => {
    if (!isPlayingRef.current) return;

    // Stop the background beat (step sequencer)
    stepSequencer.stop();
    audioService.stopContinuousPlayback();

    // Play celebration sound
    setTimeout(() => {
      audioService.triggerDrum('crash', 0.7);
    }, 100);

    setPhase(PHASES.CELEBRATION);
    setSessionPhase(null);
    setCurrentWordIndex(-1);
    setCurrentSyllableIndex(-1);

    setTimeout(() => {
      cleanup();
      if (onPlaybackComplete) onPlaybackComplete();
      if (onStopSing) onStopSing();
    }, 2500);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Handle stop button
  // ───────────────────────────────────────────────────────────────────────────

  const handleStop = () => {
    cleanup();
    if (onStopSing) onStopSing();
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Get syllables for current word
  // ───────────────────────────────────────────────────────────────────────────

  const getCurrentWordSyllables = () => {
    if (currentWordIndex < 0 || currentWordIndex >= preparedWords.length) return null;
    return preparedWords[currentWordIndex]?.syllableData?.syllables || null;
  };

  const currentSyllables = getCurrentWordSyllables();
  
  // Ready to play if we are not processing AND we have prepared as many words as dropped
  const isReadyToPlay = !isProcessing && preparedWords.length === droppedWords.length;
  const canSing = droppedWords.length > 0 && isReadyToPlay && phase === PHASES.IDLE;

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* Header with phase indicator */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>
          🎵 {droppedWords.length > 0 
            ? `Lyrics (${droppedWords.length} word${droppedWords.length !== 1 ? 's' : ''})` 
            : 'Collect words to sing!'}
        </span>
        
        {/* Phase badge */}
        {phase === PHASES.PLAYING && sessionPhase && (
          <span style={{
            ...styles.phaseBadge,
            background: sessionPhase === LOOP_PHASES.LISTEN
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
          }}>
            {sessionPhase === LOOP_PHASES.LISTEN ? '👂 LISTEN' : '🎤 YOUR TURN'}
          </span>
        )}
      </div>

      {/* Loading Bar removed! Replaced by logic to prep in background */}
      
      {/* Celebration */}
      {phase === PHASES.CELEBRATION && (
        <div style={styles.celebration}>
          🎉 Amazing Job! 🎉
        </div>
      )}

      {/* Words display */}
      {droppedWords.length > 0 && phase !== PHASES.CELEBRATION && (
        <div style={styles.wordsContainer}>
          <div style={styles.wordsGrid}>
            {droppedWords.map((word, i) => {
              const isCurrentWord = i === currentWordIndex;
              const isPast = phase === PHASES.PLAYING && i < currentWordIndex;
              const isFuture = phase === PHASES.PLAYING && i > currentWordIndex;

              // If this word is currently playing, show syllables
              if (isCurrentWord && currentSyllables) {
                return (
                  <div key={i} style={styles.activeWordContainer}>
                    {currentSyllables.map((syl, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          ...styles.syllable,
                          ...(currentSyllableIndex === sIdx ? styles.syllableActive : {}),
                        }}
                      >
                        {syl}
                      </span>
                    ))}
                  </div>
                );
              }

              // Regular word display
              return (
                <span
                  key={i}
                  style={{
                    ...styles.word,
                    ...(isPast ? styles.wordPast : {}),
                    ...(isFuture ? styles.wordFuture : {}),
                  }}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Action button */}
      {droppedWords.length > 0 && (
        <button
          onClick={phase === PHASES.PLAYING ? handleStop : onSing}
          disabled={!canSing && phase !== PHASES.PLAYING}
          style={{
            ...styles.button,
            background: phase === PHASES.PLAYING
              ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)'
              : !isReadyToPlay
                ? 'linear-gradient(135deg, #78909C 0%, #546E7A 100%)'
                : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            boxShadow: phase === PHASES.PLAYING
              ? '0 4px 20px rgba(255, 107, 107, 0.5)'
              : '0 4px 20px rgba(56, 239, 125, 0.5)',
            opacity: (!canSing && phase !== PHASES.PLAYING) ? 0.7 : 1,
            cursor: (!canSing && phase !== PHASES.PLAYING) ? 'wait' : 'pointer',
          }}
        >
          {phase === PHASES.PLAYING ? (
            <>⏹ Stop</>
          ) : !isReadyToPlay ? (
            <>⏳ Preparing Music...</>
          ) : (
            <>🎤 Sing Your Words!</>
          )}
        </button>
      )}

      {/* Empty state */}
      {droppedWords.length === 0 && (
        <div style={styles.emptyHint}>
          Click on word clouds above to collect them!
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = {
  container: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '520px',
    minHeight: '100px',
    border: '4px solid #FFB74D',
    borderRadius: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    transition: 'all 0.3s ease',
    pointerEvents: 'auto',
    zIndex: 10,
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '12px',
    gap: '12px',
  },
  headerTitle: {
    fontFamily: '"Nunito", "Comic Sans MS", sans-serif',
    color: '#FF6F00',
    fontSize: '17px',
    fontWeight: 'bold',
  },
  phaseBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: 'bold',
    fontFamily: '"Nunito", sans-serif',
    boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
    animation: 'pulse 1s ease-in-out infinite',
  },
  // Loading bar style removed since we don't use it anymore
  celebration: {
    padding: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#38ef7d',
    fontFamily: '"Nunito", sans-serif',
    textAlign: 'center',
    animation: 'celebrationBounce 0.5s ease',
  },
  wordsContainer: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '16px',
    marginBottom: '14px',
  },
  wordsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: {
    padding: '8px 18px',
    borderRadius: '14px',
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: '"Nunito", sans-serif',
    background: 'rgba(255,255,255,0.12)',
    color: 'white',
    border: '2px solid rgba(255,255,255,0.15)',
    transition: 'all 0.3s ease',
  },
  wordPast: {
    opacity: 0.4,
    transform: 'scale(0.9)',
  },
  wordFuture: {
    opacity: 0.6,
  },
  activeWordContainer: {
    display: 'flex',
    gap: '4px',
    padding: '8px 12px',
    background: 'rgba(255, 217, 61, 0.15)',
    borderRadius: '16px',
    border: '2px solid rgba(255, 217, 61, 0.4)',
  },
  syllable: {
    fontSize: '26px',
    fontWeight: 'bold',
    fontFamily: '"Nunito", sans-serif',
    color: 'rgba(255,255,255,0.8)',
    padding: '4px 8px',
    borderRadius: '8px',
    transition: 'all 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  syllableActive: {
    color: '#ffd93d',
    transform: 'scale(1.25) translateY(-4px)',
    textShadow: '0 0 20px rgba(255, 217, 61, 0.8)',
    background: 'rgba(255, 217, 61, 0.2)',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px 44px',
    borderRadius: '20px',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: '"Nunito", sans-serif',
    transition: 'all 0.2s ease',
  },
  emptyHint: {
    color: '#999',
    fontSize: '14px',
    fontFamily: '"Nunito", sans-serif',
    marginTop: '5px',
  },
};

// Keyframes
if (typeof document !== 'undefined') {
  const existing = document.getElementById('dropzone-keyframes');
  if (!existing) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dropzone-keyframes';
    styleSheet.textContent = `
      @keyframes spin { 
        0% { transform: rotate(0deg); } 
        100% { transform: rotate(360deg); } 
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      @keyframes celebrationBounce {
        0% { transform: scale(0.8); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default DropZone;