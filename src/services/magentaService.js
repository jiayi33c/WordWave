/**
 * Magenta Service - AI Drum Pattern Generation
 * Uses GrooVAE Tap2Drum for syllable-to-drums conversion
 * Uses MusicVAE for background groove generation
 */

import * as mm from '@magenta/music';

// Model checkpoint URLs
const GROOVAE_TAP2DRUM_URL = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/groovae_tap2drum_2bar';
const MUSICVAE_DRUMS_URL = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/drums_2bar_lokl_small';
const MUSICVAE_MELODY_URL = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small_q2';

class MagentaService {
  constructor() {
    this.groovaeModel = null;
    this.musicvaeModel = null;
    this.melodyModel = null;
    this.modelsReady = false;
    this.loadingProgress = 0;
    this.onProgressCallback = null;
    this.initializationPromise = null; // Guard against double init
    this.patternCache = new Map(); // Word-based pattern caching
  }

  /**
   * Initialize both Magenta models
   */
  async initialize(onProgress = null) {
    // If already initialized, return immediately
    if (this.modelsReady) {
      console.log('🎵 Magenta models already loaded');
      return true;
    }

    // If initialization is in progress, return the existing promise
    if (this.initializationPromise) {
      console.log('🎵 Magenta initialization already in progress...');
      return this.initializationPromise;
    }

    this.onProgressCallback = onProgress;

    // Create and store the initialization promise
    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  async _doInitialize() {
    try {
      console.log('🎵 Loading Magenta AI models...');

      // Load models in parallel
      const [groovae, musicvae, melodyvae] = await Promise.all([
        this.loadGrooVAE(),
        this.loadMusicVAE(),
        this.loadMelodyModel()
      ]);

      this.groovaeModel = groovae;
      this.musicvaeModel = musicvae;
      this.melodyModel = melodyvae;
      this.modelsReady = true;

      console.log('✅ Magenta models ready!');
      return true;
    } catch (error) {
      console.error('❌ Failed to load Magenta models:', error);
      this.initializationPromise = null; // Allow retry on failure
      throw error;
    }
  }

  async loadGrooVAE() {
    console.log('Loading GrooVAE Tap2Drum...');
    this.updateProgress(10, 'Loading GrooVAE Tap2Drum...');
    
    const model = new mm.MusicVAE(GROOVAE_TAP2DRUM_URL);
    await model.initialize();
    
    this.updateProgress(50, 'GrooVAE ready!');
    console.log('✅ GrooVAE Tap2Drum loaded');
    return model;
  }

  async loadMusicVAE() {
    console.log('Loading MusicVAE Drums...');
    this.updateProgress(30, 'Loading MusicVAE Drums...');
    
    const model = new mm.MusicVAE(MUSICVAE_DRUMS_URL);
    await model.initialize();
    
    this.updateProgress(70, 'MusicVAE ready!');
    console.log('✅ MusicVAE Drums loaded');
    return model;
  }

  async loadMelodyModel() {
    console.log('Loading MusicVAE Melody...');
    this.updateProgress(60, 'Loading Melody AI...');
    
    const model = new mm.MusicVAE(MUSICVAE_MELODY_URL);
    await model.initialize();
    
    this.updateProgress(90, 'Melody AI ready!');
    console.log('✅ MusicVAE Melody loaded');
    return model;
  }

  updateProgress(progress, message) {
    this.loadingProgress = progress;
    if (this.onProgressCallback) {
      this.onProgressCallback(progress, message);
    }
  }

  /**
   * Create a tap NoteSequence from syllable timestamps
   * This is the input format GrooVAE expects
   */
  createTapSequence(syllableTimestamps, stressPattern = null, tempo = 120) {
    const notes = syllableTimestamps.map((timestamp, index) => {
      // Default stress pattern if not provided
      const stress = stressPattern ? stressPattern[index] : (index === 0 ? 1 : 0);
      // Velocity: stressed syllables are louder
      const velocity = stress === 1 ? 100 : stress === 2 ? 90 : 75;
      
      return {
        pitch: 42, // Hi-hat placeholder - GrooVAE will convert to full kit
        startTime: timestamp,
        endTime: timestamp + 0.1,
        velocity: velocity
      };
    });

    const sequence = {
      notes: notes,
      totalTime: Math.max(...syllableTimestamps) + 2.0, // Add buffer
      tempos: [{ time: 0, qpm: tempo }],
      quantizationInfo: { stepsPerQuarter: 4 }
    };

    return mm.sequences.quantizeNoteSequence(sequence, 4);
  }

  /**
   * Generate drum pattern from syllable timestamps using GrooVAE Tap2Drum
   * This is the KEY INNOVATION - AI converts rhythm to professional drums
   */
  async generateDrumPattern(syllableTimestamps, stressPattern = null, tempo = 120) {
    if (!this.groovaeModel) {
      throw new Error('GrooVAE model not loaded');
    }

    console.log('🥁 Generating drum pattern from syllables:', syllableTimestamps);

    // Create tap sequence from syllable timing
    const tapSequence = this.createTapSequence(syllableTimestamps, stressPattern, tempo);
    
    // Encode the tap sequence
    const z = await this.groovaeModel.encode([tapSequence]);
    
    // Decode to get full drum pattern
    const [drumPattern] = await this.groovaeModel.decode(z);
    
    console.log('✅ Generated drum pattern with', drumPattern.notes.length, 'notes');
    return drumPattern;
  }

  /**
   * Generate background groove using MusicVAE
   * Creates a continuous 2-bar loop
   */
  async generateBackgroundGroove(temperature = 0.4) {
    if (!this.musicvaeModel) {
      throw new Error('MusicVAE model not loaded');
    }

    console.log('🎶 Generating background groove...');
    
    // Sample a random 2-bar drum pattern
    const [backgroundLoop] = await this.musicvaeModel.sample(1, temperature);
    
    console.log('✅ Generated background groove with', backgroundLoop.notes.length, 'notes');
    return backgroundLoop;
  }

  /**
   * Generate melody using MusicVAE
   * Creates a 2-bar melody loop
   * Optimized for kids: Happy, structured, C Major
   */
  async generateMelody(temperature = 0.9) {
    if (!this.melodyModel) {
      throw new Error('Melody model not loaded');
    }

    console.log('🎹 Generating melody...');
    
    // Sample a random 2-bar melody
    // Temperature 0.9 gives good variety without being too chaotic
    const [melody] = await this.melodyModel.sample(1, temperature);
    
    // Post-process: Snap to C Major scale for happy "nursery rhyme" feel
    const happyMelody = this.makeKidsFriendly(melody);
    
    console.log('✅ Generated melody with', happyMelody.notes.length, 'notes');
    return happyMelody;
  }

  /**
   * Post-process melody to be kids-friendly
   * 1. Snap to C Major Scale (Happy)
   * 2. Quantize timings (Rhythmic)
   * 3. Filter out too many short notes
   */
  makeKidsFriendly(sequence) {
      const C_MAJOR = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
      
      // Clone notes to avoid mutating original if needed
      const newNotes = sequence.notes.map(note => {
          let pitch = note.pitch;
          const pitchClass = pitch % 12;
          
          // Snap to nearest C Major note
          if (!C_MAJOR.includes(pitchClass)) {
              // If not in scale, shift down 1 semitone (simple heuristic that works well for Major)
              // e.g. Eb -> D, Bb -> A, F# -> F
              pitch -= 1;
          }
          
          // Transpose to C4-C6 range (middle high) for "cute" sound
          // If too low, bump up octave
          while (pitch < 60) pitch += 12; // Minimum Middle C
          while (pitch > 84) pitch -= 12; // Maximum C6
          
          return { ...note, pitch };
      });
      
      // Filter: Remove notes that are too short (ticks/glitches)
      // or too close together (rapid fire)
      const filteredNotes = [];
      let lastTime = -1;
      
      newNotes.sort((a, b) => a.startTime - b.startTime).forEach(note => {
          // Min duration 0.1s, Min gap 0.1s
          if (note.endTime - note.startTime > 0.1 && note.startTime - lastTime > 0.1) {
              filteredNotes.push(note);
              lastTime = note.startTime;
          }
      });

      return { ...sequence, notes: filteredNotes };
  }

  /**
   * Convert Magenta NoteSequence to Tone.js-compatible events
   * Maps MIDI drum pitches to synth names (including kid-friendly instruments)
   */
  noteSequenceToToneEvents(noteSequence) {
    const DRUM_MAP = {
      35: 'kick', 36: 'kick',           // Acoustic/Bass Drum
      38: 'snare', 40: 'snare',         // Acoustic/Electric Snare
      42: 'hihatClosed',                // Closed Hi-Hat
      44: 'hihatClosed',                // Pedal Hi-Hat
      46: 'hihatOpen',                  // Open Hi-Hat
      49: 'crash', 57: 'crash',         // Crash Cymbals
      51: 'ride', 59: 'ride',           // Ride Cymbals
      45: 'tomLow', 47: 'tomLow',       // Low/Mid Tom
      48: 'tomHigh', 50: 'tomHigh',     // High Tom
      // Kid-friendly instruments
      54: 'tambourine',                 // Tambourine
      56: 'cowbell',                    // Cowbell
      60: 'bongo', 61: 'bongo',         // Bongo
      76: 'woodblock',                  // Woodblock
      81: 'triangle',                   // Triangle
    };

    return noteSequence.notes.map(note => ({
      time: note.startTime,
      drum: DRUM_MAP[note.pitch] || 'hihatClosed',
      velocity: note.velocity / 127, // Normalize to 0-1
      duration: note.endTime - note.startTime
    }));
  }

  /**
   * Extract melody from sequence (non-drum notes)
   */
  extractMelodyFromSequence(sequence) {
    if (!sequence || !sequence.notes) return null;
    const melodicNotes = sequence.notes.filter(note => !note.isDrum);
    if (melodicNotes.length === 0) return null;
    return {
      ...sequence,
      notes: melodicNotes
    };
  }

  /**
   * Get cached pattern for a word
   */
  getCachedPattern(word, syllables) {
    const cacheKey = `${word}-${syllables}`;
    return this.patternCache.get(cacheKey);
  }

  /**
   * Cache pattern for a word
   */
  cachePattern(word, syllables, pattern) {
    const cacheKey = `${word}-${syllables}`;
    this.patternCache.set(cacheKey, pattern);
  }

  /**
   * Clear pattern cache
   */
  clearPatternCache() {
    this.patternCache.clear();
  }

  /**
   * Check if models are ready
   */
  isReady() {
    return this.modelsReady;
  }

  /**
   * Get loading progress
   */
  getProgress() {
    return this.loadingProgress;
  }
}

// Export singleton instance
export const magentaService = new MagentaService();
export default magentaService;
