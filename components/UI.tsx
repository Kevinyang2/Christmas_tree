import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { AppState } from '../types';
import { generateLuxuryGreeting } from '../services/geminiService';

export const UI: React.FC = () => {
    const { appState, setAppState, gesture, aiGreeting, setAiGreeting, manualMode, setManualMode } = useStore();
    const [loadingAI, setLoadingAI] = useState(false);

    // Trigger AI greeting when tree forms
    useEffect(() => {
        if (appState === AppState.FORMED) {
            setLoadingAI(true);
            generateLuxuryGreeting().then(text => {
                setAiGreeting(text);
                setLoadingAI(false);
            });
        }
    }, [appState, setAiGreeting]);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="pointer-events-auto">
                    <h1 className="font-serif text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 font-black tracking-widest drop-shadow-lg">
                        TRUMP
                    </h1>
                    <h2 className="font-serif text-xl text-emerald-400 tracking-[0.3em] mt-2">
                        LUXURY HOLIDAY
                    </h2>
                </div>
                
                <div className="text-right pointer-events-auto">
                    <button 
                        onClick={() => setManualMode(!manualMode)}
                        className={`px-4 py-1 text-xs border border-yellow-600/50 rounded hover:bg-yellow-900/30 transition-colors ${manualMode ? 'text-yellow-400' : 'text-gray-500'}`}
                    >
                        {manualMode ? 'GESTURE OFF' : 'GESTURE ON'}
                    </button>
                    {gesture.isHandDetected && !manualMode && (
                        <div className="mt-2 text-yellow-400 font-mono text-xs animate-pulse">
                            SENSOR ACTIVE: {gesture.gesture}
                        </div>
                    )}
                </div>
            </div>

            {/* Center Message */}
            <div className={`transition-opacity duration-1000 flex justify-center items-center ${appState === AppState.FORMED ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-black/40 backdrop-blur-md border border-yellow-600/30 p-6 md:p-10 max-w-2xl text-center transform transition-all duration-700 hover:scale-105 pointer-events-auto">
                    <p className="font-serif text-yellow-100 text-lg md:text-2xl italic leading-relaxed">
                        {loadingAI ? "Consulting the best minds..." : `"${aiGreeting}"`}
                    </p>
                    <div className="w-16 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-6"></div>
                </div>
            </div>

            {/* Footer / Controls */}
            <div className="flex flex-col items-center pb-8 pointer-events-auto">
                <div className="flex gap-6 mb-4">
                    <button 
                        onClick={() => setAppState(AppState.CHAOS)}
                        className={`group relative px-8 py-3 bg-gradient-to-b from-gray-800 to-black border border-gray-600 rounded-sm overflow-hidden transition-all duration-300 ${appState === AppState.CHAOS ? 'ring-2 ring-red-500' : 'hover:border-red-500'}`}
                    >
                        <div className="absolute inset-0 w-full h-full bg-red-900/20 group-hover:bg-red-900/40 transition-all"></div>
                        <span className="relative font-serif text-red-100 tracking-widest font-bold">UNLEASH CHAOS</span>
                    </button>

                    <button 
                        onClick={() => setAppState(AppState.FORMED)}
                        className={`group relative px-8 py-3 bg-gradient-to-b from-emerald-900 to-black border border-emerald-600 rounded-sm overflow-hidden transition-all duration-300 ${appState === AppState.FORMED ? 'ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'hover:border-yellow-400'}`}
                    >
                        <div className="absolute inset-0 w-full h-full bg-emerald-900/20 group-hover:bg-emerald-900/40 transition-all"></div>
                        <span className="relative font-serif text-yellow-100 tracking-widest font-bold">MAKE IT GREAT</span>
                    </button>
                </div>

                <p className="text-emerald-800/60 text-xs font-serif tracking-widest">
                    {manualMode ? "MANUAL CONTROL ENABLED" : "SHOW OPEN PALM TO SCATTER • CLOSED FIST TO FORM"}
                </p>
            </div>
        </div>
    );
};
