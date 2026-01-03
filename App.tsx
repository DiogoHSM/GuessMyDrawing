import React, { useState, useCallback, useEffect, useRef } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import PredictionPanel from './components/PredictionPanel';
import { analyzeSketch } from './services/geminiService';
import { PredictionResponse } from './types';
import { Github } from 'lucide-react';

const App: React.FC = () => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced analysis function
  const handleDrawEnd = useCallback((base64Data: string) => {
    // Clear any pending analysis
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Wait 800ms after user stops drawing to send request
    // This prevents spamming the API while the user is just pausing briefly
    timeoutRef.current = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const result = await analyzeSketch(base64Data);
        setPrediction(result);
      } catch (error) {
        console.error("Failed to analyze", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-slate-100 overflow-hidden">
      {/* Mobile Header / Desktop Sidebar Title */}
      <div className="md:hidden bg-white p-4 border-b border-slate-200 flex justify-between items-center z-20">
        <h1 className="font-bold text-lg text-slate-800">Adivinha o Desenho</h1>
        <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-medium">Gemini 3.0</div>
      </div>

      {/* Main Drawing Area */}
      <div className="flex-1 relative order-2 md:order-1 h-[60vh] md:h-full bg-slate-200">
        <DrawingCanvas onDrawEnd={handleDrawEnd} isAnalyzing={isAnalyzing} />
      </div>

      {/* Info/Prediction Panel */}
      <div className="order-1 md:order-2 h-[40vh] md:h-full md:w-[400px] bg-slate-50 border-l border-slate-200 shadow-xl z-20 flex flex-col">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <div>
            <h1 className="font-bold text-xl text-slate-800">Adivinha o Desenho</h1>
            <p className="text-xs text-slate-500 mt-1">Powered by Gemini 3.0 Flash</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          <PredictionPanel prediction={prediction} isLoading={isAnalyzing} />
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white text-xs text-slate-400 text-center">
            Desenhe algo para a IA adivinhar.
        </div>
      </div>
    </div>
  );
};

export default App;