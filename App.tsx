import React, { Suspense } from 'react';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { GestureController } from './components/GestureController';

const App: React.FC = () => {
    return (
        <div className="relative w-full h-screen bg-black">
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center text-yellow-600 font-serif animate-pulse">
                    PREPARING LUXURY...
                </div>
            }>
                <Scene />
            </Suspense>
            
            <UI />
            <GestureController />
        </div>
    );
};

export default App;
