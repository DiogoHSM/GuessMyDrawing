import { GoogleGenAI, Type } from "@google/genai";
import { PredictionResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'pt': 'Portuguese (Brazil)',
  'es': 'Spanish',
  'fr': 'French',
  'zh': 'Chinese (Simplified)',
};

export const analyzeSketch = async (base64Image: string, langCode: string = 'en'): Promise<PredictionResponse> => {
  try {
    // Remove the data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
    
    const targetLanguage = LANGUAGE_NAMES[langCode] || 'English';

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this real-time sketch. Identify what the user is likely trying to draw. Provide the object name and a short, direct visual explanation based on geometric shapes and lines. Respond in ${targetLanguage}.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            guess: {
              type: Type.STRING,
              description: `The name of the object being drawn (e.g., House, Tree) in ${targetLanguage}.`,
            },
            reasoning: {
              type: Type.STRING,
              description: `Visual explanation of why (e.g., 'I see a square with a triangle on top') in ${targetLanguage}.`,
            },
            confidence: {
              type: Type.NUMBER,
              description: "A number from 0 to 100 indicating confidence.",
            },
          },
          required: ["guess", "reasoning", "confidence"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as PredictionResponse;
    }

    throw new Error("No response text");
  } catch (error) {
    console.error("Error analyzing sketch:", error);
    return {
      guess: "...",
      reasoning: "...",
      confidence: 0,
    };
  }
};