import { GoogleGenAI, Type } from "@google/genai";
import { AIPromptResponse } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBoardSuggestions = async (friendDescription: string): Promise<AIPromptResponse | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a mood board concept for a friend described as: "${friendDescription}". 
      Return a JSON object with a color palette (5 hex codes) and a list of 6-8 items (mix of 'text' quotes/jokes, 'sticker' emojis, and 'image' descriptions). 
      For images, provide a short descriptive search term.
      For text, make it short, catchy, or funny inside-joke style.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 5 hex color codes"
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['text', 'image', 'sticker'] },
                  content: { type: Type.STRING, description: "The text content, emoji, or image search term" },
                  gridSpan: { type: Type.STRING, enum: ['1x1', '1x2', '2x1', '2x2'] }
                },
                required: ['type', 'content', 'gridSpan']
              }
            }
          },
          required: ['colors', 'items']
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as AIPromptResponse;
    }
    return null;
  } catch (error) {
    console.error("Gemini generation error:", error);
    return null;
  }
};

export const generateSingleItem = async (prompt: string, type: 'text' | 'sticker'): Promise<string | null> => {
   const ai = getAiClient();
   if (!ai) return null;

   try {
     const response = await ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: `Generate a single creative ${type} item for a mood board based on this prompt: "${prompt}".
       If type is sticker, return a single emoji or very short kaomoji.
       If type is text, return a short quote, pun, or caption (max 10 words).
       Return ONLY the raw string content.`,
     });
     return response.text?.trim() || null;
   } catch (error) {
     console.error("Gemini item generation error:", error);
     return null;
   }
}
