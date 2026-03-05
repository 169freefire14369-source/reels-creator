"use client";
import { FILTERS, type FilterDef, type BeautySettings, DEFAULT_BEAUTY } from "@/utils/filters";

interface FilterPanelProps {
  activeFilter: string;
  onSelectFilter: (f: FilterDef) => void;
  beauty: BeautySettings;
  onBeautyChange: (b: BeautySettings) => void;
  previewUrl?: string;
}

export default function FilterPanel({
  activeFilter,
  onSelectFilter,
  beauty,
  onBeautyChange,
  previewUrl,
}: FilterPanelProps) {
  const sliders: { key: keyof BeautySettings; label: string; icon: string }[] = [
    { key: "smooth", label: "Smooth", icon: "✨" },
    { key: "brightness", label: "Brightness", icon: "☀️" },
    { key: "contrast", label: "Contrast", icon: "◐" },
    { key: "saturation", label: "Saturation", icon: "🎨" },
    { key: "warmth", label: "Warmth", icon: "🔥" },
  ];

  return (
    <div className="panel space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        Filters
      </h3>

      {/* Preset filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.name}
            onClick={() => onSelectFilter(f)}
            className={`flex flex-col items-center gap-1 flex-shrink-0 ${
              activeFilter === f.name ? "opacity-100" : "opacity-60 hover:opacity-80"
            }`}
          >
            <div
              className={`filter-preview ${activeFilter === f.name ? "active" : ""}`}
              style={{
                background: previewUrl
                  ? `url(${previewUrl}) center/cover`
                  : "linear-gradient(135deg, #667eea, #764ba2)",
                filter: f.css !== "none" ? f.css : undefined,
              }}
            />
            <span className="text-[10px] text-[var(--text-secondary)]">{f.label}</span>
          </button>
        ))}
      </div>

      {/* Beauty sliders */}
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider pt-2">
        Beauty Adjustments
      </h3>

      <div className="space-y-3">
        {sliders.map(({ key, label, icon }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm w-5">{icon}</span>
            <span className="text-xs text-[var(--text-secondary)] w-20">{label}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={beauty[key]}
              onChange={(e) =>
                onBeautyChange({ ...beauty, [key]: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-xs text-[var(--text-secondary)] w-8 text-right">
              {beauty[key]}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onBeautyChange(DEFAULT_BEAUTY)}
        className="text-xs text-[var(--accent)] hover:underline"
      >
        Reset to default
      </button>
    </div>
  );
}
