/**
 * Convex actions for child-friendly word generation (synonyms & antonyms)
 * Uses Google Gemini API server-side so the key stays private.
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const apiKey = process.env.GEMINI_API_KEY?.trim();

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

    // Use Google AI SDK with gemini-2.0-flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generated = response.text();

    if (!generated) throw new Error("No text returned from Gemini.");

    let jsonText = generated.trim();
    // Strip possible markdown fences
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json\n?|```\n?/g, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(jsonText);
    return {
      word,
      synonyms: parsed.synonyms || [],
      antonyms: parsed.antonyms || [],
    };
  },
});

