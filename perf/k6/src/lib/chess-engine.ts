/**
 * Chess engine wrapper for k6.
 *
 * Wraps chess.js to provide legal move generation from any FEN position.
 * chess.js is bundled into the k6 script via esbuild (goja runtime).
 */

import { Chess } from 'chess.js';

export { Chess };

export interface MoveChoice {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

/**
 * Pick a random legal move from the given FEN position.
 * Returns null if no legal moves exist (checkmate or stalemate).
 */
export function pickRandomMove(fen: string): MoveChoice | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });

  if (moves.length === 0) return null;

  const move = moves[Math.floor(Math.random() * moves.length)];
  const result: MoveChoice = { from: move.from, to: move.to };

  if (move.promotion) {
    result.promotion = move.promotion as MoveChoice['promotion'];
  }

  return result;
}

/**
 * Get whose turn it is from the FEN.
 * Returns "w" or "b".
 */
export function getTurn(fen: string): 'w' | 'b' {
  const chess = new Chess(fen);
  return chess.turn();
}

/**
 * Check if the position is game over (checkmate, stalemate, draw).
 */
export function isGameOver(fen: string): boolean {
  const chess = new Chess(fen);
  return chess.isGameOver();
}
