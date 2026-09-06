import { PredictionResponse } from "../types";

export const analyzeSketch = async (base64Image: string, langCode: string = 'en'): Promise<PredictionResponse> => {
  try {
    const response = await fetch("/api/analyze-sketch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64Image,
        language: langCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as PredictionResponse;
  } catch (error) {
    console.error("Error analyzing sketch through backend:", error);
    return {
      guess: "...",
      reasoning: "Error communicating with server",
      confidence: 0,
    };
  }
};
