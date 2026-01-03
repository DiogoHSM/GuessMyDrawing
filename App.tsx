import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import PredictionPanel from './components/PredictionPanel';
import { analyzeSketch } from './services/geminiService';
import { PredictionResponse } from './types';

// Translations dictionary
const TRANSLATIONS = {
  en: {
    appTitle: "Sketch Guesser",
    predictionTitle: "AI Prediction",
    footer: "Draw something for the AI to guess.",
    prediction: {
      title: "AI Prediction",
      startDrawing: "Start drawing!",
      aiAttempt: "The AI will try to guess what it is.",
      iSee: "I see...",
      why: "Why?",
      thinking: "Thinking..."
    },
    canvas: {
      pencil: "Pencil",
      eraser: "Eraser",
      undo: "Undo",
      clear: "Clear All",
      analyzing: "Analyzing..."
    }
  },
  pt: {
    appTitle: "Adivinha o Desenho",
    predictionTitle: "Palpite da IA",
    footer: "Desenhe algo para a IA adivinhar.",
    prediction: {
      title: "Palpite da IA",
      startDrawing: "Comece a desenhar!",
      aiAttempt: "A IA tentará adivinhar o que é.",
      iSee: "Eu vejo...",
      why: "Por que?",
      thinking: "Pensando..."
    },
    canvas: {
      pencil: "Lápis",
      eraser: "Borracha",
      undo: "Desfazer",
      clear: "Limpar tudo",
      analyzing: "Analisando..."
    }
  },
  es: {
    appTitle: "Adivina el Dibujo",
    predictionTitle: "Predicción de la IA",
    footer: "Dibuja algo para que la IA lo adivine.",
    prediction: {
      title: "Predicción de la IA",
      startDrawing: "¡Empieza a dibujar!",
      aiAttempt: "La IA intentará adivinar qué es.",
      iSee: "Veo...",
      why: "¿Por qué?",
      thinking: "Pensando..."
    },
    canvas: {
      pencil: "Lápiz",
      eraser: "Borrador",
      undo: "Deshacer",
      clear: "Borrar todo",
      analyzing: "Analizando..."
    }
  },
  fr: {
    appTitle: "Devine le Dessin",
    predictionTitle: "Prédiction de l'IA",
    footer: "Dessinez quelque chose pour l'IA.",
    prediction: {
      title: "Prédiction de l'IA",
      startDrawing: "Commencez à dessiner !",
      aiAttempt: "L'IA essaiera de deviner ce que c'est.",
      iSee: "Je vois...",
      why: "Pourquoi ?",
      thinking: "Réflexion..."
    },
    canvas: {
      pencil: "Crayon",
      eraser: "Gomme",
      undo: "Annuler",
      clear: "Tout effacer",
      analyzing: "Analyse..."
    }
  },
  zh: {
    appTitle: "你画我猜 AI版",
    predictionTitle: "AI 预测",
    footer: "画点什么让 AI 猜猜看。",
    prediction: {
      title: "AI 预测",
      startDrawing: "开始绘画！",
      aiAttempt: "AI 将尝试猜测这是什么。",
      iSee: "我看到了...",
      why: "原因",
      thinking: "思考中..."
    },
    canvas: {
      pencil: "铅笔",
      eraser: "橡皮擦",
      undo: "撤销",
      clear: "清除所有",
      analyzing: "分析中..."
    }
  }
};

type LanguageCode = keyof typeof TRANSLATIONS;

const App: React.FC = () => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Detect browser language on mount
  useEffect(() => {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    const shortLang = browserLang.split('-')[0];
    
    if (['pt', 'es', 'fr', 'zh'].includes(shortLang)) {
      setLanguage(shortLang as LanguageCode);
    } else {
      setLanguage('en');
    }
  }, []);

  const t = useMemo(() => TRANSLATIONS[language], [language]);

  // Debounced analysis function
  const handleDrawEnd = useCallback((base64Data: string) => {
    // Clear any pending analysis
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Wait 800ms after user stops drawing to send request
    timeoutRef.current = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const result = await analyzeSketch(base64Data, language);
        setPrediction(result);
      } catch (error) {
        console.error("Failed to analyze", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);
  }, [language]); // Add language dependency so the API call uses the correct lang

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-slate-100 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 border-b border-slate-200 flex justify-between items-center z-20">
        <h1 className="font-bold text-lg text-slate-800">{t.appTitle}</h1>
        <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-medium">Gemini 3.0</div>
      </div>

      {/* Main Drawing Area */}
      <div className="flex-1 relative order-2 md:order-1 h-[60vh] md:h-full bg-slate-200">
        <DrawingCanvas 
          onDrawEnd={handleDrawEnd} 
          isAnalyzing={isAnalyzing} 
          labels={t.canvas}
        />
      </div>

      {/* Info/Prediction Panel */}
      <div className="order-1 md:order-2 h-[40vh] md:h-full md:w-[400px] bg-slate-50 border-l border-slate-200 shadow-xl z-20 flex flex-col">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <div>
            <h1 className="font-bold text-xl text-slate-800">{t.appTitle}</h1>
            <p className="text-xs text-slate-500 mt-1">Powered by Gemini 3.0 Flash</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          <PredictionPanel 
            prediction={prediction} 
            isLoading={isAnalyzing} 
            labels={t.prediction}
          />
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white text-xs text-slate-400 text-center">
            {t.footer}
        </div>
      </div>
    </div>
  );
};

export default App;