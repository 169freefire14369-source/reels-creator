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

interface Suggestion {
  id: string;
  title: string;
  artist: string;
  thumbnail?: string;
}

interface MusicPanelProps {
  selectedTrack: MusicTrack | null;
  onSelectTrack: (track: MusicTrack | null) => void;
  onUploadAudio: (file: File) => void;
}

export default function MusicPanel({ selectedTrack, onSelectTrack, onUploadAudio }: MusicPanelProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<MusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [tab, setTab] = useState<"trending" | "search" | "upload">("trending");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(80);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const suggestTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch trending on mount
  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const res = await fetch("/api/music-trending");
      const data = await res.json();
      if (data.results?.length > 0) {
        setTrendingTracks(data.results);
      }
    } catch (err) {
      console.error("Failed to fetch trending:", err);
    }
    setLoadingTrending(false);
  };

  // Auto-suggest as user types
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch("/api/music-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Suggest failed:", err);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    // Debounce suggestions
    if (suggestTimeout.current) clearTimeout(suggestTimeout.current);
    suggestTimeout.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setIsSearching(true);
    setShowSuggestions(false);
    try {
      const res = await fetch(`/api/music-search?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
    }
    setIsSearching(false);
  }, [query]);

  const handleSuggestionClick = (s: Suggestion) => {
    setQuery(s.title);
    setShowSuggestions(false);
    handleSearch(s.title);
  };

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

  const TrackItem = ({ track }: { track: MusicTrack }) => (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
        selectedTrack?.id === track.id
          ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/30"
          : "hover:bg-[var(--bg-tertiary)]"
      }`}
    >
      {/* Thumbnail */}
      <div
        className="w-11 h-11 rounded-lg bg-[var(--bg-tertiary)] flex-shrink-0 overflow-hidden flex items-center justify-center relative"
        onClick={() => togglePreview(track)}
      >
        {track.thumbnail ? (
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <span className="text-lg">🎵</span>
        )}
        {playingId === track.id && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
  );

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
            onClick={() => { setTab(t); setShowSuggestions(false); }}
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
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search songs, artists, albums..."
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)]"
            />
            <button onClick={() => handleSearch()} className="btn-primary text-sm px-4" disabled={isSearching}>
              {isSearching ? <span className="spinner inline-block !w-4 !h-4" /> : "Search"}
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-xl max-h-[250px] overflow-y-auto">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSuggestionClick(s)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-tertiary)] cursor-pointer"
                >
                  {s.thumbnail ? (
                    <img src={s.thumbnail} alt="" className="w-8 h-8 rounded object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded flex items-center justify-center text-sm">🎵</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm truncate">{s.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{s.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          {tracks.length === 0 && !isSearching && !loadingTrending && (
            <p className="text-sm text-[var(--text-secondary)] text-center py-8">
              {tab === "search"
                ? "Search for any song — Bollywood, Pop, EDM, Punjabi, anything!"
                : "Could not load trending tracks. Try searching instead!"}
            </p>
          )}
          {(isSearching || (tab === "trending" && loadingTrending)) && (
            <div className="flex flex-col items-center gap-2 py-8">
              <div className="spinner" />
              <span className="text-xs text-[var(--text-secondary)]">
                {isSearching ? "Searching..." : "Loading trending..."}
              </span>
            </div>
          )}
          {tracks.map((track) => (
            <TrackItem key={track.id} track={track} />
          ))}
        </div>
      )}

      {/* Selected track + volume */}
      {selectedTrack && (
        <div className="space-y-2 bg-[var(--bg-tertiary)] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {selectedTrack.thumbnail ? (
                <img src={selectedTrack.thumbnail} alt="" className="w-8 h-8 rounded object-cover" crossOrigin="anonymous" />
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
