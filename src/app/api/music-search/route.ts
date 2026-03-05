import { NextRequest, NextResponse } from "next/server";

const JIOSAAVN_BASE = "https://www.jiosaavn.com/api.php";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Search songs via JioSaavn
    const searchUrl = `${JIOSAAVN_BASE}?__call=search.getResults&_format=json&q=${encodeURIComponent(query)}&p=1&n=${limit}`;
    
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const songs = data?.results || [];

    const results = await Promise.all(
      songs.slice(0, limit).map(async (song: any) => {
        // Get song details with download URL
        let previewUrl = "";
        try {
          if (song.id) {
            const detailUrl = `${JIOSAAVN_BASE}?__call=song.getDetails&cc=in&_marker=0%3F_marker%3D0&_format=json&pids=${song.id}`;
            const detailRes = await fetch(detailUrl, {
              headers: { "User-Agent": "Mozilla/5.0" },
            });
            const detailData = await detailRes.json();
            const songDetail = detailData?.songs?.[0] || detailData[song.id];
            if (songDetail) {
              // Get encrypted media URL and construct download link
              previewUrl = songDetail.media_preview_url || 
                           songDetail.preview_url ||
                           (songDetail.encrypted_media_url ? 
                             `${JIOSAAVN_BASE}?__call=song.generateAuthToken&url=${encodeURIComponent(songDetail.encrypted_media_url)}&bitrate=128&api_version=4&_format=json&ctx=wap6dot0` : 
                             "");
              
              // Try to get direct MP4/MP3 link
              if (songDetail.more_info?.encrypted_media_url) {
                previewUrl = songDetail.more_info.encrypted_media_url;
              }
              if (songDetail.more_info?.["320kbps"]) {
                previewUrl = songDetail.more_info.vlink || previewUrl;
              }
            }
          }
        } catch (e) {
          // Skip if detail fetch fails
        }

        // Fallback preview URL from vlink in search results
        if (!previewUrl && song.more_info?.vlink) {
          previewUrl = song.more_info.vlink;
        }

        return {
          id: song.id || `search-${Date.now()}-${Math.random()}`,
          title: cleanText(song.title || song.song || "Unknown"),
          artist: cleanText(song.more_info?.singers || song.more_info?.primary_artists || song.primary_artists || "Unknown"),
          album: cleanText(song.more_info?.album || song.album || ""),
          duration: parseInt(song.more_info?.duration || song.duration || "0"),
          previewUrl: previewUrl,
          thumbnail: song.image?.replace("150x150", "150x150") || song.image || "",
          language: song.language || song.more_info?.language || "",
        };
      })
    );

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("Music search error:", err);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}

// Also support autocomplete for suggestions
export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) return NextResponse.json({ suggestions: [] });

    const url = `${JIOSAAVN_BASE}?__call=autocomplete.get&_format=json&query=${encodeURIComponent(query)}&ctx=wap6dot0`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await res.json();

    const songs = (data?.songs?.data || []).map((song: any) => ({
      id: song.id,
      title: cleanText(song.title),
      artist: cleanText(song.more_info?.singers || song.more_info?.primary_artists || song.description || ""),
      thumbnail: song.image || "",
      type: song.type,
    }));

    const suggestions = songs.slice(0, 8);
    return NextResponse.json({ suggestions });
  } catch (err: any) {
    return NextResponse.json({ suggestions: [], error: err.message }, { status: 500 });
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
