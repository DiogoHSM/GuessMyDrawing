export interface PredictionResponse {
  guess: string;
  reasoning: string;
  confidence: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export enum GameState {
  IDLE = 'IDLE',
  DRAWING = 'DRAWING',
  ANALYZING = 'ANALYZING',
}