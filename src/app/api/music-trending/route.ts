import { NextRequest, NextResponse } from "next/server";

const JIOSAAVN_API = "https://saavn.dev/api";

export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("lang") || "hindi,english";

  try {
    // Get trending/chart songs
    const res = await fetch(
      `${JIOSAAVN_API}/search/songs?query=trending+hits+2024&limit=20`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    const songs = data?.data?.results || [];

    const results = songs.map((song: any) => ({
      id: song.id,
      title: song.name || "Unknown",
      artist: song.artists?.primary?.map((a: any) => a.name).join(", ") || "Unknown",
      album: song.album?.name || "",
      duration: song.duration || 0,
      previewUrl: getBestUrl(song.downloadUrl) || "",
      thumbnail: getBestImg(song.image) || "",
      language: song.language || "",
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("Trending fetch error:", err);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}

function getBestUrl(dl: any): string {
  if (!dl) return "";
  if (Array.isArray(dl)) return dl[dl.length - 1]?.url || dl[dl.length - 1]?.link || "";
  if (typeof dl === "string") return dl;
  return "";
}

function getBestImg(img: any): string {
  if (!img) return "";
  if (Array.isArray(img)) {
    const m = img.find((i: any) => i.quality === "150x150") || img[1] || img[0];
    return m?.url || m?.link || "";
  }
  if (typeof img === "string") return img;
  return "";
}
