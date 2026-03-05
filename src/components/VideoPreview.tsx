"use client";
import { useRef, useEffect, useState } from "react";
import type { TextOverlayItem } from "./TextOverlayPanel";
import type { StickerItem } from "./StickerPanel";
import type { TransitionType } from "./TransitionPanel";

interface VideoPreviewProps {
  src: string;
  filterCSS: string;
  isImage?: boolean;
  speed?: number;
  textOverlays?: TextOverlayItem[];
  stickers?: StickerItem[];
  transition?: TransitionType;
}

const transitionCSS: Record<TransitionType, string> = {
  none: "",
  fadeIn: "animate-[fadeIn_1s_ease-in]",
  fadeOut: "",
  fadeInOut: "animate-[fadeIn_1s_ease-in]",
  slideLeft: "animate-[slideLeft_0.6s_ease-out]",
  slideRight: "animate-[slideRight_0.6s_ease-out]",
  slideUp: "animate-[slideUp_0.6s_ease-out]",
  zoomIn: "animate-[zoomIn_0.8s_ease-out]",
  zoomOut: "animate-[zoomOut_0.8s_ease-out]",
  blur: "animate-[blurIn_1s_ease-out]",
};

export default function VideoPreview({
  src,
  filterCSS,
  isImage,
  speed = 1,
  textOverlays = [],
  stickers = [],
  transition = "none",
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  // Update playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const formatTime = (t: number) => {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const textAnimationCSS = (anim: string) => {
    switch (anim) {
      case "fadeIn": return "animate-[fadeIn_1s_ease-in]";
      case "slideUp": return "animate-[slideUp_0.6s_ease-out]";
      case "bounce": return "animate-bounce";
      case "typewriter": return "animate-[typewriter_2s_steps(40)]";
      default: return "";
    }
  };

  // Overlay rendering
  const renderOverlays = () => (
    <>
      {/* Text overlays */}
      {textOverlays.map((t) => (
        <div
          key={t.id}
          className={`absolute pointer-events-none ${textAnimationCSS(t.animation)}`}
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            transform: "translate(-50%, -50%)",
            fontSize: `${t.fontSize}px`,
            color: t.color,
            fontFamily: t.fontFamily,
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          {t.text}
        </div>
      ))}

      {/* Stickers */}
      {stickers.map((s) => (
        <div
          key={s.id}
          className="absolute pointer-events-none"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
            fontSize: `${s.size}px`,
            lineHeight: 1,
          }}
        >
          {s.emoji}
        </div>
      ))}
    </>
  );

  if (isImage) {
    return (
      <div className={`video-container w-full max-w-[360px] flex items-center justify-center relative ${transitionCSS[transition]}`}>
        <img
          src={src}
          alt="Preview"
          className="w-full h-full object-cover"
          style={{ filter: filterCSS !== "none" ? filterCSS : undefined }}
        />
        {renderOverlays()}
      </div>
    );
  }

  return (
    <div className={`video-container w-full max-w-[360px] flex items-center justify-center relative group ${transitionCSS[transition]}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        style={{ filter: filterCSS !== "none" ? filterCSS : undefined }}
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlay}
      />

      {/* Overlays on top of video */}
      {renderOverlays()}

      {/* Speed badge */}
      {speed !== 1 && (
        <div className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded-full text-xs font-mono">
          {speed}x
        </div>
      )}

      {/* Play/Pause overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        onClick={togglePlay}
      >
        <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center">
          {isPlaying ? <span className="text-2xl">⏸</span> : <span className="text-2xl ml-1">▶</span>}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="text-xs w-6 h-6 flex items-center justify-center"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const t = Number(e.target.value);
              if (videoRef.current) videoRef.current.currentTime = t;
            }}
            className="flex-1"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="text-xs w-6 h-6 flex items-center justify-center"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>
        <div className="flex justify-between text-xs text-white/70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
