import { NextResponse } from "next/server";

const JIOSAAVN_BASE = "https://www.jiosaavn.com/api.php";

export async function GET() {
  try {
    // Fetch trending/popular songs from JioSaavn charts
    const url = `${JIOSAAVN_BASE}?__call=search.getResults&_format=json&q=trending+bollywood+hits&p=1&n=20`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const songs = data?.results || [];

    const results = songs.map((song: any) => ({
      id: song.id || `trending-${Date.now()}-${Math.random()}`,
      title: cleanText(song.title || song.song || "Unknown"),
      artist: cleanText(song.more_info?.singers || song.more_info?.primary_artists || "Unknown"),
      album: cleanText(song.more_info?.album || song.album || ""),
      duration: parseInt(song.more_info?.duration || song.duration || "0"),
      previewUrl: song.more_info?.vlink || "",
      thumbnail: song.image || "",
      language: song.language || "",
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("Trending fetch error:", err);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}

function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/<[^>]*>/g, "");
}
