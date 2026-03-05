export interface FilterDef {
  name: string;
  label: string;
  css: string; // CSS filter string
}

export const FILTERS: FilterDef[] = [
  { name: "none", label: "Original", css: "none" },
  { name: "beauty", label: "Beauty", css: "brightness(1.05) contrast(0.95) saturate(1.1) blur(0.3px)" },
  { name: "warm", label: "Warm", css: "sepia(0.3) saturate(1.4) brightness(1.05)" },
  { name: "cool", label: "Cool", css: "saturate(0.8) brightness(1.05) hue-rotate(15deg)" },
  { name: "vintage", label: "Vintage", css: "sepia(0.5) contrast(1.1) brightness(0.9) saturate(0.8)" },
  { name: "bw", label: "B&W", css: "grayscale(1) contrast(1.1)" },
  { name: "vivid", label: "Vivid", css: "saturate(1.8) contrast(1.15) brightness(1.05)" },
  { name: "fade", label: "Fade", css: "saturate(0.6) brightness(1.1) contrast(0.9)" },
  { name: "dramatic", label: "Drama", css: "contrast(1.4) brightness(0.9) saturate(1.2)" },
  { name: "glow", label: "Glow", css: "brightness(1.15) contrast(0.9) saturate(1.1) blur(0.5px)" },
];

export interface BeautySettings {
  smooth: number;     // 0-100
  brightness: number; // 0-100 (50=normal)
  contrast: number;   // 0-100 (50=normal)
  saturation: number; // 0-100 (50=normal)
  warmth: number;     // 0-100 (50=normal)
}

export const DEFAULT_BEAUTY: BeautySettings = {
  smooth: 0,
  brightness: 50,
  contrast: 50,
  saturation: 50,
  warmth: 50,
};

export function beautyToCSS(b: BeautySettings): string {
  const blur = (b.smooth / 100) * 1.5;
  const brightness = 0.5 + (b.brightness / 100);
  const contrast = 0.5 + (b.contrast / 100);
  const saturation = 0.5 + (b.saturation / 100);
  const hue = (b.warmth - 50) * 0.6; // -30 to +30

  const parts: string[] = [];
  if (blur > 0) parts.push(`blur(${blur.toFixed(1)}px)`);
  parts.push(`brightness(${brightness.toFixed(2)})`);
  parts.push(`contrast(${contrast.toFixed(2)})`);
  parts.push(`saturate(${saturation.toFixed(2)})`);
  if (Math.abs(hue) > 0.5) parts.push(`hue-rotate(${hue.toFixed(1)}deg)`);

  return parts.join(" ");
}
