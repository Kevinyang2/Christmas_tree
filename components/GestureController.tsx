import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { useStore } from '../store';
import { AppState } from '../types';

// Importing via CDN requires dynamic import or global access if script tag used.
// For robustness in this format, we use a dynamic import approach or rely on global.
// However, since we can't easily guarantee global script load order in this XML block, 
// we will assume the script tags in index.html load the `vision_bundle` and we access it via window.
// If that fails, we fallback to manual mode UI.

export const GestureController: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const setGesture = useStore(s => s.setGesture);
    const setAppState = useStore(s => s.setAppState);
    const manualMode = useStore(s => s.manualMode);
    
    const [lastVideoTime, setLastVideoTime] = useState(-1);
    const gestureRecognizerRef = useRef<any>(null);
    const runningMode = "VIDEO";

    // Initialize MediaPipe
    useEffect(() => {
        if (manualMode) return;

        const loadMediaPipe = async () => {
            try {
                const { FilesetResolver, GestureRecognizer } = await import(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3"
                );

                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );

                gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                        delegate: "GPU"
                    },
                    runningMode: runningMode
                });
                console.log("Gesture Recognizer Loaded");
            } catch (e) {
                console.error("Failed to load MediaPipe, falling back to manual", e);
                useStore.getState().setManualMode(true);
            }
        };

        loadMediaPipe();
    }, [manualMode]);

    // Prediction Loop
    useEffect(() => {
        if (manualMode) return;
        
        const interval = setInterval(() => {
            if (gestureRecognizerRef.current && webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
                const video = webcamRef.current.video;
                if (video.currentTime !== lastVideoTime) {
                    setLastVideoTime(video.currentTime);
                    
                    try {
                        const results = gestureRecognizerRef.current.recognizeForVideo(video, Date.now());
                        
                        if (results.gestures.length > 0) {
                            const category = results.gestures[0][0].categoryName; // "Open_Palm", "Closed_Fist", "None"
                            const handLandmarks = results.landmarks[0];
                            
                            // Get centroid of hand for camera control
                            let sumX = 0, sumY = 0;
                            handLandmarks.forEach((l: any) => { sumX += l.x; sumY += l.y; });
                            const avgX = (sumX / handLandmarks.length - 0.5) * 2; // -1 to 1
                            const avgY = (sumY / handLandmarks.length - 0.5) * 2;

                            // Update Store
                            setGesture({
                                isHandDetected: true,
                                gesture: category,
                                handPosition: { x: avgX, y: avgY }
                            });

                            // App Logic Mapping
                            if (category === 'Open_Palm') {
                                setAppState(AppState.CHAOS);
                            } else if (category === 'Closed_Fist') {
                                setAppState(AppState.FORMED);
                            }

                        } else {
                            setGesture({ isHandDetected: false });
                        }
                    } catch(e) {
                        // ignore dropped frames
                    }
                }
            }
        }, 100); // Check every 100ms for performance

        return () => clearInterval(interval);
    }, [manualMode, lastVideoTime, setGesture, setAppState]);

    if (manualMode) return null;

    return (
        <div className="absolute bottom-4 right-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
            <div className="border-2 border-yellow-600 rounded-lg overflow-hidden w-32 h-24 bg-black">
                <Webcam
                    ref={webcamRef}
                    mirrored
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ width: 320, height: 240, facingMode: "user" }}
                    className="w-full h-full object-cover"
                />
            </div>
            <p className="text-xs text-yellow-500 text-center mt-1 font-serif">GESTURE SENSOR</p>
        </div>
    );
};
