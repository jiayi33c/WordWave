/**
 * Melody Service - Fallback and Seeds
 */

import { audioService } from './audioService';

export const SYNONYM_SEED = 12345;
export const ANTONYM_SEED = 67890;

class MelodyService {
  /**
   * Generate a fallback melody if AI fails
   * Uses simple procedural generation based on a seed
   */
  fallbackMelodyGeneration(temperature, seed, tempo) {
    // Simple major scale procedural melody
    const scale = [60, 62, 64, 65, 67, 69, 71, 72]; // C Major
    const notes = [];
    const stepDuration = 60 / tempo / 4; // 16th note
    
    let currentStep = 0;
    const totalSteps = 32; // 2 bars
    
    // Pseudo-random generator
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 8; i++) {
      const pitch = scale[Math.floor(random() * scale.length)];
      const durationSteps = Math.floor(random() * 3) + 1; // 1-3 steps
      
      notes.push({
        pitch,
        quantizedStartStep: currentStep,
        quantizedEndStep: currentStep + durationSteps,
        velocity: 100
      });
      
      currentStep += durationSteps + Math.floor(random() * 2); // Add gaps
      if (currentStep >= totalSteps) break;
    }

    return { notes };
  }
}

export const melodyService = new MelodyService();
export default melodyService;

