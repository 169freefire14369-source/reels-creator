import { NextRequest, NextResponse } from "next/server";

// JioSaavn API (free, no key needed) — perfect for Indian + international music
const JIOSAAVN_API = "https://saavn.dev/api";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const limit = req.nextUrl.searchParams.get("limit") || "15";

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(
      `${JIOSAAVN_API}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) throw new Error(`JioSaavn API error: ${res.status}`);

    const data = await res.json();
    const songs = data?.data?.results || [];

    const results = songs.map((song: any) => ({
      id: song.id,
      title: song.name || "Unknown",
      artist: song.artists?.primary?.map((a: any) => a.name).join(", ") || song.artists?.all?.map((a: any) => a.name).join(", ") || "Unknown Artist",
      album: song.album?.name || "",
      duration: song.duration || 0,
      previewUrl: getBestQualityUrl(song.downloadUrl) || "",
      thumbnail: getBestImage(song.image) || "",
      year: song.year || "",
      language: song.language || "",
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("Music search error:", err);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}

function getBestQualityUrl(downloadUrl: any): string {
  if (!downloadUrl) return "";
  if (Array.isArray(downloadUrl)) {
    // Pick highest quality (last item usually 320kbps)
    const best = downloadUrl[downloadUrl.length - 1];
    return best?.url || best?.link || "";
  }
  if (typeof downloadUrl === "string") return downloadUrl;
  return "";
}

function getBestImage(image: any): string {
  if (!image) return "";
  if (Array.isArray(image)) {
    // Pick medium quality for thumbnails
    const mid = image.find((i: any) => i.quality === "150x150") || image[Math.min(1, image.length - 1)];
    return mid?.url || mid?.link || "";
  }
  if (typeof image === "string") return image;
  return "";
}
