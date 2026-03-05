"use client";
import { useState } from "react";

export interface TextOverlayItem {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  animation: "none" | "fadeIn" | "slideUp" | "typewriter" | "bounce";
}

interface TextOverlayPanelProps {
  overlays: TextOverlayItem[];
  onUpdate: (overlays: TextOverlayItem[]) => void;
}

const FONT_OPTIONS = [
  "Arial", "Impact", "Georgia", "Courier New", "Comic Sans MS",
  "Verdana", "Trebuchet MS", "Palatino",
];

const COLOR_PRESETS = [
  "#FFFFFF", "#000000", "#FF2D55", "#FF9500", "#FFCC00",
  "#34C759", "#007AFF", "#AF52DE", "#FF375F", "#30D158",
];

const ANIMATIONS = [
  { value: "none", label: "None" },
  { value: "fadeIn", label: "Fade In" },
  { value: "slideUp", label: "Slide Up" },
  { value: "typewriter", label: "Typewriter" },
  { value: "bounce", label: "Bounce" },
];

export default function TextOverlayPanel({ overlays, onUpdate }: TextOverlayPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addText = () => {
    const newOverlay: TextOverlayItem = {
      id: `text-${Date.now()}`,
      text: "Your Text",
      x: 50,
      y: 50,
      fontSize: 36,
      color: "#FFFFFF",
      fontFamily: "Arial",
      animation: "none",
    };
    onUpdate([...overlays, newOverlay]);
    setEditingId(newOverlay.id);
  };

  const updateOverlay = (id: string, updates: Partial<TextOverlayItem>) => {
    onUpdate(overlays.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const removeOverlay = (id: string) => {
    onUpdate(overlays.filter((o) => o.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const editing = overlays.find((o) => o.id === editingId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--text-secondary)]">📝 Text Overlays</h4>
        <button onClick={addText} className="btn-primary text-xs px-3 py-1">
          + Add Text
        </button>
      </div>

      {/* List of overlays */}
      {overlays.map((o) => (
        <div
          key={o.id}
          onClick={() => setEditingId(o.id)}
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
            editingId === o.id ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/30" : "bg-[var(--bg-tertiary)]"
          }`}
        >
          <span
            className="text-sm font-medium truncate flex-1"
            style={{ color: o.color, fontFamily: o.fontFamily }}
          >
            {o.text}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); removeOverlay(o.id); }}
            className="text-xs text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Editor */}
      {editing && (
        <div className="space-y-3 p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <input
            type="text"
            value={editing.text}
            onChange={(e) => updateOverlay(editing.id, { text: e.target.value })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            placeholder="Enter text..."
          />

          {/* Font size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] w-12">Size</span>
            <input
              type="range"
              min={12}
              max={72}
              value={editing.fontSize}
              onChange={(e) => updateOverlay(editing.id, { fontSize: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs w-8 text-right">{editing.fontSize}</span>
          </div>

          {/* Position X */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] w-12">X Pos</span>
            <input
              type="range"
              min={0}
              max={100}
              value={editing.x}
              onChange={(e) => updateOverlay(editing.id, { x: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs w-8 text-right">{editing.x}%</span>
          </div>

          {/* Position Y */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] w-12">Y Pos</span>
            <input
              type="range"
              min={0}
              max={100}
              value={editing.y}
              onChange={(e) => updateOverlay(editing.id, { y: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs w-8 text-right">{editing.y}%</span>
          </div>

          {/* Colors */}
          <div>
            <span className="text-xs text-[var(--text-secondary)]">Color</span>
            <div className="flex gap-2 mt-1 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateOverlay(editing.id, { color: c })}
                  className={`w-7 h-7 rounded-full border-2 ${
                    editing.color === c ? "border-white" : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Font family */}
          <div>
            <span className="text-xs text-[var(--text-secondary)]">Font</span>
            <div className="flex gap-1 mt-1 flex-wrap">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => updateOverlay(editing.id, { fontFamily: f })}
                  className={`px-2 py-1 text-xs rounded ${
                    editing.fontFamily === f
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                  }`}
                  style={{ fontFamily: f }}
                >
                  {f.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Animation */}
          <div>
            <span className="text-xs text-[var(--text-secondary)]">Animation</span>
            <div className="flex gap-1 mt-1 flex-wrap">
              {ANIMATIONS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => updateOverlay(editing.id, { animation: a.value as any })}
                  className={`px-2 py-1 text-xs rounded ${
                    editing.animation === a.value
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {overlays.length === 0 && (
        <p className="text-xs text-[var(--text-secondary)] text-center py-2">
          Add text to your reel — titles, captions, hashtags
        </p>
      )}
    </div>
  );
}
