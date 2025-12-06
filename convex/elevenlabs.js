/**
 * ElevenLabs TTS via Convex action (server-side, key stays secret)
 * Returns base64 audio and alignment data.
 */

import { action } from "./_generated/server";
import { v } from "convex/values";

export const ttsWithTimestamps = action({
  args: {
    text: v.string(),
    voiceId: v.optional(v.string()),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set in Convex environment.");
    }

    const voiceId = args.voiceId || "21m00Tcm4TlvDq8ikWAM"; // default (Rachel)
    const modelId = args.modelId || "eleven_turbo_v2_5";

    const body = {
      text: args.text,
      model_id: modelId,
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.8,
      },
      // audio + alignment
      output_format: "mp3_22050_32",
    };

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ElevenLabs API error ${res.status}: ${text}`);
    }

    const data = await res.json();

    return {
      audio_base64: data.audio_base64,
      alignment: data.alignment || {},
      model_id: modelId,
      voice_id: voiceId,
    };
  },
});

