import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm
  [5, 9], [9, 13], [13, 17],
];

export const FINGERTIP_INDICES = [4, 8, 12, 16, 20];

export const useHandTracking = (videoRef, options = {}) => {
  const { isEnabled = true, maxHands = 2 } = options;
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [fps, setFps] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [detectedHands, setDetectedHands] = useState([]);

  const landmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);
  const onResultsCallbackRef = useRef(null);

  // Allow consumer to attach frame listener without re-renders
  const setOnResults = useCallback((cb) => {
    onResultsCallbackRef.current = cb;
  }, []);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isCancelled = false;

    const initLandmarker = async () => {
      setIsModelLoading(true);
      setModelError(null);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );

        if (isCancelled) return;

        let landmarker;
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: maxHands,
          });
        } catch (gpuErr) {
          console.warn('GPU delegate failed, falling back to CPU:', gpuErr);
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: maxHands,
          });
        }

        if (isCancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setIsModelLoading(false);
      } catch (err) {
        console.error('Failed to initialize HandLandmarker:', err);
        if (!isCancelled) {
          setModelError(err.message || 'Failed to load MediaPipe Hand model');
          setIsModelLoading(false);
        }
      }
    };

    initLandmarker();

    return () => {
      isCancelled = true;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {
          console.warn('Error closing landmarker:', e);
        }
        landmarkerRef.current = null;
      }
    };
  }, [maxHands]);

  // Video processing animation loop
  useEffect(() => {
    if (!isEnabled || isModelLoading || modelError) return;

    let isActive = true;

    const processFrame = () => {
      if (!isActive) return;

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && video.readyState >= 2 && !video.paused && !video.ended) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const startTime = performance.now();

          try {
            const results = landmarker.detectForVideo(video, startTime);
            const endTime = performance.now();
            const detectDuration = Math.round(endTime - startTime);

            // FPS calculation
            frameCountRef.current += 1;
            const now = performance.now();
            if (lastFpsUpdateRef.current === 0) {
              lastFpsUpdateRef.current = now;
            } else if (now - lastFpsUpdateRef.current >= 1000) {
              setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)));
              frameCountRef.current = 0;
              lastFpsUpdateRef.current = now;
            }

            setLatencyMs(detectDuration);

            const handsList = (results.landmarks || []).map((lms, idx) => {
              const handednessObj = results.handednesses?.[idx]?.[0];
              return {
                landmarks: lms,
                handedness: handednessObj ? handednessObj.categoryName : 'Right',
                score: handednessObj ? handednessObj.score : 0.9,
              };
            });

            setDetectedHands(handsList);

            if (onResultsCallbackRef.current) {
              onResultsCallbackRef.current(handsList, results, detectDuration);
            }
          } catch (e) {
            console.warn('Error during hand detection frame:', e);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      isActive = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isEnabled, isModelLoading, modelError, videoRef]);

  return {
    isModelLoading,
    modelError,
    fps,
    latencyMs,
    detectedHands,
    setOnResults,
  };
};
