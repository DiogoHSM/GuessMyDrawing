import { GoogleGenAI, Type } from "@google/genai";
import { PredictionResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSketch = async (base64Image: string): Promise<PredictionResponse> => {
  try {
    // Remove the data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

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
            text: "Analise este desenho (sketch) que está sendo feito em tempo real. Identifique o que o usuário provavelmente está tentando desenhar. Forneça o nome do objeto e uma explicação curta e direta do porquê, baseando-se nas formas geométricas e linhas presentes. Responda em Português do Brasil.",
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
              description: "O nome do objeto que está sendo desenhado (ex: Casa, Árvore, Carro).",
            },
            reasoning: {
              type: Type.STRING,
              description: "Explicação visual do porquê (ex: 'Vejo um quadrado com um triângulo em cima, sugerindo o telhado de uma casa').",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Um número de 0 a 100 indicando quão certo você está.",
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
      reasoning: "Ainda estou tentando entender seus traços.",
      confidence: 0,
    };
  }
};