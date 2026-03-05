"use client";
import { useCallback, useRef, useState } from "react";

interface UploadViewProps {
  onFile: (file: File) => void;
}

export default function UploadView({ onFile }: UploadViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const f = files[0];
      if (f.type.startsWith("video/") || f.type.startsWith("image/")) {
        onFile(f);
      } else {
        alert("Please upload a video or image file.");
      }
    },
    [onFile]
  );

  return (
    <div
      className={`video-container w-full max-w-[360px] flex flex-col items-center justify-center gap-6 border-2 border-dashed transition-colors cursor-pointer ${
        dragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)]"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="text-5xl">📁</div>
      <div className="text-center px-4">
        <p className="text-lg font-semibold mb-1">Upload Video or Image</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Drag & drop or tap to browse
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          Supports MP4, MOV, WebM, JPG, PNG
        </p>
      </div>

      <div className="flex gap-3">
        <span className="px-3 py-1 text-xs bg-[var(--bg-tertiary)] rounded-full">🎬 Video</span>
        <span className="px-3 py-1 text-xs bg-[var(--bg-tertiary)] rounded-full">🖼️ Image</span>
      </div>
    </div>
  );
}
