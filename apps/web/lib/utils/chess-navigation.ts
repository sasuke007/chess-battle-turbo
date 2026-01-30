import { Chess, Move, Square } from "chess.js";

const DEFAULT_STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Compute the board position at a specific move index by replaying moves from starting FEN.
 *
 * @param startingFen - The FEN string of the starting position
 * @param moveHistory - Array of moves played in the game
 * @param moveIndex - The move index to compute position for:
 *   - null: returns null (caller should use live position)
 *   - 0: returns starting position
 *   - n: returns position after move n
 * @returns Chess instance at the specified position, or null if moveIndex is null
 */
export function computePositionAtMove(
  startingFen: string | undefined,
  moveHistory: Move[],
  moveIndex: number | null
): Chess | null {
  if (moveIndex === null) {
    return null;
  }

  const fen = startingFen || DEFAULT_STARTING_FEN;
  const tempGame = new Chess(fen);

  if (moveIndex === 0) {
    return tempGame;
  }

  // Replay moves up to the specified index
  const movesToReplay = Math.min(moveIndex, moveHistory.length);
  for (let i = 0; i < movesToReplay; i++) {
    const move = moveHistory[i];
    if (move) {
      try {
        tempGame.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        });
      } catch {
        // If a move fails, return position up to last successful move
        break;
      }
    }
  }

  return tempGame;
}

/**
 * Get the last move for highlighting based on the current viewing index.
 *
 * @param moveHistory - Array of moves played in the game
 * @param viewingMoveIndex - Current viewing index (null = live)
 * @returns The last move object with from/to, or null if no moves
 */
export function getLastMoveForDisplay(
  moveHistory: Move[],
  viewingMoveIndex: number | null
): { from: Square; to: Square } | null {
  if (moveHistory.length === 0) {
    return null;
  }

  // If viewing live or null, show last actual move
  const effectiveIndex = viewingMoveIndex === null
    ? moveHistory.length
    : viewingMoveIndex;

  if (effectiveIndex === 0) {
    return null;
  }

  const lastMove = moveHistory[effectiveIndex - 1];
  if (!lastMove) {
    return null;
  }

  return {
    from: lastMove.from,
    to: lastMove.to,
  };
}
