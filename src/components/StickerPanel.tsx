"use client";
import { useState } from "react";

export interface StickerItem {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface StickerPanelProps {
  stickers: StickerItem[];
  onUpdate: (stickers: StickerItem[]) => void;
}

const STICKER_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: "🔥 Popular", emojis: ["🔥", "❤️", "😂", "💯", "✨", "🎉", "👑", "💪", "🙌", "😍", "🤩", "💀"] },
  { label: "😀 Faces", emojis: ["😊", "😎", "🥺", "😤", "🤯", "😱", "🥳", "😈", "👻", "🤖", "😇", "🤪"] },
  { label: "🎵 Music", emojis: ["🎵", "🎶", "🎤", "🎧", "🎸", "🥁", "🎹", "🎷", "🎺", "🪘", "🎻", "🎼"] },
  { label: "🌈 Nature", emojis: ["🌈", "🌟", "⭐", "🌙", "☀️", "🌊", "🍀", "🌸", "🦋", "🐝", "🌺", "🍄"] },
  { label: "💖 Love", emojis: ["💖", "💕", "💗", "💝", "💘", "💟", "♥️", "💜", "🧡", "💛", "💚", "💙"] },
  { label: "✋ Gestures", emojis: ["👍", "👎", "✌️", "🤞", "🤘", "🤟", "👏", "🙏", "💅", "🤳", "💃", "🕺"] },
  { label: "🎬 Media", emojis: ["📸", "🎬", "📱", "💻", "🎮", "🏆", "🎯", "🚀", "⚡", "💎", "🔔", "📢"] },
];

export default function StickerPanel({ stickers, onUpdate }: StickerPanelProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addSticker = (emoji: string) => {
    const newSticker: StickerItem = {
      id: `sticker-${Date.now()}`,
      emoji,
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      size: 48,
      rotation: 0,
    };
    onUpdate([...stickers, newSticker]);
    setEditingId(newSticker.id);
  };

  const updateSticker = (id: string, updates: Partial<StickerItem>) => {
    onUpdate(stickers.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSticker = (id: string) => {
    onUpdate(stickers.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const editing = stickers.find((s) => s.id === editingId);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-[var(--text-secondary)]">😎 Stickers</h4>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STICKER_CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(i)}
            className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
              activeCategory === i
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-6 gap-2">
        {STICKER_CATEGORIES[activeCategory].emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => addSticker(emoji)}
            className="w-10 h-10 flex items-center justify-center text-2xl rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border)] transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Active stickers */}
      {stickers.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-[var(--text-secondary)]">Active ({stickers.length})</span>
          <div className="flex gap-1 flex-wrap">
            {stickers.map((s) => (
              <div
                key={s.id}
                onClick={() => setEditingId(s.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer text-sm ${
                  editingId === s.id ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/30" : "bg-[var(--bg-tertiary)]"
                }`}
              >
                <span>{s.emoji}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeSticker(s.id); }}
                  className="text-xs text-red-400 hover:text-red-300 ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticker editor */}
      {editing && (
        <div className="space-y-2 p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <div className="text-center text-4xl mb-2">{editing.emoji}</div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] w-14">X Pos</span>
            <input type="range" min={0} max={100} value={editing.x}
              onChange={(e) => updateSticker(editing.id, { x: Number(e.target.value) })}
              className="flex-1" />
            <span className="text-xs w-8 text-right">{editing.x}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] w-14">Y Pos</span>
            <input type="range" min={0} max={100} value={editing.y}
              onChange={(e) => updateSticker(editing.id, { y: Number(e.target.value) })}
              className="flex-1" />
            <span className="text-xs w-8 text-right">{editing.y}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] w-14">Size</span>
            <input type="range" min={16} max={120} value={editing.size}
              onChange={(e) => updateSticker(editing.id, { size: Number(e.target.value) })}
              className="flex-1" />
            <span className="text-xs w-8 text-right">{editing.size}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] w-14">Rotate</span>
            <input type="range" min={-180} max={180} value={editing.rotation}
              onChange={(e) => updateSticker(editing.id, { rotation: Number(e.target.value) })}
              className="flex-1" />
            <span className="text-xs w-8 text-right">{editing.rotation}°</span>
          </div>
        </div>
      )}
    </div>
  );
}
