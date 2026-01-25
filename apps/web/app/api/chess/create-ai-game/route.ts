import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Bot user constants - must match the seeded bot user
const BOT_USER_CODE = "CHESS_BOT_001";
const BOT_USER_EMAIL = "bot@chessbattle.local";

const createAIGameSchema = z.object({
  userReferenceId: z.string().min(1, "User reference ID is required"),
  initialTimeSeconds: z.number().int().positive("Initial time must be greater than 0"),
  incrementSeconds: z.number().int().min(0, "Increment seconds must be 0 or greater"),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  playerColor: z.enum(["white", "black", "random"]),
});

type CreateAIGameRequest = z.infer<typeof createAIGameSchema>;

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

async function validateAndFetchUser(userReferenceId: string) {
  const user = await prisma.user.findUnique({
    where: { referenceId: userReferenceId },
  });

  if (!user) {
    throw new ValidationError("User not found", 404);
  }

  if (!user.isActive) {
    throw new ValidationError("User account is not active", 400);
  }

  return user;
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

function resolvePlayerColor(playerColor: "white" | "black" | "random"): "white" | "black" {
  if (playerColor === "random") {
    return Math.random() < 0.5 ? "white" : "black";
  }
  return playerColor;
}

function calculateExpirationTime(hoursFromNow: number = 24): Date {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
}

// Default starting position FEN
const DEFAULT_STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validatedData = createAIGameSchema.parse(body);

    // 2. Validate user
    const user = await validateAndFetchUser(validatedData.userReferenceId);

    // 3. Get or create bot user
    const botUser = await getOrCreateBotUser();

    // 4. Resolve player color
    const resolvedPlayerColor = resolvePlayerColor(validatedData.playerColor);

    // 5. Determine creator and opponent based on player color
    // If player is white, they are creator. If player is black, bot is creator.
    // This ensures the WebSocket server assigns colors correctly
    const isPlayerCreator = resolvedPlayerColor === "white";
    const creatorId = isPlayerCreator ? user.id : botUser.id;
    const opponentId = isPlayerCreator ? botUser.id : user.id;

    // 6. Create game - immediately IN_PROGRESS since bot is always ready
    const game = await prisma.game.create({
      data: {
        creatorId,
        opponentId,
        stakeAmount: new Decimal(0),
        totalPot: new Decimal(0),
        platformFeePercentage: new Decimal(0),
        platformFeeAmount: new Decimal(0),
        startingFen: DEFAULT_STARTING_FEN,
        initialTimeSeconds: validatedData.initialTimeSeconds,
        incrementSeconds: validatedData.incrementSeconds,
        creatorTimeRemaining: validatedData.initialTimeSeconds,
        opponentTimeRemaining: validatedData.initialTimeSeconds,
        expiresAt: calculateExpirationTime(24),
        status: "IN_PROGRESS", // AI games start immediately
        startedAt: new Date(),
        gameData: {
          gameMode: "AI",
          difficulty: validatedData.difficulty,
          playerColor: resolvedPlayerColor,
          playerReferenceId: user.referenceId, // Track the human player
          botReferenceId: botUser.referenceId,
          botName: "Chess Bot",
        },
      },
    });

    // 7. Return success response
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
            difficulty: validatedData.difficulty,
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
