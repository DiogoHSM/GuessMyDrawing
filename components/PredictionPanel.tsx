import React from 'react';
import { PredictionResponse } from '../types';
import { Sparkles, BrainCircuit } from 'lucide-react';

interface PredictionPanelProps {
  prediction: PredictionResponse | null;
  isLoading: boolean;
  labels: {
    title: string;
    startDrawing: string;
    aiAttempt: string;
    iSee: string;
    why: string;
    thinking: string;
  };
}

const PredictionPanel: React.FC<PredictionPanelProps> = ({ prediction, isLoading, labels }) => {
  if (!prediction && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <Sparkles size={48} className="mb-4 text-indigo-200" />
        <p className="text-lg font-medium">{labels.startDrawing}</p>
        <p className="text-sm">{labels.aiAttempt}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 bg-slate-50 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <BrainCircuit className="text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-800">{labels.title}</h2>
      </div>

      {prediction ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
            <span className="text-xs font-bold tracking-wider text-indigo-500 uppercase mb-1 block">
              {labels.iSee}
            </span>
            <div className="text-4xl font-black text-slate-800 break-words leading-tight">
              {prediction.guess}
            </div>
            {prediction.confidence > 0 && (
               <div className="mt-3 flex items-center gap-2">
                 <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-indigo-500 transition-all duration-700 ease-out"
                     style={{ width: `${prediction.confidence}%` }}
                   ></div>
                 </div>
                 <span className="text-xs font-bold text-slate-500">{prediction.confidence}%</span>
               </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2 block">
              {labels.why}
            </span>
            <p className="text-slate-600 leading-relaxed text-lg">
              {prediction.reasoning}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500">{labels.thinking}</p>
        </div>
      )}
    </div>
  );
};

export default PredictionPanel;