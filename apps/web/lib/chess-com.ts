import type {
  ChessComProfileAPI,
  ChessComStatsAPI,
  ChessComPreviewData,
} from "./types/chess-com";

const USER_AGENT = "ChessBattle/1.0";

export async function fetchChessComProfile(
  handle: string
): Promise<ChessComProfileAPI> {
  const response = await fetch(
    `https://api.chess.com/pub/player/${handle}`,
    { headers: { "User-Agent": USER_AGENT } }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Chess.com user not found. Please check the username and try again."
      );
    }
    throw new Error(`Failed to fetch chess.com profile: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchChessComStats(
  handle: string
): Promise<ChessComStatsAPI> {
  const response = await fetch(
    `https://api.chess.com/pub/player/${handle}/stats`,
    { headers: { "User-Agent": USER_AGENT } }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Chess.com user not found. Please check the username and try again."
      );
    }
    throw new Error(`Failed to fetch chess.com stats: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchChessComPreview(
  handle: string
): Promise<ChessComPreviewData> {
  const [profile, stats] = await Promise.all([
    fetchChessComProfile(handle),
    fetchChessComStats(handle),
  ]);

  return {
    profile: {
      avatar: profile.avatar ?? null,
      name: profile.name || profile.username,
      username: profile.username,
      title: profile.title ?? null,
      country: extractCountryCode(profile.country ?? null),
      followers: profile.followers ?? null,
      isStreamer: profile.is_streamer ?? false,
    },
    ratings: {
      rapid: stats.chess_rapid?.last?.rating ?? null,
      blitz: stats.chess_blitz?.last?.rating ?? null,
      bullet: stats.chess_bullet?.last?.rating ?? null,
      daily: stats.chess_daily?.last?.rating ?? null,
    },
  };
}

/** Extracts country code from chess.com country URL like "https://api.chess.com/pub/country/US" */
export function extractCountryCode(countryUrl: string | null): string | null {
  if (!countryUrl) return null;
  const match = countryUrl.match(/\/country\/(\w+)$/);
  return match?.[1] ?? null;
}
