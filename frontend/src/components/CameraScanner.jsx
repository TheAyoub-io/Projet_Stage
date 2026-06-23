import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CameraScanner = ({ isOpen, onClose, onCapture, label }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur.");
      console.error("Camera access error:", err);
    } finally {
      setIsStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
    }
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      // Convert data URL to File object
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          onClose();
        });
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl relative flex flex-col">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Camera className="text-emerald-600" />
              Scanner : {label}
            </h3>
            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>

          {/* Camera Area */}
          <div className="relative bg-black w-full aspect-[4/3] flex items-center justify-center overflow-hidden">
            {error ? (
              <div className="text-red-400 text-center p-6 bg-red-900/20 rounded-lg m-4">
                <p className="font-bold">{error}</p>
                <button onClick={startCamera} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors text-sm">
                  Réessayer
                </button>
              </div>
            ) : capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                {isStarting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl opacity-70"></div>
                  <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl opacity-70"></div>
                  <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl opacity-70"></div>
                  <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-xl opacity-70"></div>
                  
                  {/* CSS animation inline for scanner line */}
                  <div 
                    className="absolute left-8 right-8 h-[2px] bg-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                    style={{
                      animation: 'scan-line 2s linear infinite',
                    }}
                  ></div>
                  <style>{`
                    @keyframes scan-line {
                      0% { top: 2rem; opacity: 0; }
                      10% { opacity: 1; }
                      90% { opacity: 1; }
                      100% { top: calc(100% - 2rem); opacity: 0; }
                    }
                  `}</style>
                </div>
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center gap-4">
            {capturedImage ? (
              <>
                <button 
                  onClick={retakePhoto}
                  className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw size={18} /> Reprendre
                </button>
                <button 
                  onClick={confirmPhoto}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/30"
                >
                  <Check size={18} /> Valider
                </button>
              </>
            ) : (
              <button 
                onClick={capturePhoto}
                disabled={isStarting || error}
                className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-emerald-100"
              >
                <Camera size={24} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CameraScanner;
