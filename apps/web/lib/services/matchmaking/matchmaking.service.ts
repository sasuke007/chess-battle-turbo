import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import {
  CreateMatchRequestInput,
  CreateMatchRequestResult,
  MatchStatusResult,
  CancelMatchRequestResult,
  getTimeControlType,
  TimeControlType,
} from "./types";
import { selectPositionFromLegends, getDefaultFen } from "./position-selector";

const QUEUE_TIMEOUT_SECONDS = 60;
const TIGHT_RATING_RANGE = 200;
const WIDE_RATING_RANGE = 400;

/**
 * Creates a new matchmaking request and attempts immediate matching
 *
 * Flow:
 * 1. Search for an existing waiting player first
 * 2. If found → Match immediately (don't create queue entry for this user)
 * 3. If not found → Create queue entry and wait for polling
 */
export async function createMatchRequest(
  input: CreateMatchRequestInput
): Promise<CreateMatchRequestResult> {
  // 1. Validate user exists and get their rating
  const user = await prisma.user.findUnique({
    where: { referenceId: input.userReferenceId },
    include: { chessComProfile: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // 2. Check for existing active queue entry (prevent duplicate searches)
  const existingEntry = await prisma.matchmakingQueue.findFirst({
    where: {
      userId: user.id,
      status: "SEARCHING",
      expiresAt: { gt: new Date() },
    },
  });

  if (existingEntry) {
    throw new Error("User already has an active queue entry");
  }

  // 3. Determine time control type and get rating
  const timeControlType = getTimeControlType(input.initialTimeSeconds);
  const rating = getRatingForTimeControl(user.chessComProfile, timeControlType);

  // 4. TRY TO FIND A MATCH FIRST (before creating our entry)
  const immediateMatch = await tryFindMatch({
    userId: user.id,
    userName: user.name,
    userProfilePictureUrl: user.profilePictureUrl,
    rating,
    timeControlSeconds: input.initialTimeSeconds,
    incrementSeconds: input.incrementSeconds,
    legendReferenceId: input.legendReferenceId || null,
  });

  if (immediateMatch) {
    // Match found! Return immediately without creating a queue entry
    return {
      queueEntry: {
        referenceId: immediateMatch.queueEntryRef, // The opponent's queue entry ref
        status: "MATCHED",
        expiresAt: new Date(Date.now() + QUEUE_TIMEOUT_SECONDS * 1000),
      },
      immediateMatch: {
        gameReferenceId: immediateMatch.gameReferenceId,
        opponentName: immediateMatch.opponentName,
        opponentProfilePictureUrl: immediateMatch.opponentProfilePictureUrl,
      },
    };
  }

  // 5. No match found - create queue entry and wait for someone to match with us
  const expiresAt = new Date(Date.now() + QUEUE_TIMEOUT_SECONDS * 1000);

  const queueEntry = await prisma.matchmakingQueue.create({
    data: {
      userId: user.id,
      rating,
      timeControlType,
      legendReferenceId: input.legendReferenceId || null,
      timeControlSeconds: input.initialTimeSeconds,
      incrementSeconds: input.incrementSeconds,
      status: "SEARCHING",
      expiresAt,
    },
  });

  return {
    queueEntry: {
      referenceId: queueEntry.referenceId,
      status: queueEntry.status,
      expiresAt: queueEntry.expiresAt,
    },
  };
}

/**
 * Try to find and match with an existing waiting player
 * Uses FOR UPDATE to lock the candidate row and prevent race conditions
 */
async function tryFindMatch(params: {
  userId: bigint;
  userName: string;
  userProfilePictureUrl: string | null;
  rating: number | null;
  timeControlSeconds: number;
  incrementSeconds: number;
  legendReferenceId: string | null;
}): Promise<{
  gameReferenceId: string;
  queueEntryRef: string;
  opponentName: string;
  opponentProfilePictureUrl: string | null;
} | null> {
  // Use a transaction to atomically find and match
  const result = await prisma.$transaction(async (tx) => {
    // Find candidates with FOR UPDATE SKIP LOCKED
    // This skips any rows that are already being processed by another transaction
    const candidates = await tx.$queryRaw<Array<{
      id: bigint;
      referenceId: string;
      userId: bigint;
      rating: number | null;
      legendReferenceId: string | null;
    }>>`
      SELECT id, "referenceId", "userId", rating, "legendReferenceId"
      FROM matchmaking_queue
      WHERE status = 'SEARCHING'
        AND "userId" != ${params.userId}
        AND "timeControlSeconds" = ${params.timeControlSeconds}
        AND "incrementSeconds" = ${params.incrementSeconds}
        AND "expiresAt" > NOW()
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 10
    `;

    if (candidates.length === 0) {
      return null;
    }

    // Filter by rating
    const opponent = findOpponentByRating(candidates, params.rating);

    if (!opponent) {
      return null;
    }

    // Get opponent's user info
    const opponentUser = await tx.user.findUnique({
      where: { id: opponent.userId },
      select: { id: true, name: true, profilePictureUrl: true },
    });

    if (!opponentUser) {
      return null;
    }

    // Select position from either legend
    const position = await selectPositionFromLegends(
      params.legendReferenceId,
      opponent.legendReferenceId
    );

    // Random color assignment
    const newPlayerIsWhite = Math.random() < 0.5;
    const whiteUserId = newPlayerIsWhite ? params.userId : opponent.userId;
    const blackUserId = newPlayerIsWhite ? opponent.userId : params.userId;

    // Create the game
    const game = await tx.game.create({
      data: {
        creatorId: whiteUserId,
        opponentId: blackUserId,
        stakeAmount: new Decimal(0),
        totalPot: new Decimal(0),
        platformFeePercentage: new Decimal(10),
        platformFeeAmount: new Decimal(0),
        chessPositionId: position?.id || null,
        startingFen: position?.fen || getDefaultFen(),
        initialTimeSeconds: params.timeControlSeconds,
        incrementSeconds: params.incrementSeconds,
        creatorTimeRemaining: params.timeControlSeconds,
        opponentTimeRemaining: params.timeControlSeconds,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        status: "IN_PROGRESS",
        startedAt: new Date(),
        gameData: {
          gameMode: "quick",
          playAsLegend: !!params.legendReferenceId || !!opponent.legendReferenceId,
          player1Legend: params.legendReferenceId,
          player2Legend: opponent.legendReferenceId,
          matchedAt: new Date().toISOString(),
          positionInfo: position ? {
            whitePlayerName: position.whitePlayerName ?? null,
            blackPlayerName: position.blackPlayerName ?? null,
            tournamentName: position.tournamentName ?? null,
            whitePlayerImageUrl: position.whiteLegend?.profilePhotoUrl ?? null,
            blackPlayerImageUrl: position.blackLegend?.profilePhotoUrl ?? null,
          } : null,
        },
      },
    });

    // Update opponent's queue entry to MATCHED
    await tx.matchmakingQueue.update({
      where: { id: opponent.id },
      data: {
        status: "MATCHED",
        matchedAt: new Date(),
        matchedGameRef: game.referenceId,
      },
    });

    return {
      gameReferenceId: game.referenceId,
      queueEntryRef: opponent.referenceId,
      opponentName: opponentUser.name,
      opponentProfilePictureUrl: opponentUser.profilePictureUrl,
    };
  }, {
    timeout: 15000, // 15 second timeout
  });

  return result;
}

/**
 * Find an opponent within acceptable rating range
 */
function findOpponentByRating(
  candidates: Array<{ id: bigint; referenceId: string; userId: bigint; rating: number | null; legendReferenceId: string | null }>,
  myRating: number | null
): typeof candidates[0] | null {
  // Try tight match first (±200)
  for (const candidate of candidates) {
    if (myRating !== null && candidate.rating !== null) {
      if (Math.abs(myRating - candidate.rating) <= TIGHT_RATING_RANGE) {
        return candidate;
      }
    } else {
      // One or both unrated - match them
      return candidate;
    }
  }

  // Try wide match (±400)
  for (const candidate of candidates) {
    if (myRating !== null && candidate.rating !== null) {
      if (Math.abs(myRating - candidate.rating) <= WIDE_RATING_RANGE) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Gets the current status of a queue entry
 */
export async function getMatchStatus(
  referenceId: string
): Promise<MatchStatusResult> {
  const entry = await prisma.matchmakingQueue.findUnique({
    where: { referenceId },
    include: {
      user: {
        select: {
          id: true,
          referenceId: true,
          name: true,
          profilePictureUrl: true,
        },
      },
    },
  });

  if (!entry) {
    throw new Error("Queue entry not found");
  }

  const now = new Date();

  // Check if expired
  if (entry.status === "SEARCHING" && entry.expiresAt < now) {
    await prisma.matchmakingQueue.update({
      where: { id: entry.id },
      data: { status: "EXPIRED" },
    });

    return {
      status: "EXPIRED",
      matchedGameRef: null,
      timeRemaining: 0,
    };
  }

  // Calculate time remaining
  const timeRemaining = Math.max(
    0,
    Math.floor((entry.expiresAt.getTime() - now.getTime()) / 1000)
  );

  // If already matched, return the match info
  if (entry.status === "MATCHED" && entry.matchedGameRef) {
    const game = await prisma.game.findUnique({
      where: { referenceId: entry.matchedGameRef },
      include: {
        creator: { select: { id: true, name: true, profilePictureUrl: true } },
        opponent: { select: { id: true, name: true, profilePictureUrl: true } },
      },
    });

    let opponentInfo = undefined;
    if (game) {
      const isCreator = game.creatorId === entry.userId;
      const opponent = isCreator ? game.opponent : game.creator;
      if (opponent) {
        opponentInfo = {
          name: opponent.name,
          profilePictureUrl: opponent.profilePictureUrl,
        };
      }
    }

    return {
      status: "MATCHED",
      matchedGameRef: entry.matchedGameRef,
      timeRemaining,
      opponentInfo,
    };
  }

  // If cancelled or expired, return status
  if (entry.status !== "SEARCHING") {
    return {
      status: entry.status,
      matchedGameRef: entry.matchedGameRef,
      timeRemaining,
    };
  }

  // Still searching - just return current status
  // Note: We don't try to match here anymore. Matching only happens when a new player joins.
  return {
    status: "SEARCHING",
    matchedGameRef: null,
    timeRemaining,
  };
}

/**
 * Cancels a matchmaking request (idempotent)
 * Returns success for already-processed entries without throwing
 */
export async function cancelMatchRequest(
  queueReferenceId: string,
  userReferenceId: string
): Promise<CancelMatchRequestResult> {
  const user = await prisma.user.findUnique({
    where: { referenceId: userReferenceId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const entry = await prisma.matchmakingQueue.findUnique({
    where: { referenceId: queueReferenceId },
  });

  if (!entry) {
    // Entry not found - treat as already cancelled (idempotent)
    return { status: "already_cancelled" };
  }

  if (entry.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Handle terminal states idempotently
  if (entry.status === "CANCELLED") {
    return { status: "already_cancelled" };
  }

  if (entry.status === "EXPIRED") {
    return { status: "already_expired" };
  }

  if (entry.status === "MATCHED") {
    return {
      status: "already_matched",
      matchedGameRef: entry.matchedGameRef || undefined,
    };
  }

  // Entry is SEARCHING - cancel it
  await prisma.matchmakingQueue.update({
    where: { id: entry.id },
    data: { status: "CANCELLED" },
  });

  return { status: "cancelled" };
}

/**
 * Marks expired queue entries
 */
export async function cleanupExpiredEntries(): Promise<number> {
  const result = await prisma.matchmakingQueue.updateMany({
    where: {
      status: "SEARCHING",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  return result.count;
}

/**
 * Gets the rating from ChessComProfile based on time control type
 */
function getRatingForTimeControl(
  profile: {
    bulletRating: number | null;
    blitzRating: number | null;
    rapidRating: number | null;
    dailyRating: number | null;
  } | null,
  timeControlType: TimeControlType
): number | null {
  if (!profile) return null;

  switch (timeControlType) {
    case "bullet":
      return profile.bulletRating;
    case "blitz":
      return profile.blitzRating;
    case "rapid":
      return profile.rapidRating;
    case "daily":
      return profile.dailyRating;
    default:
      return null;
  }
}
