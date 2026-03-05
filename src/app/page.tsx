"use client";
import { useState, useCallback } from "react";
import CameraView from "@/components/CameraView";
import UploadView from "@/components/UploadView";
import VideoPreview from "@/components/VideoPreview";
import FilterPanel from "@/components/FilterPanel";
import MusicPanel, { type MusicTrack } from "@/components/MusicPanel";
import ExportPanel from "@/components/ExportPanel";
import TextOverlayPanel, { type TextOverlayItem } from "@/components/TextOverlayPanel";
import StickerPanel, { type StickerItem } from "@/components/StickerPanel";
import SpeedControl from "@/components/SpeedControl";
import TransitionPanel, { type TransitionType } from "@/components/TransitionPanel";
import {
  FILTERS,
  type FilterDef,
  type BeautySettings,
  DEFAULT_BEAUTY,
  beautyToCSS,
} from "@/utils/filters";
import { exportVideo, type ExportOptions } from "@/utils/ffmpeg-helper";

type Step = "source" | "edit" | "export";
type SourceMode = "camera" | "upload";
type EditTab = "filters" | "music" | "text" | "stickers" | "speed" | "transitions";

export default function Home() {
  // Steps
  const [step, setStep] = useState<Step>("source");
  const [sourceMode, setSourceMode] = useState<SourceMode>("camera");

  // Media
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [isImage, setIsImage] = useState(false);

  // Filters & beauty
  const [activeFilter, setActiveFilter] = useState<FilterDef>(FILTERS[0]);
  const [beauty, setBeauty] = useState<BeautySettings>(DEFAULT_BEAUTY);

  // Music
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);

  // Text overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlayItem[]>([]);

  // Stickers
  const [stickers, setStickers] = useState<StickerItem[]>([]);

  // Speed
  const [speed, setSpeed] = useState(1);

  // Transitions
  const [transition, setTransition] = useState<TransitionType>("none");

  // Edit panel
  const [editTab, setEditTab] = useState<EditTab>("filters");

  // Export state
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMsg, setExportMsg] = useState("");

  // Combined CSS filter for preview
  const combinedFilter = (() => {
    const base = activeFilter.css !== "none" ? activeFilter.css : "";
    const beautyCSS = beautyToCSS(beauty);
    const isDefault = JSON.stringify(beauty) === JSON.stringify(DEFAULT_BEAUTY);
    if (!base && isDefault) return "none";
    return [base, isDefault ? "" : beautyCSS].filter(Boolean).join(" ");
  })();

  // Handle captured/uploaded media
  const handleMedia = useCallback((blob: Blob, image: boolean = false) => {
    setMediaBlob(blob);
    setMediaUrl(URL.createObjectURL(blob));
    setIsImage(image);
    setStep("edit");
  }, []);

  const handleFileUpload = useCallback(
    (file: File) => handleMedia(file, file.type.startsWith("image/")),
    [handleMedia]
  );

  const handleAudioUpload = useCallback((file: File) => {
    setUploadedAudio(file);
    setSelectedTrack({
      id: `custom-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ""),
      artist: "Your Audio",
      previewUrl: URL.createObjectURL(file),
      duration: 0,
    });
  }, []);

  // Full export pipeline
  const handleExport = useCallback(
    async (withWatermark: boolean, watermarkText?: string, watermarkPos?: string) => {
      if (!mediaBlob) return;

      try {
        // Convert blob to Uint8Array
        const buffer = await mediaBlob.arrayBuffer();
        const videoData = new Uint8Array(buffer);

        const opts: ExportOptions = {
          videoData,
          filterName: activeFilter.name,
          speed: speed !== 1 ? speed : undefined,
          watermarkText: withWatermark ? (watermarkText || "Made with Reels Creator") : undefined,
          watermarkPosition: withWatermark ? (watermarkPos as any || "bottom-right") : undefined,
          musicUrl: selectedTrack?.previewUrl || undefined,
          musicVolume: 0.7,
          keepOriginalAudio: true,
          textOverlays: textOverlays.map((t) => ({
            text: t.text,
            x: Math.round((t.x / 100) * 1080),
            y: Math.round((t.y / 100) * 1920),
            fontSize: t.fontSize,
            color: t.color,
          })),
        };

        const blob = await exportVideo(opts, (progress, msg) => {
          setExportProgress(progress);
          setExportMsg(msg);
        });

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reel${withWatermark ? "-branded" : ""}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Export failed:", err);
        // Fallback: download original
        const a = document.createElement("a");
        a.href = mediaUrl;
        a.download = `reel.${isImage ? "jpg" : "mp4"}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    },
    [mediaBlob, mediaUrl, isImage, activeFilter, speed, selectedTrack, textOverlays]
  );

  const startOver = () => {
    setStep("source");
    setMediaBlob(null);
    setMediaUrl("");
    setIsImage(false);
    setActiveFilter(FILTERS[0]);
    setBeauty(DEFAULT_BEAUTY);
    setSelectedTrack(null);
    setUploadedAudio(null);
    setTextOverlays([]);
    setStickers([]);
    setSpeed(1);
    setTransition("none");
  };

  const EDIT_TABS: { key: EditTab; icon: string; label: string }[] = [
    { key: "filters", icon: "✨", label: "Filters" },
    { key: "music", icon: "🎵", label: "Music" },
    { key: "text", icon: "📝", label: "Text" },
    { key: "stickers", icon: "😎", label: "Stickers" },
    { key: "speed", icon: "⚡", label: "Speed" },
    { key: "transitions", icon: "🎞️", label: "Effects" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-4 py-3 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">Reels Creator</h1>
              <p className="text-[10px] text-[var(--text-secondary)] hidden sm:block">Create stunning short videos</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="hidden md:flex items-center gap-2">
            {(["source", "edit", "export"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (s === "source") startOver();
                    else if (s === "edit" && mediaBlob) setStep("edit");
                    else if (s === "export" && mediaBlob) setStep("export");
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? "bg-[var(--accent)] text-white scale-110"
                      : mediaBlob && (s === "edit" || s === "export")
                      ? "bg-[var(--bg-tertiary)] text-white cursor-pointer hover:bg-[var(--border)]"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                  }`}
                >
                  {i + 1}
                </button>
                <span className={`text-xs capitalize ${step === s ? "text-white font-medium" : "text-[var(--text-secondary)]"}`}>
                  {s}
                </span>
                {i < 2 && <div className="w-6 h-[1px] bg-[var(--border)]" />}
              </div>
            ))}
          </div>

          {step !== "source" && (
            <button onClick={startOver} className="btn-secondary text-xs sm:text-sm">
              ← New Reel
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4">
        {/* STEP 1: Source selection */}
        {step === "source" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold mb-2">Create Your Reel</h2>
              <p className="text-[var(--text-secondary)]">
                Record from camera or upload a video/image
              </p>
            </div>

            <div className="flex bg-[var(--bg-secondary)] rounded-xl p-1 border border-[var(--border)]">
              <button
                onClick={() => setSourceMode("camera")}
                className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${
                  sourceMode === "camera"
                    ? "bg-[var(--accent)] text-white shadow-lg"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                📷 Camera
              </button>
              <button
                onClick={() => setSourceMode("upload")}
                className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${
                  sourceMode === "upload"
                    ? "bg-[var(--accent)] text-white shadow-lg"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                📁 Upload
              </button>
            </div>

            <div className="w-full flex justify-center">
              {sourceMode === "camera" ? (
                <CameraView onCapture={(blob) => handleMedia(blob)} filterCSS={combinedFilter} />
              ) : (
                <UploadView onFile={handleFileUpload} />
              )}
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 max-w-lg">
              {[
                { icon: "✨", text: "Beauty Filters" },
                { icon: "🎵", text: "Add Music" },
                { icon: "📝", text: "Text & Stickers" },
                { icon: "⚡", text: "Speed Control" },
                { icon: "🎞️", text: "Transitions" },
                { icon: "💧", text: "Watermark" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <span>{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Edit */}
        {step === "edit" && (
          <div className="flex flex-col lg:flex-row gap-4 py-4">
            {/* Preview */}
            <div className="flex-1 flex flex-col items-center gap-4">
              <VideoPreview
                src={mediaUrl}
                filterCSS={combinedFilter}
                isImage={isImage}
                speed={speed}
                textOverlays={textOverlays}
                stickers={stickers}
                transition={transition}
              />

              <div className="flex gap-3">
                <button onClick={() => setStep("source")} className="btn-secondary text-sm">
                  ← Back
                </button>
                <button onClick={() => setStep("export")} className="btn-primary text-sm px-6">
                  Export →
                </button>
              </div>
            </div>

            {/* Edit panels */}
            <div className="lg:w-[400px] space-y-3">
              {/* Tab bar */}
              <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-xl p-1 border border-[var(--border)] overflow-x-auto">
                {EDIT_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setEditTab(t.key)}
                    className={`flex-1 min-w-0 px-2 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 ${
                      editTab === t.key
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-secondary)] hover:text-white"
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Panel content */}
              <div className="panel max-h-[60vh] overflow-y-auto">
                {editTab === "filters" && (
                  <FilterPanel
                    activeFilter={activeFilter.name}
                    onSelectFilter={setActiveFilter}
                    beauty={beauty}
                    onBeautyChange={setBeauty}
                    previewUrl={isImage ? mediaUrl : undefined}
                  />
                )}
                {editTab === "music" && (
                  <MusicPanel
                    selectedTrack={selectedTrack}
                    onSelectTrack={setSelectedTrack}
                    onUploadAudio={handleAudioUpload}
                  />
                )}
                {editTab === "text" && (
                  <TextOverlayPanel overlays={textOverlays} onUpdate={setTextOverlays} />
                )}
                {editTab === "stickers" && (
                  <StickerPanel stickers={stickers} onUpdate={setStickers} />
                )}
                {editTab === "speed" && (
                  <SpeedControl speed={speed} onSpeedChange={setSpeed} />
                )}
                {editTab === "transitions" && (
                  <TransitionPanel transition={transition} onTransitionChange={setTransition} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Export */}
        {step === "export" && (
          <div className="flex flex-col lg:flex-row gap-6 py-4">
            <div className="flex-1 flex flex-col items-center gap-4">
              <VideoPreview
                src={mediaUrl}
                filterCSS={combinedFilter}
                isImage={isImage}
                speed={speed}
                textOverlays={textOverlays}
                stickers={stickers}
                transition={transition}
              />
            </div>

            <div className="lg:w-[400px] space-y-4">
              <ExportPanel onExport={handleExport} disabled={!mediaBlob} />

              {/* Summary */}
              <div className="panel space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  📋 Summary
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Type", value: isImage ? "Image → Video" : "Video" },
                    { label: "Filter", value: activeFilter.label },
                    { label: "Beauty", value: JSON.stringify(beauty) === JSON.stringify(DEFAULT_BEAUTY) ? "Default" : "Custom" },
                    { label: "Music", value: selectedTrack ? selectedTrack.title : "None" },
                    { label: "Speed", value: `${speed}x` },
                    { label: "Text overlays", value: textOverlays.length > 0 ? `${textOverlays.length} items` : "None" },
                    { label: "Stickers", value: stickers.length > 0 ? `${stickers.length} items` : "None" },
                    { label: "Transition", value: transition === "none" ? "None" : transition },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">{row.label}</span>
                      <span className="font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep("edit")} className="btn-secondary w-full text-sm">
                ← Back to Edit
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-4 py-3 text-center">
        <p className="text-xs text-[var(--text-secondary)]">
          🎬 Reels Creator — 100% browser-based video editor. No uploads. No servers. Your content stays yours.
        </p>
      </footer>
    </div>
  );
}
