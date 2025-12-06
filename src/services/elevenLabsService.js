/**
 * ElevenLabs Service - Text to Speech via Convex (server-side key)
 * Falls back to browser TTS if server call fails.
 */

import { ConvexHttpClient } from "convex/browser";

const VOICE_ID = "XJ2fW4ybq7HouelYYGcL"; // Wordwave custom teacher voice

class ElevenLabsService {
  constructor() {
    this.cache = new Map();
    this.convex = null;
    try {
      const url = import.meta.env.VITE_CONVEX_URL;
      if (url) {
        this.convex = new ConvexHttpClient(url);
        console.log("✅ Convex client ready for ElevenLabs TTS");
      } else {
        console.warn("⚠️ VITE_CONVEX_URL not set. ElevenLabs will use fallback.");
      }
    } catch (e) {
      console.warn("⚠️ Convex client init failed:", e);
    }
  }

  /**
   * Decode base64 audio to AudioBuffer
   */
  async decodeBase64ToBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return await audioContext.decodeAudioData(bytes.buffer);
  }

  /**
   * Speak text via Convex + ElevenLabs
   */
  async speak(text, voiceId = VOICE_ID) {
    const cacheKey = `${voiceId}:${text}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      if (!this.convex) {
        throw new Error("Convex client not initialized");
      }

      console.log("🗣️ (Convex) Generating speech for:", text);
      const data = await this.convex.action("elevenlabs:ttsWithTimestamps", {
        text,
        voiceId,
      });

      const audioBuffer = await this.decodeBase64ToBuffer(data.audio_base64);
      const alignment = data.alignment || {};
      const characters = alignment.characters || [];
      const charStartTimes = alignment.character_start_times_seconds || [];
      const charEndTimes = alignment.character_end_times_seconds || [];

      const result = {
        audioBuffer,
        text,
        characters,
        charStartTimes,
        charEndTimes,
        duration: audioBuffer.duration,
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("❌ ElevenLabs Convex TTS failed, falling back:", error);
      return this.fallbackSpeak(text);
    }
  }

  /**
   * Browser TTS fallback when server/API fails
   */
  fallbackSpeak(text) {
    console.log("⚠️ Using browser TTS fallback");
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;

      // Estimate timing
      const avgCharDuration = 0.08;
      const characters = text.split("");
      const charStartTimes = characters.map((_, i) => i * avgCharDuration);
      const charEndTimes = characters.map((_, i) => (i + 1) * avgCharDuration);

      utterance.onend = () => {
        resolve({
          audioBuffer: null,
          text,
          characters,
          charStartTimes,
          charEndTimes,
          duration: text.length * avgCharDuration,
          isFallback: true,
        });
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  setVoice(voiceId) {
    this.defaultVoiceId = voiceId;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const elevenLabsService = new ElevenLabsService();
export default elevenLabsService;

