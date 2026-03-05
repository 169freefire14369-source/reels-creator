import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loaded = false;
let loadingPromise: Promise<FFmpeg> | null = null;

export type ProgressCallback = (progress: number, message: string) => void;

export async function getFFmpeg(onProgress?: ProgressCallback): Promise<FFmpeg> {
  if (ffmpeg && loaded) return ffmpeg;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    ffmpeg = new FFmpeg();

    ffmpeg.on("progress", ({ progress }) => {
      onProgress?.(Math.round(progress * 100), "Processing video...");
    });

    ffmpeg.on("log", ({ message }) => {
      console.log("[FFmpeg]", message);
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

    onProgress?.(0, "Loading video engine...");

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    loaded = true;
    onProgress?.(100, "Engine ready!");
    return ffmpeg;
  })();

  return loadingPromise;
}

// ─── Watermark ───────────────────────────────────────────────

export async function addTextWatermark(
  videoData: Uint8Array,
  text: string = "Made with Reels Creator",
  position: "bottom-left" | "bottom-right" | "top-left" | "top-right" | "center" = "bottom-right",
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  const ff = await getFFmpeg(onProgress);

  await ff.writeFile("input.mp4", videoData);

  // Position mapping
  const posMap: Record<string, string> = {
    "bottom-left": "x=20:y=H-th-20",
    "bottom-right": "x=W-tw-20:y=H-th-20",
    "top-left": "x=20:y=20",
    "top-right": "x=W-tw-20:y=20",
    "center": "x=(W-tw)/2:y=(H-th)/2",
  };

  const safeText = text.replace(/'/g, "'\\''");

  onProgress?.(10, "Adding watermark...");

  await ff.exec([
    "-i", "input.mp4",
    "-vf", `drawtext=text='${safeText}':fontsize=28:fontcolor=white@0.6:${posMap[position]}:shadowcolor=black@0.3:shadowx=2:shadowy=2`,
    "-codec:a", "copy",
    "-y", "output.mp4",
  ]);

  onProgress?.(90, "Finalizing...");
  const data = await ff.readFile("output.mp4");
  return data as Uint8Array;
}

// ─── Audio Merge ─────────────────────────────────────────────

export async function mergeVideoAudio(
  videoData: Uint8Array,
  audioUrl: string,
  audioVolume: number = 0.8,
  keepOriginalAudio: boolean = true,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  const ff = await getFFmpeg(onProgress);

  onProgress?.(5, "Loading files...");
  await ff.writeFile("video.mp4", videoData);

  // Fetch audio through proxy to avoid CORS
  const proxyUrl = `/api/music-proxy?url=${encodeURIComponent(audioUrl)}`;
  const audioResponse = await fetch(proxyUrl);
  const audioBuffer = await audioResponse.arrayBuffer();
  await ff.writeFile("audio.mp3", new Uint8Array(audioBuffer));

  onProgress?.(20, "Merging audio...");

  if (keepOriginalAudio) {
    // Mix both audio tracks
    await ff.exec([
      "-i", "video.mp4",
      "-i", "audio.mp3",
      "-filter_complex",
      `[0:a]volume=1.0[a0];[1:a]volume=${audioVolume}[a1];[a0][a1]amix=inputs=2:duration=first[aout]`,
      "-map", "0:v",
      "-map", "[aout]",
      "-c:v", "copy",
      "-c:a", "aac",
      "-shortest",
      "-y", "merged.mp4",
    ]);
  } else {
    // Replace audio entirely
    await ff.exec([
      "-i", "video.mp4",
      "-i", "audio.mp3",
      "-c:v", "copy",
      "-c:a", "aac",
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-af", `volume=${audioVolume}`,
      "-shortest",
      "-y", "merged.mp4",
    ]);
  }

  onProgress?.(90, "Finalizing...");
  const data = await ff.readFile("merged.mp4");
  return data as Uint8Array;
}

// ─── Speed Control ───────────────────────────────────────────

export async function changeSpeed(
  videoData: Uint8Array,
  speed: number, // 0.25 to 4.0
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  const ff = await getFFmpeg(onProgress);

  await ff.writeFile("input.mp4", videoData);

  onProgress?.(10, `Changing speed to ${speed}x...`);

  const videoFilter = `setpts=${(1 / speed).toFixed(4)}*PTS`;
  const audioFilter = `atempo=${speed > 2 ? 2 : speed < 0.5 ? 0.5 : speed}`;

  // For extreme speeds, chain atempo filters
  let audioChain = audioFilter;
  if (speed > 2) {
    audioChain = `atempo=2.0,atempo=${(speed / 2).toFixed(4)}`;
  } else if (speed < 0.5) {
    audioChain = `atempo=0.5,atempo=${(speed / 0.5).toFixed(4)}`;
  }

  await ff.exec([
    "-i", "input.mp4",
    "-filter:v", videoFilter,
    "-filter:a", audioChain,
    "-y", "output.mp4",
  ]);

  onProgress?.(90, "Done!");
  const data = await ff.readFile("output.mp4");
  return data as Uint8Array;
}

// ─── Trim Video ──────────────────────────────────────────────

export async function trimVideo(
  videoData: Uint8Array,
  startSec: number,
  endSec: number,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  const ff = await getFFmpeg(onProgress);

  await ff.writeFile("input.mp4", videoData);

  const duration = endSec - startSec;
  onProgress?.(10, `Trimming to ${duration.toFixed(1)}s...`);

  await ff.exec([
    "-i", "input.mp4",
    "-ss", startSec.toFixed(2),
    "-t", duration.toFixed(2),
    "-c", "copy",
    "-y", "trimmed.mp4",
  ]);

  const data = await ff.readFile("trimmed.mp4");
  return data as Uint8Array;
}

// ─── Image to Video ─────────────────────────────────────────

export async function imageToVideo(
  imageData: Uint8Array,
  durationSec: number = 5,
  ext: string = "jpg",
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  const ff = await getFFmpeg(onProgress);

  await ff.writeFile(`input.${ext}`, imageData);

  onProgress?.(10, "Converting image to video...");

  await ff.exec([
    "-loop", "1",
    "-i", `input.${ext}`,
    "-c:v", "libx264",
    "-t", durationSec.toString(),
    "-pix_fmt", "yuv420p",
    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
    "-r", "30",
    "-y", "output.mp4",
  ]);

  const data = await ff.readFile("output.mp4");
  return data as Uint8Array;
}

// ─── Apply CSS-like filter via FFmpeg ────────────────────────

export function cssFilterToFFmpeg(filterName: string): string {
  const map: Record<string, string> = {
    none: "",
    beauty: "eq=brightness=0.03:contrast=0.95:saturation=1.1,unsharp=3:3:-0.5:3:3:-0.5",
    warm: "colorbalance=rs=0.1:gs=0.05:bs=-0.1,eq=saturation=1.3:brightness=0.03",
    cool: "colorbalance=rs=-0.1:gs=0:bs=0.15,eq=saturation=0.85:brightness=0.03",
    vintage: "colorbalance=rs=0.15:gs=0.05:bs=-0.1,eq=contrast=1.1:brightness=-0.05:saturation=0.75",
    bw: "eq=saturation=0:contrast=1.1",
    vivid: "eq=saturation=1.8:contrast=1.15:brightness=0.03",
    fade: "eq=saturation=0.6:brightness=0.08:contrast=0.9",
    dramatic: "eq=contrast=1.4:brightness=-0.05:saturation=1.2",
    glow: "eq=brightness=0.1:contrast=0.9:saturation=1.1,unsharp=5:5:-1.0:5:5:-1.0",
  };
  return map[filterName] || "";
}

// ─── Full Export Pipeline ────────────────────────────────────

export interface ExportOptions {
  videoData: Uint8Array;
  filterName?: string;
  musicUrl?: string;
  musicVolume?: number;
  keepOriginalAudio?: boolean;
  speed?: number;
  trimStart?: number;
  trimEnd?: number;
  watermarkText?: string;
  watermarkPosition?: "bottom-left" | "bottom-right" | "top-left" | "top-right" | "center";
  textOverlays?: TextOverlay[];
}

export interface TextOverlay {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export async function exportVideo(
  opts: ExportOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const ff = await getFFmpeg(onProgress);
  let currentFile = "input.mp4";

  onProgress?.(5, "Starting export...");
  await ff.writeFile("input.mp4", opts.videoData);

  const steps: string[] = [];
  let stepIndex = 0;

  // Figure out total steps
  if (opts.trimStart !== undefined && opts.trimEnd !== undefined) steps.push("trim");
  if (opts.speed && opts.speed !== 1) steps.push("speed");
  if (opts.filterName && opts.filterName !== "none") steps.push("filter");
  if (opts.musicUrl) steps.push("music");
  if (opts.textOverlays?.length) steps.push("text");
  if (opts.watermarkText) steps.push("watermark");

  const progressPerStep = 80 / Math.max(steps.length, 1);

  // 1. Trim
  if (steps[stepIndex] === "trim") {
    const p = 10 + stepIndex * progressPerStep;
    onProgress?.(p, "Trimming...");
    const duration = (opts.trimEnd! - opts.trimStart!).toFixed(2);
    await ff.exec([
      "-i", currentFile,
      "-ss", opts.trimStart!.toFixed(2),
      "-t", duration,
      "-c", "copy",
      "-y", "step_trim.mp4",
    ]);
    currentFile = "step_trim.mp4";
    stepIndex++;
  }

  // 2. Speed
  if (steps[stepIndex] === "speed") {
    const p = 10 + stepIndex * progressPerStep;
    onProgress?.(p, `Adjusting speed (${opts.speed}x)...`);
    const vf = `setpts=${(1 / opts.speed!).toFixed(4)}*PTS`;
    const af = `atempo=${Math.min(2, Math.max(0.5, opts.speed!))}`;
    await ff.exec([
      "-i", currentFile,
      "-filter:v", vf,
      "-filter:a", af,
      "-y", "step_speed.mp4",
    ]);
    currentFile = "step_speed.mp4";
    stepIndex++;
  }

  // 3. Visual filter
  if (steps[stepIndex] === "filter") {
    const p = 10 + stepIndex * progressPerStep;
    onProgress?.(p, "Applying filter...");
    const ffFilter = cssFilterToFFmpeg(opts.filterName!);
    if (ffFilter) {
      await ff.exec([
        "-i", currentFile,
        "-vf", ffFilter,
        "-c:a", "copy",
        "-y", "step_filter.mp4",
      ]);
      currentFile = "step_filter.mp4";
    }
    stepIndex++;
  }

  // 4. Music
  if (steps[stepIndex] === "music") {
    const p = 10 + stepIndex * progressPerStep;
    onProgress?.(p, "Adding music...");
    try {
      const proxyUrl = `/api/music-proxy?url=${encodeURIComponent(opts.musicUrl!)}`;
      const audioRes = await fetch(proxyUrl);
      const audioBuffer = await audioRes.arrayBuffer();
      await ff.writeFile("music.mp3", new Uint8Array(audioBuffer));

      const vol = opts.musicVolume ?? 0.8;
      if (opts.keepOriginalAudio !== false) {
        await ff.exec([
          "-i", currentFile,
          "-i", "music.mp3",
          "-filter_complex",
          `[0:a]volume=1.0[a0];[1:a]volume=${vol}[a1];[a0][a1]amix=inputs=2:duration=first[aout]`,
          "-map", "0:v",
          "-map", "[aout]",
          "-c:v", "copy",
          "-c:a", "aac",
          "-shortest",
          "-y", "step_music.mp4",
        ]);
      } else {
        await ff.exec([
          "-i", currentFile,
          "-i", "music.mp3",
          "-c:v", "copy",
          "-map", "0:v:0",
          "-map", "1:a:0",
          "-c:a", "aac",
          "-shortest",
          "-y", "step_music.mp4",
        ]);
      }
      currentFile = "step_music.mp4";
    } catch (err) {
      console.error("Music merge failed:", err);
    }
    stepIndex++;
  }

  // 5. Text overlays
  if (steps[stepIndex] === "text") {
    const p = 10 + stepIndex * progressPerStep;
    onProgress?.(p, "Adding text...");
    const drawTexts = opts.textOverlays!.map((t) => {
      const safeText = t.text.replace(/'/g, "'\\''");
      return `drawtext=text='${safeText}':fontsize=${t.fontSize}:fontcolor=${t.color}:x=${t.x}:y=${t.y}:shadowcolor=black@0.4:shadowx=2:shadowy=2`;
    }).join(",");

    await ff.exec([
      "-i", currentFile,
      "-vf", drawTexts,
      "-c:a", "copy",
      "-y", "step_text.mp4",
    ]);
    currentFile = "step_text.mp4";
    stepIndex++;
  }

  // 6. Watermark
  if (steps[stepIndex] === "watermark") {
    const p = 10 + stepIndex * progressPerStep;
    onProgress?.(p, "Adding watermark...");
    const posMap: Record<string, string> = {
      "bottom-left": "x=20:y=H-th-20",
      "bottom-right": "x=W-tw-20:y=H-th-20",
      "top-left": "x=20:y=20",
      "top-right": "x=W-tw-20:y=20",
      "center": "x=(W-tw)/2:y=(H-th)/2",
    };
    const pos = posMap[opts.watermarkPosition || "bottom-right"];
    const safeText = opts.watermarkText!.replace(/'/g, "'\\''");

    await ff.exec([
      "-i", currentFile,
      "-vf", `drawtext=text='${safeText}':fontsize=28:fontcolor=white@0.6:${pos}:shadowcolor=black@0.3:shadowx=2:shadowy=2`,
      "-c:a", "copy",
      "-y", "step_watermark.mp4",
    ]);
    currentFile = "step_watermark.mp4";
    stepIndex++;
  }

  onProgress?.(95, "Preparing download...");

  // Read final file
  if (currentFile === "input.mp4") {
    // No processing was done, return original
    return new Blob([opts.videoData.slice().buffer], { type: "video/mp4" });
  }

  const finalData = await ff.readFile(currentFile) as Uint8Array;
  onProgress?.(100, "Done! ✅");

  return new Blob([finalData.slice().buffer], { type: "video/mp4" });
}
