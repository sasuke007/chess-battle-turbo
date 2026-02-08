import { prisma } from "../prisma";

/**
 * Fetches an opening by its referenceId
 */
export async function getOpeningByReferenceId(referenceId: string) {
  return prisma.opening.findUnique({
    where: { referenceId },
    select: {
      id: true,
      referenceId: true,
      eco: true,
      name: true,
      pgn: true,
      fen: true,
      sideToMove: true,
      moveCount: true,
    },
  });
}

/**
 * Determines what color the user should play based on the opening's sideToMove.
 * The user plays as the side that made the last move (opposite of sideToMove).
 * - sideToMove === "white" → black made the last move → user plays black
 * - sideToMove === "black" → white made the last move → user plays white
 */
export function getOpeningPlayerColor(sideToMove: string): "white" | "black" {
  return sideToMove === "white" ? "black" : "white";
}
