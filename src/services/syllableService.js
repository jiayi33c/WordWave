/**
 * Syllable Service - Analyzes words for rhythm
 */

import { syllable } from 'syllable';

class SyllableService {
  countSyllables(word) {
    return syllable(word);
  }

  /**
   * Analyze a word to get syllable counts, stress patterns, and estimated timestamps
   * based on character alignment data (from TTS)
   */
  extractSyllableTimestamps(word, charStartTimes, characters) {
    // Simple heuristic for syllable segmentation
    // 1. Count syllables
    const count = this.countSyllables(word);
    
    // 2. Naive segmentation: divide word duration equally among syllables
    // (Improving this requires complex NLP or phoneme data)
    
    const totalDuration = charStartTimes.length > 0 
        ? (charStartTimes[charStartTimes.length - 1] + 0.1) // approximate
        : 1.0;
    
    const syllableDuration = totalDuration / count;
    const syllableTimestamps = Array.from({ length: count }, (_, i) => i * syllableDuration);
    
    // 3. Generate simple stress pattern (Strong-Weak-Weak...)
    const stress = Array(count).fill(0);
    stress[0] = 1; // Stress first syllable usually
    
    // Mock syllables text (just split word for visual)
    // Logic to split text into syllabes is complex, so we approximate
    const partLength = Math.ceil(word.length / count);
    const syllablesText = [];
    for (let i = 0; i < count; i++) {
        syllablesText.push(word.slice(i * partLength, (i + 1) * partLength));
    }

    return {
      syllables: syllablesText,
      syllableTimestamps,
      stress,
      count
    };
  }
}

export const syllableService = new SyllableService();
export default syllableService;

