"use client";
import { useState, useRef, useCallback } from "react";

export function useCamera() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = useCallback(async (facing?: "user" | "environment") => {
    const mode = facing || facingMode;
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsStreaming(true);
      setFacingMode(mode);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera. Please allow camera permissions.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsRecording(false);
  }, []);

  const flipCamera = useCallback(() => {
    const newMode = facingMode === "user" ? "environment" : "user";
    if (isStreaming) {
      startCamera(newMode);
    } else {
      setFacingMode(newMode);
    }
  }, [facingMode, isStreaming, startCamera]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorderRef.current = recorder;
    recorder.start(100);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!recorderRef.current) return;
      recorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        resolve(blob);
        setIsRecording(false);
      };
      recorderRef.current.stop();
    });
  }, []);

  return {
    videoRef,
    isStreaming,
    isRecording,
    facingMode,
    startCamera,
    stopCamera,
    flipCamera,
    startRecording,
    stopRecording,
  };
}
