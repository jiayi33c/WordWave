/**
 * Convex actions for child-friendly word generation (synonyms & antonyms)
 * Uses Google Gemini API server-side so the key stays private.
 */

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate child-friendly synonyms and antonyms for a given word.
 */
export const generateChildFriendlyWords = action({
  args: {
    word: v.string(),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { word, count = 8 } = args;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in Convex environment.");
    }

    const prompt = `Generate child-friendly synonyms and antonyms for the word "${word}".

Requirements:
- Audience: children age 5-10
- Simple, positive, easy-to-pronounce words
- Provide up to ${count} synonyms and ${count} antonyms
- Avoid scary, negative, or complex academic vocabulary
- Return JSON only in this shape:
{
  "synonyms": ["..."],
  "antonyms": ["..."]
}`;

    // Use gemini-1.5-flash (faster, cheaper) or gemini-1.5-pro (better quality)
    const model = "gemini-1.5-flash";
    
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const generated = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generated) throw new Error("No text returned from Gemini.");

    let jsonText = generated.trim();
    // Strip possible markdown fences
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json\n?|```\n?/g, "").replace(/```$/, "");
    }

    const parsed = JSON.parse(jsonText);
    return {
      word,
      synonyms: parsed.synonyms || [],
      antonyms: parsed.antonyms || [],
    };
  },
});

