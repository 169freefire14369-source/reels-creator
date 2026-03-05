"use client";
import { useState } from "react";

interface ExportPanelProps {
  onExport: (withWatermark: boolean, watermarkText?: string, watermarkPos?: string) => Promise<void>;
  disabled: boolean;
}

const WATERMARK_POSITIONS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
  { value: "center", label: "Center" },
];

export default function ExportPanel({ onExport, disabled }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [watermarkText, setWatermarkText] = useState("Made with Reels Creator");
  const [watermarkPos, setWatermarkPos] = useState("bottom-right");
  const [showWatermarkOptions, setShowWatermarkOptions] = useState(false);

  const handleExport = async (withWatermark: boolean) => {
    setExporting(true);
    setProgress(0);
    setProgressMsg("Starting...");
    try {
      await onExport(withWatermark, watermarkText, watermarkPos);
      setProgress(100);
      setProgressMsg("Download ready! ✅");
      setTimeout(() => { setProgressMsg(""); setProgress(0); }, 3000);
    } catch (err) {
      console.error(err);
      setProgressMsg("Export failed ❌");
      setTimeout(() => { setProgressMsg(""); setProgress(0); }, 3000);
    }
    setExporting(false);
  };

  return (
    <div className="panel space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        📥 Export & Download
      </h3>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleExport(false)}
          disabled={disabled || exporting}
          className="btn-primary text-sm py-4 flex flex-col items-center gap-1.5 rounded-xl"
        >
          <span className="text-2xl">⬇️</span>
          <span className="font-semibold">Clean Export</span>
          <span className="text-[10px] opacity-70">No watermark</span>
        </button>

        <button
          onClick={() => handleExport(true)}
          disabled={disabled || exporting}
          className="btn-secondary text-sm py-4 flex flex-col items-center gap-1.5 rounded-xl"
        >
          <span className="text-2xl">💧</span>
          <span className="font-semibold">Branded</span>
          <span className="text-[10px] opacity-70">With watermark</span>
        </button>
      </div>

      {/* Watermark customization */}
      <button
        onClick={() => setShowWatermarkOptions(!showWatermarkOptions)}
        className="text-xs text-[var(--accent)] hover:underline w-full text-left"
      >
        {showWatermarkOptions ? "▼" : "▶"} Customize watermark
      </button>

      {showWatermarkOptions && (
        <div className="space-y-3 p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <div>
            <label className="text-xs text-[var(--text-secondary)]">Watermark text</label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="w-full mt-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)]">Position</label>
            <div className="flex gap-1 mt-1 flex-wrap">
              {WATERMARK_POSITIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setWatermarkPos(p.value)}
                  className={`px-2 py-1 text-xs rounded ${
                    watermarkPos === p.value
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {exporting && (
        <div className="space-y-2">
          <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="spinner" />
            <span className="text-sm text-[var(--text-secondary)]">{progressMsg}</span>
          </div>
        </div>
      )}

      {!exporting && progressMsg && (
        <p className="text-sm text-center text-green-400">{progressMsg}</p>
      )}

      <div className="text-center space-y-1">
        <p className="text-xs text-[var(--text-secondary)]">
          🔒 All processing happens in your browser
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          No data is uploaded to any server
        </p>
      </div>
    </div>
  );
}
