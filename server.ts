import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing with size limits for drawing data
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Helper to get Gemini client with proper lazy loading and keys validation
  const getAiClient = () => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please define it in your Settings > Secrets panel.");
    }
    return new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  const LANGUAGE_NAMES: Record<string, string> = {
    'en': 'English',
    'pt': 'Portuguese (Brazil)',
    'es': 'Spanish',
    'fr': 'French',
    'zh': 'Chinese (Simplified)',
  };

  // Backend endpoint to analyze the drawing
  app.post("/api/analyze-sketch", async (req, res) => {
    try {
      const { base64Image, language = 'en' } = req.body;
      if (!base64Image) {
        return res.status(400).json({ error: "No image provided" });
      }

      // Initialize Gemini safely
      const ai = getAiClient();

      // Remove the data URL prefix if present
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
      const targetLanguage = LANGUAGE_NAMES[language] || 'English';

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
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
        try {
          const parsed = JSON.parse(response.text);
          return res.json(parsed);
        } catch (parseError) {
          console.error("Error parsing response JSON from Gemini:", parseError, response.text);
          return res.json({
            guess: "...",
            reasoning: "Failed to parse AI response. Try again.",
            confidence: 0
          });
        }
      }

      throw new Error("No response text from Gemini");
    } catch (error: any) {
      console.error("Server error analyzing sketch:", error);
      res.status(500).json({ 
        error: "Failed to analyze sketch", 
        details: error?.message || error 
      });
    }
  });

  // Vite integration middleware - Dynamically loaded to prevent crash in production
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite dev middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
