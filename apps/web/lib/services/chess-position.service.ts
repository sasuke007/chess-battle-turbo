import { prisma } from '../prisma';

/**
 * Fetches a random active chess position from the database
 * @returns A random chess position or null if none found
 */
export async function getRandomChessPosition() {
  const count = await prisma.chessPosition.count({
    where: {
      isActive: true,
    },
  });

  if (count === 0) {
    return null;
  }

  // Generate a random skip value
  const skip = Math.floor(Math.random() * count);

  const position = await prisma.chessPosition.findFirst({
    where: {
      isActive: true,
    },
    skip,
    select: {
      id: true,
      referenceId: true,
      fen: true,
      sideToMove: true,
      whitePlayerName: true,
      blackPlayerName: true,
      tournamentName: true,
      positionType: true,
      sourceType: true,
    },
  });

  return position;
}

/**
 * Increments the timesPlayed counter for a chess position
 * @param positionId - The ID of the chess position
 */
export async function incrementPositionPlayCount(positionId: bigint) {
  await prisma.chessPosition.update({
    where: { id: positionId },
    data: {
      timesPlayed: {
        increment: 1,
      },
    },
  });
}
