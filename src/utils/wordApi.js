/**
 * Word API - Child-friendly synonyms/antonyms
 * Prefers Convex + Gemini (server-side), falls back to Datamuse.
 */

import { ConvexHttpClient } from "convex/browser";

let convex = null;
const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (convexUrl) {
  try {
    convex = new ConvexHttpClient(convexUrl);
    console.log("✅ Convex client initialized for word API");
  } catch (e) {
    console.warn("⚠️ Convex client init failed:", e);
  }
} else {
  console.warn("⚠️ VITE_CONVEX_URL not set; using Datamuse fallback");
}

/**
 * Fetch child-friendly synonyms & antonyms
 */
export async function fetchRelatedWords(word) {
  // Try Convex + Gemini first
  if (convex) {
    try {
      const result = await convex.action("words:generateChildFriendlyWords", {
        word,
        count: 8,
      });
      return {
        word,
        synonyms: (result.synonyms || []).slice(0, 5),
        antonyms: (result.antonyms || []).slice(0, 5),
      };
    } catch (e) {
      console.warn("⚠️ Convex/Gemini failed, falling back to Datamuse:", e);
    }
  }

  // Fallback: Datamuse
  try {
    const synResponse = await fetch(
      `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=5`
    );
    const antResponse = await fetch(
      `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=5`
    );
    const synData = await synResponse.json();
    const antData = await antResponse.json();
    return {
      word,
      synonyms: synData.map((item) => item.word),
      antonyms: antData.map((item) => item.word),
    };
  } catch (error) {
    console.error("❌ Datamuse fallback failed:", error);
    return { word, synonyms: [], antonyms: [] };
  }
}

