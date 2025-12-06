/**
 * Audio Service - Tone.js Drum Kit & Scheduling
 * Synthesized drums, no samples required
 */

import * as Tone from 'tone';

class AudioService {
  constructor() {
    this.initialized = false;
    this.drumKit = null;
    this.backgroundPart = null;
    this.syllablePart = null;
    this.voicePlayer = null;
    this.melodySynth = null;
    this.masterVolume = null;
    this.scheduledParts = [];
    this.scheduledPlayers = [];
  }

  /**
   * Initialize Tone.js - MUST be called from user interaction
   */
  async initialize() {
    if (this.initialized) return true;

    try {
      await Tone.start();
      console.log('🔊 Tone.js audio context started');

      // Create master volume if not exists
      if (!this.masterVolume) {
        this.masterVolume = new Tone.Volume(0).toDestination();
      }

      this.createDrumKit();
      this.createMelodySynth();
      this.initialized = true;

      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  /**
   * Create synthesized drum kit - no samples needed!
   */
  createDrumKit() {
    // Kick drum - deep, punchy
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
      }
    }).connect(this.masterVolume);

    // Snare drum - crispy, sharp
    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.2,
      }
    }).connect(this.masterVolume);

    // Hi-hat closed - short, tight
    const hihatClosed = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.05,
      }
    }).connect(this.masterVolume);
    hihatClosed.volume.value = -10;

    // Hi-hat open - longer, sizzle
    const hihatOpen = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0.1,
        release: 0.3,
      }
    }).connect(this.masterVolume);
    hihatOpen.volume.value = -8;

    // Tom high
    const tomHigh = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0.01,
        release: 0.5,
      }
    }).connect(this.masterVolume);
    tomHigh.volume.value = -5;

    // Tom low
    const tomLow = new Tone.MembraneSynth({
      pitchDecay: 0.1,
      octaves: 5,
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 0.6,
      }
    }).connect(this.masterVolume);
    tomLow.volume.value = -5;

    // Crash cymbal
    const crash = new Tone.MetalSynth({
      frequency: 300,
      envelope: {
        attack: 0.001,
        decay: 1,
        release: 3,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(this.masterVolume);
    crash.volume.value = -15;

    // Ride cymbal
    const ride = new Tone.MetalSynth({
      frequency: 400,
      envelope: {
        attack: 0.001,
        decay: 0.4,
        release: 0.8,
      },
      harmonicity: 3.1,
      modulationIndex: 16,
      resonance: 5000,
      octaves: 1,
    }).connect(this.masterVolume);
    ride.volume.value = -12;

    // Woodblock - short, woody
    const woodblock = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
      }
    }).connect(this.masterVolume);
    woodblock.volume.value = -5;

    // Cowbell - metallic, tonal
    const cowbell = new Tone.MetalSynth({
      frequency: 800,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.3,
      },
      harmonicity: 1.4,
      modulationIndex: 10,
      resonance: 1000,
      octaves: 0.5,
    }).connect(this.masterVolume);
    cowbell.volume.value = -10;

    // Triangle - pure, high ringing
    const triangle = new Tone.MetalSynth({
      frequency: 1200,
      envelope: {
        attack: 0.001,
        decay: 0.5,
        release: 3,
      },
      harmonicity: 1.1,
      modulationIndex: 5,
      resonance: 7000,
      octaves: 0,
    }).connect(this.masterVolume);
    triangle.volume.value = -12;

    // Tambourine - rattle
    const tambourine = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0,
        release: 0.2,
      }
    }).connect(this.masterVolume);
    tambourine.volume.value = -10;

    // Bongo - high pitched membrane
    const bongo = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 3,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.2,
      }
    }).connect(this.masterVolume);
    bongo.volume.value = -5;

    this.drumKit = {
      kick,
      snare,
      hihatClosed,
      hihatOpen,
      tomHigh,
      tomLow,
      crash,
      ride,
      woodblock,
      cowbell,
      triangle,
      tambourine,
      bongo
    };

    console.log('🥁 Drum kit created');
  }

  /**
   * Create melody synthesizer
   */
  createMelodySynth() {
    this.melodySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      }
    }).connect(this.masterVolume);
    this.melodySynth.volume.value = -10;
  }

  /**
   * Trigger a drum sound
   * Uses Transport time when scheduled via Tone.Part
   */
  triggerDrum(drumName, velocity = 1, time = undefined) {
    if (!this.drumKit || !this.drumKit[drumName]) {
      console.warn('Unknown drum:', drumName);
      return;
    }

    const drum = this.drumKit[drumName];
    // When called from Tone.Part, time is already in Transport time
    const triggerTime = time !== undefined ? time : Tone.now();

    // Ensure velocity is valid
    const validVelocity = Math.max(0, Math.min(1, velocity));

    if (drumName === 'kick') {
      drum.triggerAttackRelease('C1', '8n', triggerTime, validVelocity);
    } else if (drumName === 'tomHigh') {
      drum.triggerAttackRelease('G2', '8n', triggerTime, validVelocity);
    } else if (drumName === 'tomLow') {
      drum.triggerAttackRelease('D2', '8n', triggerTime, validVelocity);
    } else if (drumName === 'snare' || drumName.includes('hihat') || drumName === 'tambourine') {
      drum.triggerAttackRelease('8n', triggerTime, validVelocity);
    } else if (drumName === 'crash' || drumName === 'ride' || drumName === 'cowbell' || drumName === 'triangle') {
      drum.triggerAttack(triggerTime, validVelocity);
    } else if (drumName === 'woodblock') {
      drum.triggerAttackRelease('E5', '16n', triggerTime, validVelocity);
    } else if (drumName === 'bongo') {
      drum.triggerAttackRelease('C4', '16n', triggerTime, validVelocity);
    }
  }

  /**
   * Trigger a melody note
   */
  triggerMelodyNote(note, duration, time, velocity = 0.5) {
    if (!this.melodySynth) this.createMelodySynth();
    
    try {
      this.melodySynth.triggerAttackRelease(note, duration, time, velocity);
    } catch (e) {
      console.warn('Melody trigger error:', e);
    }
  }

  /**
   * Create a Tone.Part from drum events
   * Ensures events are sorted and have unique times to avoid Tone.js errors
   */
  createDrumPart(events, onVisualCallback = null) {
    // Sort events by time and ensure unique times
    const sortedEvents = [...events]
      .sort((a, b) => a.time - b.time)
      .map((event, index, array) => {
        // If two events have the same time, add a tiny offset
        if (index > 0 && event.time === array[index - 1].time) {
          event.time = array[index - 1].time + 0.001; // 1ms offset
        }
        return event;
      });

    const part = new Tone.Part((time, event) => {
      // Trigger drum sound
      this.triggerDrum(event.drum, event.velocity, time);

      // Schedule visual callback
      if (onVisualCallback) {
        Tone.Draw.schedule(() => {
          onVisualCallback(event);
        }, time);
      }
    }, sortedEvents.map(e => [e.time, e]));

    return part;
  }

  /**
   * Schedule syllable drum pattern
   */
  scheduleSyllablePattern(events, onVisualCallback = null) {
    if (this.syllablePart) {
      this.syllablePart.dispose();
    }

    this.syllablePart = this.createDrumPart(events, onVisualCallback);
    this.syllablePart.loop = false;
    return this.syllablePart;
  }

  /**
   * Schedule background groove (loops continuously)
   */
  scheduleBackgroundGroove(events, loopDuration = 4) {
    if (this.backgroundPart) {
      this.backgroundPart.dispose();
    }

    this.backgroundPart = this.createDrumPart(events);
    this.backgroundPart.loop = true;
    this.backgroundPart.loopEnd = loopDuration;
    return this.backgroundPart;
  }

  /**
   * Load TTS audio buffer into player
   */
  async loadVoice(audioBuffer) {
    if (this.voicePlayer) {
      this.voicePlayer.dispose();
    }

    this.voicePlayer = new Tone.Player(audioBuffer).connect(this.masterVolume);
    await Tone.loaded();
    return this.voicePlayer;
  }

  /**
   * Start transport
   */
  startTransport() {
    Tone.Transport.start();
  }

  /**
   * Stop transport
   */
  stopTransport() {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
  }

  /**
   * Start continuous playback mode (for chained words)
   * Transport runs until explicitly stopped
   */
  startContinuousPlayback() {
    Tone.Transport.cancel(); // Clear any scheduled events
    Tone.Transport.position = 0;
    Tone.Transport.start();
  }

  /**
   * Stop continuous playback and clean up
   */
  stopContinuousPlayback() {
    // Stop transport first
    Tone.Transport.stop();
    Tone.Transport.cancel(); // Clear all scheduled events
    Tone.Transport.position = 0;

    // Dispose background part
    if (this.backgroundPart) {
      try {
        this.backgroundPart.stop();
        this.backgroundPart.dispose();
      } catch (e) { /* ignore */ }
      this.backgroundPart = null;
    }

    // Dispose syllable part
    if (this.syllablePart) {
      try {
        this.syllablePart.stop();
        this.syllablePart.dispose();
      } catch (e) { /* ignore */ }
      this.syllablePart = null;
    }

    // Dispose all scheduled parts
    if (this.scheduledParts) {
      this.scheduledParts.forEach(part => {
        try {
          part.stop();
          part.dispose();
        } catch (e) { /* ignore */ }
      });
      this.scheduledParts = [];
    }

    // Dispose all scheduled players
    if (this.scheduledPlayers) {
      this.scheduledPlayers.forEach(player => {
        try {
          player.stop();
          player.dispose();
        } catch (e) { /* ignore */ }
      });
      this.scheduledPlayers = [];
    }

    console.log('🛑 Audio playback stopped and cleaned up');
  }

  /**
   * Schedule syllable drum events at a specific time offset
   * Used for chaining multiple words
   * Events should be relative to 0, offsetTime is when to start the part (in seconds from now)
   */
  scheduleSyllablePatternAtOffset(events, offsetTime, onVisualCallback = null) {
    // Events should be relative to part start (0), not absolute times
    // Ensure events are sorted and have unique times
    const sortedEvents = [...events]
      .sort((a, b) => a.time - b.time)
      .map((event, index, array) => {
        // If two events have the same time, add a tiny offset (1ms)
        if (index > 0 && Math.abs(event.time - array[index - 1].time) < 0.001) {
          return { ...event, time: array[index - 1].time + 0.001 };
        }
        return event;
      });

    const part = this.createDrumPart(sortedEvents, onVisualCallback);
    part.loop = false;
    
    // Start the part at the offset time (relative to Transport start)
    // offsetTime is in seconds from when Transport started
    part.start(offsetTime);

    // Track for cleanup
    if (!this.scheduledParts) this.scheduledParts = [];
    this.scheduledParts.push(part);

    return part;
  }

  /**
   * Schedule a voice player to start at a specific time
   */
  scheduleVoiceAtOffset(audioBuffer, offsetTime) {
    try {
      const player = new Tone.Player(audioBuffer).toDestination();
      
      // Use Transport.schedule for precise timing
      Tone.Transport.schedule((time) => {
        try {
          player.start(time);
        } catch (e) {
          console.warn('Voice start error:', e);
        }
      }, offsetTime);

      // Track for cleanup
      this.scheduledPlayers.push(player);

      return player;
    } catch (error) {
      console.warn('Failed to schedule voice:', error);
      return null;
    }
  }

  /**
   * Start background groove that loops continuously
   * Background volume is controlled by reducing velocity
   */
  startBackgroundLoop(events, loopDuration = 4) {
    if (this.backgroundPart) {
      this.backgroundPart.dispose();
    }

    // Reduce velocity for background (35-45% volume)
    const backgroundEvents = events.map(e => ({
      ...e,
      velocity: e.velocity * 0.4 // Reduce to 40% volume
    }));

    this.backgroundPart = this.createDrumPart(backgroundEvents);
    this.backgroundPart.loop = true;
    this.backgroundPart.loopEnd = loopDuration;
    this.backgroundPart.start(0);
    return this.backgroundPart;
  }

  /**
   * Schedule a callback at a specific transport time
   */
  scheduleAtTime(callback, time) {
    Tone.Transport.schedule((scheduledTime) => {
      Tone.Draw.schedule(callback, scheduledTime);
    }, time);
  }

  /**
   * Set tempo (BPM)
   */
  setTempo(bpm) {
    Tone.Transport.bpm.value = bpm;
  }

  /**
   * Set master volume
   */
  setVolume(db) {
    this.masterVolume.volume.value = db;
  }

  /**
   * Get current transport time (in seconds since Transport started)
   */
  getTime() {
    return Tone.Transport.seconds;
  }

  /**
   * Schedule a callback at a specific time
   */
  scheduleCallback(callback, time) {
    Tone.Draw.schedule(callback, time);
  }

  /**
   * Clean up all audio resources
   */
  dispose() {
    if (this.syllablePart) this.syllablePart.dispose();
    if (this.backgroundPart) this.backgroundPart.dispose();
    if (this.voicePlayer) this.voicePlayer.dispose();

    Object.values(this.drumKit || {}).forEach(synth => synth.dispose());

    this.masterVolume.dispose();
    this.initialized = false;
  }

  isInitialized() {
    return this.initialized;
  }
}

// Export singleton instance
export const audioService = new AudioService();
export default audioService;

