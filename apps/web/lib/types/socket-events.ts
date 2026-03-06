import { Color, Square } from "chess.js";

// ============================================
// PLAYER TYPES
// ============================================

export interface Player {
  userReferenceId?: string;
  name: string;
  profilePictureUrl?: string | null;
  code?: string;
}

// ============================================
// SERVER → CLIENT EVENT PAYLOADS
// ============================================

export interface GameStartedPayload {
  gameReferenceId: string;
  yourColor?: Color;
  fen: string;
  whiteTime: number;
  blackTime: number;
  whitePlayer: Player;
  blackPlayer: Player;
  isAIGame?: boolean;
  difficulty?: "easy" | "medium" | "hard" | "expert";
  positionInfo?: {
    whitePlayerName: string | null;
    blackPlayerName: string | null;
    tournamentName?: string | null;
    whitePlayerImageUrl?: string | null;
    blackPlayerImageUrl?: string | null;
    openingName?: string | null;
    openingEco?: string | null;
  };
}

export interface MoveMadePayload {
  from: Square;
  to: Square;
  san: string;
  fen: string;
  whiteTime: number;
  blackTime: number;
  turn: Color;
  promotion?: string;
}

export interface MoveErrorPayload {
  message: string;
  fen?: string;
}

export interface ClockUpdatePayload {
  whiteTime: number;
  blackTime: number;
}

export type GameResult = "CREATOR_WON" | "OPPONENT_WON" | "DRAW" | "CREATOR_TIMEOUT" | "OPPONENT_TIMEOUT";
export type GameEndMethod = "checkmate" | "timeout" | "resignation" | "draw_agreement" | "stalemate" | "insufficient_material";

export interface GameOverPayload {
  result: GameResult;
  winner: Color | null;
  method: GameEndMethod;
  fen: string;
  whiteTime: number;
  blackTime: number;
}

export interface ErrorPayload {
  message: string;
}

// ============================================
// CLIENT → SERVER EVENT PAYLOADS
// ============================================

export interface JoinGamePayload {
  gameReferenceId: string;
  userReferenceId: string;
}

export interface MakeMovePayload {
  gameReferenceId: string;
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
}

// ============================================
// ANALYSIS PHASE TYPES
// ============================================

export interface AnalysisPhaseStartedPayload {
  gameReferenceId: string;
  analysisTimeSeconds: number;
  yourColor?: Color;
  fen: string;
  whiteTime: number;
  blackTime: number;
  whitePlayer: Player;
  blackPlayer: Player;
  isAIGame?: boolean;
  difficulty?: "easy" | "medium" | "hard" | "expert";
  positionInfo?: {
    whitePlayerName: string | null;
    blackPlayerName: string | null;
    tournamentName?: string | null;
    whitePlayerImageUrl?: string | null;
    blackPlayerImageUrl?: string | null;
    openingName?: string | null;
    openingEco?: string | null;
  };
}

export interface AnalysisTickPayload {
  remainingSeconds: number;
  totalSeconds: number;
}

// ============================================
// SPECTATOR TYPES
// ============================================

export interface SpectatorStatePayload {
  gameReferenceId: string;
  fen: string;
  whiteTime: number;
  blackTime: number;
  whitePlayer: Player;
  blackPlayer: Player;
  moveHistory: Array<{ from: string; to: string; san: string; promotion?: string }>;
  startingFen: string;
  gameStarted: boolean;
  isAnalysisPhase: boolean;
  analysisRemainingSeconds?: number;
  analysisTotalSeconds?: number;
  spectatorCount: number;
  positionInfo?: any;
  gameOver?: boolean;
  gameOverPayload?: GameOverPayload;
}

export interface SpectatorCountPayload {
  count: number;
}
