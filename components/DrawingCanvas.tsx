import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Pencil, Trash2, Undo2 } from 'lucide-react';

interface DrawingCanvasProps {
  onDrawEnd: (base64Data: string) => void;
  isAnalyzing: boolean;
  labels: {
    pencil: string;
    eraser: string;
    undo: string;
    clear: string;
    analyzing: string;
  };
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDrawEnd, isAnalyzing, labels }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(4);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Initialize canvas size
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Set actual canvas size to handle high DPI screens properly or just simple 1:1
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        
        // Restore context settings after resize
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height); // White background
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Update context when styles change
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
    }
  }, [strokeColor, lineWidth]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev.slice(-10), imageData]); // Keep last 10 states
    }
  };

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to stop scrolling on mobile
    if ('touches' in e) e.preventDefault();
    
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    // Save state before starting new stroke for undo
    saveToHistory();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    if (!isDrawing) return;
    
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.closePath();
    
    // Trigger analysis
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onDrawEnd(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      saveToHistory();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      onDrawEnd(canvas.toDataURL('image/png'));
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const previousState = history[history.length - 1];
      ctx.putImageData(previousState, 0, 0);
      setHistory((prev) => prev.slice(0, -1));
      onDrawEnd(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white/90 p-2 rounded-xl shadow-lg backdrop-blur-sm border border-slate-200">
        <button
          onClick={() => setStrokeColor('#000000')}
          className={`p-2 rounded-lg transition-colors ${strokeColor === '#000000' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`}
          title={labels.pencil}
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={() => setStrokeColor('#FFFFFF')}
          className={`p-2 rounded-lg transition-colors ${strokeColor === '#FFFFFF' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`}
          title={labels.eraser}
        >
          <Eraser size={20} />
        </button>
        <div className="w-px h-8 bg-slate-200 mx-1 self-center"></div>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title={labels.undo}
        >
          <Undo2 size={20} />
        </button>
        <button
          onClick={clearCanvas}
          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
          title={labels.clear}
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div ref={containerRef} className="flex-1 bg-white cursor-crosshair touch-none shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block touch-none"
        />
      </div>
      
      {isAnalyzing && (
         <div className="absolute top-4 right-4 z-10">
           <span className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-full shadow-lg animate-pulse">
             <span className="w-2 h-2 bg-white rounded-full"></span>
             {labels.analyzing}
           </span>
         </div>
      )}
    </div>
  );
};

export default DrawingCanvas;