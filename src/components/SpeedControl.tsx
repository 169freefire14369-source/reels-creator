"use client";

interface SpeedControlProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
}

const SPEED_PRESETS = [
  { value: 0.25, label: "0.25x", icon: "🐌" },
  { value: 0.5, label: "0.5x", icon: "🐢" },
  { value: 0.75, label: "0.75x", icon: "🚶" },
  { value: 1, label: "1x", icon: "▶️" },
  { value: 1.5, label: "1.5x", icon: "🏃" },
  { value: 2, label: "2x", icon: "⚡" },
  { value: 3, label: "3x", icon: "🚀" },
];

export default function SpeedControl({ speed, onSpeedChange }: SpeedControlProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-[var(--text-secondary)]">⚡ Speed Control</h4>

      <div className="flex gap-1 flex-wrap">
        {SPEED_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onSpeedChange(preset.value)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              speed === preset.value
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            {preset.icon} {preset.label}
          </button>
        ))}
      </div>

      {/* Custom slider */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-secondary)]">Custom</span>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.25}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm font-mono w-12 text-right">{speed}x</span>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        {speed < 1 ? "🎬 Slow motion — dramatic effect" :
         speed === 1 ? "▶️ Normal speed" :
         speed <= 2 ? "⚡ Fast — energetic vibe" :
         "🚀 Super fast — timelapse effect"}
      </p>
    </div>
  );
}
