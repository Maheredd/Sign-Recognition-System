import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebcam = (options = {}) => {
  const { autoStart = true, width = 640, height = 480 } = options;
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // 'PERMISSION_DENIED' | 'NOT_FOUND' | 'IN_USE' | 'UNKNOWN'
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Fetch available video devices
  const updateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = deviceList.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
    }
  }, [selectedDeviceId]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsLoading(false);
  }, []);

  const startStream = useCallback(async (deviceIdToUse) => {
    stopStream();
    setIsLoading(true);
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('NOT_SUPPORTED');
      setIsLoading(false);
      return;
    }

    const deviceId = deviceIdToUse || selectedDeviceId;
    const constraints = {
      audio: false,
      video: {
        width: { ideal: width },
        height: { ideal: height },
        deviceId: deviceId ? { exact: deviceId } : undefined,
        facingMode: deviceId ? undefined : 'user',
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve).catch(resolve);
          };
        });
      }

      setIsActive(true);
      setError(null);
      await updateDevices();
    } catch (err) {
      console.error('Webcam getUserMedia error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('PERMISSION_DENIED');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('NOT_FOUND');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('IN_USE');
      } else {
        setError('UNKNOWN');
      }
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeviceId, width, height, stopStream, updateDevices]);

  useEffect(() => {
    if (autoStart) {
      startStream();
    }
    return () => {
      stopStream();
    };
  }, [autoStart, startStream, stopStream]);

  const switchCamera = useCallback(async (newDeviceId) => {
    setSelectedDeviceId(newDeviceId);
    if (isActive) {
      await startStream(newDeviceId);
    }
  }, [isActive, startStream]);

  return {
    videoRef,
    isActive,
    isLoading,
    error,
    devices,
    selectedDeviceId,
    startStream,
    stopStream,
    switchCamera,
  };
};
