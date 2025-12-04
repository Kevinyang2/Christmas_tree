export enum AppState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface TreeParticle {
  id: number;
  chaosPos: [number, number, number];
  targetPos: [number, number, number];
  color: string;
  size: number;
  speed: number;
  type: 'LEAF' | 'ORNAMENT' | 'LIGHT' | 'POLAROID';
  imgUrl?: string; // For Polaroids
}

export interface GestureState {
  isHandDetected: boolean;
  gesture: 'Open_Palm' | 'Closed_Fist' | 'None';
  handPosition: { x: number; y: number }; // Normalized -1 to 1
}

export interface GeminiResponse {
  greeting: string;
}
