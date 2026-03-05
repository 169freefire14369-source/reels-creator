"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  previewUrl: string;
  duration: number;
  thumbnail?: string;
  language?: string;
}

interface MusicPanelProps {
  selectedTrack: MusicTrack | null;
  onSelectTrack: (track: MusicTrack | null) => void;
  onUploadAudio: (file: File) => void;
}

export default function MusicPanel({ selectedTrack, onSelectTrack, onUploadAudio }: MusicPanelProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<MusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tab, setTab] = useState<"trending" | "search" | "upload">("trending");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(80);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Fetch trending on mount
  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const res = await fetch("/api/music-trending");
      const data = await res.json();
      if (data.results?.length > 0) {
        setTrendingTracks(data.results);
      }
    } catch (err) {
      console.error("Failed to fetch trending:", err);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/music-search?q=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
    }
    setIsSearching(false);
  }, [query]);

  const togglePreview = useCallback((track: MusicTrack) => {
    if (!track.previewUrl) return;

    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(track.previewUrl);
    audio.volume = musicVolume / 100;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(track.id);
  }, [playingId, musicVolume]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const formatDuration = (sec: number) => {
    if (!sec) return "--:--";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const tracks = tab === "search" ? searchResults : trendingTracks;

  return (
    <div className="panel space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        🎵 Music
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
        {(["trending", "search", "upload"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === t
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            {t === "trending" ? "🔥 Trending" : t === "search" ? "🔍 Search" : "📂 Upload"}
          </button>
        ))}
      </div>

      {/* Search bar */}
      {tab === "search" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search songs, artists, albums..."
            className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)]"
          />
          <button onClick={handleSearch} className="btn-primary text-sm px-4" disabled={isSearching}>
            {isSearching ? <span className="spinner inline-block !w-4 !h-4" /> : "Search"}
          </button>
        </div>
      )}

      {/* Upload audio */}
      {tab === "upload" && (
        <div className="space-y-3">
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadAudio(f);
            }}
          />
          <button
            onClick={() => audioInputRef.current?.click()}
            className="btn-secondary w-full text-sm py-3"
          >
            📂 Choose Audio File (MP3, WAV, AAC)
          </button>
          <p className="text-xs text-[var(--text-secondary)] text-center">
            Upload your own music, voiceover, or sound effects
          </p>
        </div>
      )}

      {/* Track list */}
      {tab !== "upload" && (
        <div className="space-y-1 max-h-[350px] overflow-y-auto">
          {tracks.length === 0 && !isSearching && (
            <p className="text-sm text-[var(--text-secondary)] text-center py-8">
              {tab === "search" ? "Search for any song — Bollywood, Pop, EDM, anything!" : "Loading trending tracks..."}
            </p>
          )}
          {isSearching && (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          )}
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                selectedTrack?.id === track.id
                  ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/30"
                  : "hover:bg-[var(--bg-tertiary)]"
              }`}
            >
              {/* Thumbnail */}
              <div
                className="w-11 h-11 rounded-lg bg-[var(--bg-tertiary)] flex-shrink-0 overflow-hidden flex items-center justify-center"
                onClick={() => togglePreview(track)}
              >
                {track.thumbnail ? (
                  <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">🎵</span>
                )}
                {playingId === track.id && (
                  <div className="absolute w-11 h-11 bg-black/50 flex items-center justify-center rounded-lg">
                    <span className="text-xs">⏸</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0" onClick={() => onSelectTrack(selectedTrack?.id === track.id ? null : track)}>
                <p className="text-sm font-medium truncate">{track.title}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {track.artist}
                  {track.language ? ` · ${track.language}` : ""}
                </p>
              </div>

              {/* Duration & actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatDuration(track.duration)}
                </span>
                {track.previewUrl && (
                  <button
                    onClick={() => togglePreview(track)}
                    className="w-7 h-7 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs hover:bg-[var(--border)]"
                  >
                    {playingId === track.id ? "⏸" : "▶"}
                  </button>
                )}
                <button
                  onClick={() => onSelectTrack(selectedTrack?.id === track.id ? null : track)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    selectedTrack?.id === track.id
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-tertiary)] hover:bg-[var(--border)]"
                  }`}
                >
                  {selectedTrack?.id === track.id ? "✓" : "+"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected track + volume */}
      {selectedTrack && (
        <div className="space-y-2 bg-[var(--bg-tertiary)] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {selectedTrack.thumbnail ? (
                <img src={selectedTrack.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
              ) : (
                <span>🎵</span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{selectedTrack.title}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{selectedTrack.artist}</p>
              </div>
            </div>
            <button
              onClick={() => {
                audioRef.current?.pause();
                setPlayingId(null);
                onSelectTrack(null);
              }}
              className="text-xs text-[var(--accent)] hover:underline flex-shrink-0"
            >
              Remove
            </button>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs">🔊</span>
            <input
              type="range"
              min={0}
              max={100}
              value={musicVolume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMusicVolume(v);
                if (audioRef.current) audioRef.current.volume = v / 100;
              }}
              className="flex-1"
            />
            <span className="text-xs text-[var(--text-secondary)] w-8 text-right">{musicVolume}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
