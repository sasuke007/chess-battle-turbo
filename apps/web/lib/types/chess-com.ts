/** Raw response from GET https://api.chess.com/pub/player/{username} */
export interface ChessComProfileAPI {
  avatar?: string;
  player_id: number;
  "@id": string;
  url: string;
  name?: string;
  username: string;
  title?: string;
  followers?: number;
  country?: string;
  location?: string;
  last_online?: number;
  joined?: number;
  status: string;
  is_streamer?: boolean;
  verified?: boolean;
}

interface TimeControlStats {
  last?: { rating: number; date: number; rd: number };
  best?: { rating: number; date: number; game?: string };
  record?: { win: number; loss: number; draw: number };
}

/** Raw response from GET https://api.chess.com/pub/player/{username}/stats */
export interface ChessComStatsAPI {
  chess_rapid?: TimeControlStats;
  chess_blitz?: TimeControlStats;
  chess_bullet?: TimeControlStats;
  chess_daily?: TimeControlStats;
  fide?: number;
  tactics?: {
    highest?: { rating: number; date: number };
    lowest?: { rating: number; date: number };
  };
}

/** Transformed preview data for UI components */
export interface ChessComPreviewData {
  profile: {
    avatar: string | null;
    name: string;
    username: string;
    title: string | null;
    country: string | null;
    followers: number | null;
    isStreamer: boolean;
  };
  ratings: {
    rapid: number | null;
    blitz: number | null;
    bullet: number | null;
    daily: number | null;
  };
}
