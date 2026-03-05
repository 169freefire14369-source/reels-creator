"use client";

export type TransitionType = "none" | "fadeIn" | "fadeOut" | "fadeInOut" | "slideLeft" | "slideRight" | "slideUp" | "zoomIn" | "zoomOut" | "blur";

interface TransitionPanelProps {
  transition: TransitionType;
  onTransitionChange: (t: TransitionType) => void;
}

const TRANSITIONS: { value: TransitionType; label: string; icon: string; desc: string }[] = [
  { value: "none", label: "None", icon: "⊘", desc: "No transition" },
  { value: "fadeIn", label: "Fade In", icon: "🌅", desc: "Smooth fade from black" },
  { value: "fadeOut", label: "Fade Out", icon: "🌑", desc: "Smooth fade to black" },
  { value: "fadeInOut", label: "Fade Both", icon: "🔄", desc: "Fade in + fade out" },
  { value: "slideLeft", label: "Slide Left", icon: "⬅️", desc: "Slide in from right" },
  { value: "slideRight", label: "Slide Right", icon: "➡️", desc: "Slide in from left" },
  { value: "slideUp", label: "Slide Up", icon: "⬆️", desc: "Slide in from bottom" },
  { value: "zoomIn", label: "Zoom In", icon: "🔍", desc: "Zoom into frame" },
  { value: "zoomOut", label: "Zoom Out", icon: "🔎", desc: "Zoom out of frame" },
  { value: "blur", label: "Blur", icon: "💫", desc: "Blur to clear" },
];

export default function TransitionPanel({ transition, onTransitionChange }: TransitionPanelProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-[var(--text-secondary)]">🎞️ Transitions</h4>

      <div className="grid grid-cols-2 gap-2">
        {TRANSITIONS.map((t) => (
          <button
            key={t.value}
            onClick={() => onTransitionChange(t.value)}
            className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
              transition === t.value
                ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/40"
                : "bg-[var(--bg-tertiary)] hover:bg-[var(--border)]"
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            <div>
              <p className="text-xs font-medium">{t.label}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
