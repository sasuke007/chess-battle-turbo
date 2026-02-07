import { useState, useMemo, useCallback, useEffect } from "react";
import { Chess, Move, Color, PieceSymbol, Square } from "chess.js";

export type PieceInfo = {
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null;

export type BoardState = PieceInfo[][];

export interface DivergenceInfo {
  plyIndex: number;
  userMove: Move | null;
  legendMove: Move | null;
  isDivergent: boolean;
}

interface UseAnalysisBoardProps {
  startingFen: string;
  userMoves: Move[];
  legendMoves: Move[];
  userColor: Color;
  legendPgn?: string | null;
  moveNumberStart?: number;
  isLegendMode?: boolean;
}

// Default FEN for standard chess starting position
const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Validate if a FEN string is properly formatted (has 6 space-delimited fields)
 */
function isValidFen(fen: string): boolean {
  if (!fen || typeof fen !== "string") return false;
  const parts = fen.trim().split(" ");
  return parts.length === 6;
}

interface UseAnalysisBoardReturn {
  // Current state
  plyIndex: number;
  maxPly: number;
  minPly: number;

  // Board states
  userBoard: BoardState;
  legendBoard: BoardState;

  // Navigation
  goToFirst: () => void;
  goBack: () => void;
  goForward: () => void;
  goToLast: () => void;
  goToPly: (ply: number) => void;

  // State flags
  isAtStart: boolean;
  isAtEnd: boolean;
  isBeforeGameStart: boolean;

  // Divergence info for current ply
  divergences: DivergenceInfo[];
  currentDivergence: DivergenceInfo | null;

  // Last moves for highlighting
  userLastMove: { from: Square; to: Square } | null;
  legendLastMove: { from: Square; to: Square } | null;

  // Board flip
  isFlipped: boolean;
  toggleFlip: () => void;

  // Legend full game
  gameStartPly: number;
  fullLegendMoves: Move[];
}

/**
 * Compute board state at a specific ply by replaying moves
 */
function computeBoardAtPly(
  startingFen: string,
  moves: Move[],
  plyIndex: number
): BoardState {
  // Use validated FEN or fallback to default
  const validFen = isValidFen(startingFen) ? startingFen : DEFAULT_FEN;
  const game = new Chess(validFen);

  // Replay moves up to plyIndex
  const movesToReplay = Math.min(plyIndex, moves.length);
  for (let i = 0; i < movesToReplay; i++) {
    const move = moves[i];
    if (move) {
      try {
        game.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        });
      } catch {
        break;
      }
    }
  }

  return game.board();
}

/**
 * Get last move for highlighting
 */
function getLastMove(
  moves: Move[],
  plyIndex: number
): { from: Square; to: Square } | null {
  if (plyIndex <= 0 || moves.length === 0) {
    return null;
  }

  const moveIndex = Math.min(plyIndex - 1, moves.length - 1);
  const move = moves[moveIndex];

  if (!move) {
    return null;
  }

  return { from: move.from, to: move.to };
}

export function useAnalysisBoard({
  startingFen,
  userMoves,
  legendMoves,
  userColor,
  legendPgn,
  moveNumberStart = 1,
  isLegendMode = false,
}: UseAnalysisBoardProps): UseAnalysisBoardReturn {
  // State
  const [plyIndex, setPlyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(userColor === "b");

  // Sync isFlipped when userColor changes (e.g. after data loads)
  useEffect(() => {
    setIsFlipped(userColor === "b");
  }, [userColor]);

  // Parse full legend game moves from PGN
  const fullLegendMoves = useMemo(() => {
    if (!legendPgn) return [];
    try {
      const game = new Chess();
      game.loadPgn(legendPgn);
      return game.history({ verbose: true });
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.error("Error parsing legend PGN");
      }
      return [];
    }
  }, [legendPgn]);

  // Calculate which ply in the full legend game corresponds to user's game start
  const gameStartPly = useMemo(() => {
    if (!startingFen) return 0;
    const sideToMove = startingFen.split(" ")[1];
    if (sideToMove === "b") {
      return (moveNumberStart - 1) * 2 + 1;
    }
    return (moveNumberStart - 1) * 2;
  }, [moveNumberStart, startingFen]);

  // Navigation bounds depend on legend mode
  const minPly = isLegendMode && fullLegendMoves.length > 0 ? -gameStartPly : 0;

  const userMaxPly = Math.max(userMoves.length, legendMoves.length);
  const maxPly = isLegendMode && fullLegendMoves.length > 0
    ? fullLegendMoves.length - gameStartPly
    : userMaxPly;

  // Clamp plyIndex when switching away from legend mode
  useEffect(() => {
    if (!isLegendMode) {
      if (plyIndex < 0) {
        setPlyIndex(0);
      } else if (plyIndex > userMaxPly) {
        setPlyIndex(userMaxPly);
      }
    }
  }, [isLegendMode, plyIndex, userMaxPly]);

  // Compute divergences (memoized)
  const divergences = useMemo(() => {
    const result: DivergenceInfo[] = [];
    const maxLength = Math.max(userMoves.length, legendMoves.length);

    for (let i = 0; i < maxLength; i++) {
      const userMove = userMoves[i] || null;
      const legendMove = legendMoves[i] || null;

      const isDivergent =
        userMove !== null &&
        legendMove !== null &&
        userMove.san !== legendMove.san;

      result.push({
        plyIndex: i + 1,
        userMove,
        legendMove,
        isDivergent,
      });
    }

    return result;
  }, [userMoves, legendMoves]);

  // Current divergence info
  const currentDivergence = useMemo(() => {
    if (plyIndex <= 0) return null;
    return divergences[plyIndex - 1] || null;
  }, [divergences, plyIndex]);

  // Compute board states (memoized)
  const userBoard = useMemo(() => {
    return computeBoardAtPly(startingFen, userMoves, Math.max(0, plyIndex));
  }, [startingFen, userMoves, plyIndex]);

  const legendBoard = useMemo(() => {
    if (isLegendMode && fullLegendMoves.length > 0) {
      const absolutePly = gameStartPly + plyIndex;
      return computeBoardAtPly(DEFAULT_FEN, fullLegendMoves, absolutePly);
    }
    return computeBoardAtPly(startingFen, legendMoves, plyIndex);
  }, [isLegendMode, fullLegendMoves, gameStartPly, startingFen, legendMoves, plyIndex]);

  // Last moves for highlighting
  const userLastMove = useMemo(() => {
    return getLastMove(userMoves, Math.max(0, plyIndex));
  }, [userMoves, plyIndex]);

  const legendLastMove = useMemo(() => {
    if (isLegendMode && fullLegendMoves.length > 0) {
      const absolutePly = gameStartPly + plyIndex;
      return getLastMove(fullLegendMoves, absolutePly);
    }
    return getLastMove(legendMoves, plyIndex);
  }, [isLegendMode, fullLegendMoves, gameStartPly, legendMoves, plyIndex]);

  // Navigation functions
  const goToFirst = useCallback(() => {
    setPlyIndex(minPly);
  }, [minPly]);

  const goBack = useCallback(() => {
    setPlyIndex((prev) => Math.max(minPly, prev - 1));
  }, [minPly]);

  const goForward = useCallback(() => {
    setPlyIndex((prev) => Math.min(maxPly, prev + 1));
  }, [maxPly]);

  const goToLast = useCallback(() => {
    setPlyIndex(maxPly);
  }, [maxPly]);

  const goToPly = useCallback(
    (ply: number) => {
      setPlyIndex(Math.max(minPly, Math.min(maxPly, ply)));
    },
    [minPly, maxPly]
  );

  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goBack();
          break;
        case "ArrowRight":
          e.preventDefault();
          goForward();
          break;
        case "ArrowUp":
        case "Home":
          e.preventDefault();
          goToFirst();
          break;
        case "ArrowDown":
        case "End":
          e.preventDefault();
          goToLast();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, goForward, goToFirst, goToLast]);

  // State flags
  const isAtStart = plyIndex <= minPly;
  const isAtEnd = plyIndex >= maxPly;
  const isBeforeGameStart = plyIndex < 0;

  return {
    plyIndex,
    maxPly,
    minPly,
    userBoard,
    legendBoard,
    goToFirst,
    goBack,
    goForward,
    goToLast,
    goToPly,
    isAtStart,
    isAtEnd,
    isBeforeGameStart,
    divergences,
    currentDivergence,
    userLastMove,
    legendLastMove,
    isFlipped,
    toggleFlip,
    gameStartPly,
    fullLegendMoves,
  };
}
