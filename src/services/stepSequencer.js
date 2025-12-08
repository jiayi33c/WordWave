/**
 * Step Sequencer Service
 * Manages the background drum loop
 */

import * as Tone from 'tone';
import { audioService } from './audioService';

class StepSequencer {
  constructor() {
    this.loop = null;
    this.pattern = null;
    this.bpm = 120;
    this.humanizeAmount = 0;
    this.isPlaying = false;
  }

  async initialize() {
    // Tone.js already init by audioService
    return true;
  }

  setBpm(bpm) {
    this.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
  }

  setHumanize(enabled, timing = 0.01, velocity = 0.05) {
    this.humanizeAmount = enabled ? timing : 0;
  }

  setPattern(pattern) {
    this.pattern = pattern;
  }

  start() {
    if (this.loop) {
      this.loop.dispose();
    }

    if (!this.pattern) return;

    this.loop = new Tone.Loop((time) => {
      // 16th note steps
      const stepDuration = Tone.Time('16n').toSeconds();
      
      // Current step in 16-step sequence
      // We calculate this based on Transport position roughly
      // But Tone.Loop runs every beat/bar? No, loop runs at interval.
      // A better way is a Sequence.
    }, '16n'); // Actually we want a Sequence to track steps.
    
    // Re-implement using Tone.Sequence for 16 steps
    this.loop?.dispose();
    
    const steps = Array.from({ length: 16 }, (_, i) => i);
    
    this.loop = new Tone.Sequence((time, step) => {
      if (!this.pattern) return;

      // Play instruments based on pattern
      if (this.pattern.kick[step]) {
        audioService.triggerDrum('kick', 0.8, time);
      }
      if (this.pattern.snare[step]) {
        audioService.triggerDrum('snare', 0.7, time);
      }
      if (this.pattern.hat[step]) {
        audioService.triggerDrum('hihatClosed', 0.5, time);
      }
      if (this.pattern.hatOpen && this.pattern.hatOpen[step]) {
        audioService.triggerDrum('hihatOpen', 0.5, time);
      }
      
    }, steps, '16n').start(0);
    
    this.isPlaying = true;
  }

  stop() {
    if (this.loop) {
      this.loop.stop();
      // Don't dispose immediately if we want to restart, but safer to stop
    }
    this.isPlaying = false;
  }
}

export const stepSequencer = new StepSequencer();
export default stepSequencer;

