import { create } from 'zustand';
import { AppState, GestureState } from './types';

interface AppStore {
  appState: AppState;
  setAppState: (state: AppState) => void;
  
  // Gesture / Camera Control
  gesture: GestureState;
  setGesture: (gesture: Partial<GestureState>) => void;
  
  // Content
  aiGreeting: string;
  setAiGreeting: (text: string) => void;
  
  // Manual override for users without webcam
  manualMode: boolean;
  setManualMode: (mode: boolean) => void;
}

export const useStore = create<AppStore>((set) => ({
  appState: AppState.FORMED, // Start formed to see the tree first
  setAppState: (state) => set({ appState: state }),
  
  gesture: {
    isHandDetected: false,
    gesture: 'None',
    handPosition: { x: 0, y: 0 }
  },
  setGesture: (newGesture) => set((state) => ({ 
    gesture: { ...state.gesture, ...newGesture } 
  })),

  aiGreeting: "The magic of the season awaits your command.",
  setAiGreeting: (text) => set({ aiGreeting: text }),

  manualMode: false,
  setManualMode: (mode) => set({ manualMode: mode }),
}));
