"use client";
import { useEffect, useState } from "react";
import { useCamera } from "@/hooks/useCamera";

interface CameraViewProps {
  onCapture: (blob: Blob) => void;
  filterCSS: string;
}

export default function CameraView({ onCapture, filterCSS }: CameraViewProps) {
  const {
    videoRef,
    isStreaming,
    isRecording,
    startCamera,
    stopCamera,
    flipCamera,
    startRecording,
    stopRecording,
  } = useCamera();

  const [recordTime, setRecordTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      setRecordTime(0);
      interval = setInterval(() => setRecordTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleRecord = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      onCapture(blob);
      stopCamera();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="video-container w-full max-w-[360px] bg-black flex items-center justify-center relative">
        {!isStreaming ? (
          <button onClick={() => startCamera()} className="btn-primary text-lg px-8 py-4">
            📷 Open Camera
          </button>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ filter: filterCSS !== "none" ? filterCSS : undefined, transform: "scaleX(-1)" }}
            />
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono">{formatTime(recordTime)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {isStreaming && (
        <div className="flex items-center gap-4">
          <button onClick={flipCamera} className="btn-secondary text-sm">
            🔄 Flip
          </button>

          <button
            onClick={handleRecord}
            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${
              isRecording
                ? "border-red-500 bg-red-500/20"
                : "border-white bg-transparent hover:bg-white/10"
            }`}
          >
            {isRecording ? (
              <div className="w-6 h-6 bg-red-500 rounded-sm" />
            ) : (
              <div className="w-10 h-10 bg-red-500 rounded-full" />
            )}
          </button>

          <button onClick={() => { stopCamera(); }} className="btn-secondary text-sm">
            ✕ Close
          </button>
        </div>
      )}

      {!isStreaming && (
        <p className="text-sm text-[var(--text-secondary)]">
          Tap to start camera and record your reel
        </p>
      )}
    </div>
  );
}
