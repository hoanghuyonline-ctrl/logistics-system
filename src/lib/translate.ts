/**
 * AI Translation Helper using Gemini API
 */

export interface TranslationResult {
  zh: string;
  en: string;
}

/**
 * Translates Vietnamese text to Chinese (zh) and English (en) using Gemini API.
 * Falls back to basic status message or original text if API key is not configured or errors out.
 */
export async function translateText(text: string): Promise<TranslationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!text || !text.trim()) {
    return { zh: "", en: "" };
  }

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not configured. Returning original text as fallback.");
    // Fallback if key is missing
    return {
      zh: `${text} (zh)`,
      en: `${text} (en)`,
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are a professional translator. Translate the following Vietnamese text into Chinese (simplified) and English.
Return ONLY a JSON object with the following structure:
{
  "zh": "translated Chinese text here",
  "en": "translated English text here"
}
Do not wrap it in markdown code block formatting (do not use \`\`\`json). Just return the raw JSON object.

Text to translate:
"${text.replace(/"/g, '\\"')}"`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error("Invalid response format from Gemini API");
    }

    // Clean up response if there are any markdown wrappers
    let cleanJson = candidateText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(cleanJson) as TranslationResult;
    
    return {
      zh: parsed.zh || `${text} (zh)`,
      en: parsed.en || `${text} (en)`,
    };
  } catch (error) {
    console.error("Translation failed with error:", error);
    return {
      zh: `${text} (zh)`,
      en: `${text} (en)`,
    };
  }
}
