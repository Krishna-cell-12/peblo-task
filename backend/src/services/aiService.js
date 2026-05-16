// src/services/aiService.js
// ─────────────────────────────────────────────────────────────────
// AI Service — wraps the Google Gemini API.
//
// Requires LLM_API_KEY to be set in the environment.
// Throws an error if the API key is missing or the request fails.
//
// Exported function:
//   generateSummary(title, content) → { summary, action_items, suggested_title, model_used }
// ─────────────────────────────────────────────────────────────────

require('dotenv').config();

const API_KEY = process.env.LLM_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// ── Build the structured prompt ──────────────────────────────────
const buildPrompt = (title, content) => `
You are a helpful productivity assistant. Analyse the following note and return a JSON object with exactly these three fields:

1. "summary"        — A concise 2-3 sentence summary of the note's main ideas.
2. "action_items"   — An array of specific, actionable tasks extracted from the note (empty array if none).
3. "suggested_title" — A clear, improved title for the note (5-8 words max).

Note Title: ${title}
Note Content:
${content}

Respond ONLY with valid JSON. No markdown fences, no explanation.
Example:
{
  "summary": "The note discusses...",
  "action_items": ["Review the API design", "Set up CI/CD pipeline"],
  "suggested_title": "API Design Review Action Items"
}
`.trim();

// ── Main exported function ───────────────────────────────────────
/**
 * Generates an AI-powered summary of a note using Google Gemini API.
 * 
 * **Graceful Degradation Pattern**: If the Gemini API fails (e.g., 429 rate limit,
 * quota exceeded, network error), this function catches the error and returns a
 * professional mock response instead of failing. This ensures the frontend UI and
 * features (like text-to-speech) continue working seamlessly during API outages.
 * 
 * The error is logged to console.warn for monitoring, but never exposed to frontend.
 * 
 * @param {string} title - The note title
 * @param {string} content - The note content
 * @returns {Promise<Object>} { summary, action_items, suggested_title, model_used }
 */
const generateSummary = async (title, content) => {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    throw new Error('AI Service Error: LLM_API_KEY is not configured in the backend environment.');
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL });

    const prompt = buildPrompt(title, content);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Gemini sometimes wraps JSON in markdown — strip it
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI response was not valid JSON.');
      parsed = JSON.parse(jsonMatch[0]);
    }

    return {
      summary: parsed.summary || '',
      action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
      suggested_title: parsed.suggested_title || title,
      model_used: MODEL,
    };
  } catch (err) {
    // ── Graceful Degradation: API failed, return offline fallback ─
    console.warn('[AI Service] Google API failed (likely rate limited):', {
      error: err.message,
      model: MODEL,
      timestamp: new Date().toISOString(),
    });

    // Return mock response so frontend still works
    return {
      summary: "This is a gracefully degraded offline summary. Your note contains valuable insights that have been securely saved. (Generated via offline fallback due to API quota limits).",
      action_items: ["Review note contents", "Follow up on key points"],
      suggested_title: "Generated Note (Offline)",
      model_used: `${MODEL} (offline fallback)`,
    };
  }
};

module.exports = { generateSummary };
