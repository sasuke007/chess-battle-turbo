import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRandomChessPosition, getRandomPositionByLegend, incrementPositionPlayCount } from "@/lib/services/chess-position.service";

// Bot user constants - must match the seeded bot user
const BOT_USER_CODE = "CHESS_BOT_001";
const BOT_USER_EMAIL = "bot@chessbattle.local";

// Difficulty and playerColor are now optional - auto-determined
const createAIGameSchema = z.object({
  userReferenceId: z.string().min(1, "User reference ID is required"),
  initialTimeSeconds: z.number().int().positive("Initial time must be greater than 0"),
  incrementSeconds: z.number().int().min(0, "Increment seconds must be 0 or greater"),
  selectedLegend: z.string().optional(), // Optional legend ID to play their famous positions
});

type Difficulty = "easy" | "medium" | "hard" | "expert";

class ValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

async function validateAndFetchUserWithRating(userReferenceId: string) {
  const user = await prisma.user.findUnique({
    where: { referenceId: userReferenceId },
    include: {
      chessComProfile: {
        select: {
          bulletRating: true,
          blitzRating: true,
          rapidRating: true,
        },
      },
    },
  });

  if (!user) {
    throw new ValidationError("User not found", 404);
  }

  if (!user.isActive) {
    throw new ValidationError("User account is not active", 400);
  }

  return user;
}

/**
 * Get the appropriate rating based on time control
 * - Bullet: < 3 min (180 seconds)
 * - Blitz: 3-10 min (180-599 seconds)
 * - Rapid: 10+ min (600+ seconds)
 */
function getRatingForTimeControl(
  chessComProfile: { bulletRating: number | null; blitzRating: number | null; rapidRating: number | null } | null,
  initialTimeSeconds: number
): number | null {
  if (!chessComProfile) return null;

  if (initialTimeSeconds < 180) {
    // Bullet
    return chessComProfile.bulletRating;
  } else if (initialTimeSeconds < 600) {
    // Blitz
    return chessComProfile.blitzRating;
  } else {
    // Rapid
    return chessComProfile.rapidRating;
  }
}

/**
 * Determine bot difficulty based on user's rating
 * - No rating or < 1000: easy
 * - 1000-1400: medium
 * - 1400-1800: hard
 * - 1800+: expert
 */
function determineDifficulty(rating: number | null | undefined): Difficulty {
  if (!rating || rating < 1000) {
    return "easy";
  } else if (rating < 1400) {
    return "medium";
  } else if (rating < 1800) {
    return "hard";
  } else {
    return "expert";
  }
}

async function getOrCreateBotUser() {
  // Try to find existing bot user
  let botUser = await prisma.user.findUnique({
    where: { email: BOT_USER_EMAIL },
  });

  if (!botUser) {
    // Create bot user if it doesn't exist
    botUser = await prisma.user.create({
      data: {
        code: BOT_USER_CODE,
        googleId: "bot_system_user",
        email: BOT_USER_EMAIL,
        name: "Chess Bot",
        profilePictureUrl: null,
        isActive: true,
        onboarded: true,
        // Create wallet and stats for bot
        wallet: {
          create: {
            balance: 0,
            lockedAmount: 0,
          },
        },
        stats: {
          create: {
            totalGamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            gamesDrawn: 0,
            totalMoneyWon: 0,
            totalMoneyLost: 0,
            totalPlatformFeesPaid: 0,
            netProfit: 0,
            currentWinStreak: 0,
            longestWinStreak: 0,
          },
        },
      },
    });
    console.log("Created bot user:", botUser.referenceId);
  }

  return botUser;
}

function calculateExpirationTime(hoursFromNow: number = 24): Date {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
}

// Default starting position FEN (fallback if no positions in database)
const DEFAULT_STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validatedData = createAIGameSchema.parse(body);

    // 2. Validate user and fetch with rating
    const user = await validateAndFetchUserWithRating(validatedData.userReferenceId);

    // 3. Get or create bot user
    const botUser = await getOrCreateBotUser();

    // 4. Determine difficulty based on user's rating for the selected time control
    // If no rating available for the time format, default to medium
    const userRating = getRatingForTimeControl(
      user.chessComProfile,
      validatedData.initialTimeSeconds
    );
    const difficulty = userRating ? determineDifficulty(userRating) : "medium";

    const timeFormat = validatedData.initialTimeSeconds < 180 ? "bullet"
      : validatedData.initialTimeSeconds < 600 ? "blitz" : "rapid";

    // 5. Player color is always random
    const resolvedPlayerColor = Math.random() < 0.5 ? "white" : "black";

    console.log("[AI Game] Settings:", {
      timeFormat,
      userRating,
      difficulty,
      playerColor: resolvedPlayerColor,
    });

    // 6. Fetch chess position - from legend's games if selected, otherwise random
    const selectedLegend = validatedData.selectedLegend;
    let chessPosition;

    if (selectedLegend) {
      // Fetch a position from the selected legend's games
      chessPosition = await getRandomPositionByLegend(selectedLegend);
      console.log("[AI Game] Legend position fetched:", {
        legend: selectedLegend,
        found: !!chessPosition,
      });

      // Fallback to random position if no legend positions found
      if (!chessPosition) {
        chessPosition = await getRandomChessPosition();
        console.log("[AI Game] Fallback to random position:", {
          found: !!chessPosition,
        });
      }
    } else {
      // No legend selected - fetch random position
      chessPosition = await getRandomChessPosition();
      console.log("[AI Game] Random position fetched:", {
        found: !!chessPosition,
      });
    }

    const chessPositionId = chessPosition?.id ?? null;
    const startingFen = chessPosition?.fen ?? DEFAULT_STARTING_FEN;

    console.log("[AI Game] Starting position:", {
      positionId: chessPositionId?.toString(),
      fen: startingFen,
    });

    // 7. Determine creator and opponent based on player color
    // If player is white, they are creator. If player is black, bot is creator.
    // This ensures the WebSocket server assigns colors correctly
    const isPlayerCreator = resolvedPlayerColor === "white";
    const creatorId = isPlayerCreator ? user.id : botUser.id;
    const opponentId = isPlayerCreator ? botUser.id : user.id;

    // 8. Create game - immediately IN_PROGRESS since bot is always ready
    const game = await prisma.game.create({
      data: {
        creatorId,
        opponentId,
        stakeAmount: new Decimal(0),
        totalPot: new Decimal(0),
        platformFeePercentage: new Decimal(0),
        platformFeeAmount: new Decimal(0),
        chessPositionId,
        startingFen,
        initialTimeSeconds: validatedData.initialTimeSeconds,
        incrementSeconds: validatedData.incrementSeconds,
        creatorTimeRemaining: validatedData.initialTimeSeconds,
        opponentTimeRemaining: validatedData.initialTimeSeconds,
        expiresAt: calculateExpirationTime(24),
        status: "IN_PROGRESS", // AI games start immediately
        startedAt: new Date(),
        gameData: {
          gameMode: "AI",
          difficulty,
          playerColor: resolvedPlayerColor,
          playerReferenceId: user.referenceId, // Track the human player
          botReferenceId: botUser.referenceId,
          botName: "Chess Bot",
          // Legend info if playing a legend's position
          ...(selectedLegend && {
            selectedLegend,
            legendPosition: {
              whitePlayer: chessPosition?.whitePlayerName,
              blackPlayer: chessPosition?.blackPlayerName,
              tournament: chessPosition?.tournamentName,
            },
          }),
        },
      },
    });

    // 9. Increment position play count if a position was used
    if (chessPositionId) {
      await incrementPositionPlayCount(chessPositionId);
    }

    // 10. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "AI game created successfully",
        data: {
          game: {
            referenceId: game.referenceId,
            startingFen: game.startingFen,
            initialTimeSeconds: game.initialTimeSeconds,
            incrementSeconds: game.incrementSeconds,
            status: game.status,
            playerColor: resolvedPlayerColor,
            difficulty,
            createdAt: game.createdAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle custom validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          ...(error.details && { details: error.details }),
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    console.error("Error creating AI game:", error);
    return NextResponse.json(
      {
        error: "Failed to create AI game",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
