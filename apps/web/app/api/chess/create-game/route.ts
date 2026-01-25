import {NextRequest, NextResponse} from "next/server";
import {Decimal} from "@prisma/client/runtime/library";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {getRandomChessPosition, incrementPositionPlayCount} from "@/lib/services/chess-position.service";
import { ValidationError } from "@/lib/errors/validation-error";
import { validateAndFetchUser, validateSufficientBalance } from "@/lib/services/user-validation.service";

const createGameSchema = z.object({
  userReferenceId: z.string().min(1, "User reference ID is required"),
  stakeAmount: z.number().min(0, "Stake amount must be 0 or greater"),
  initialTimeSeconds: z.number().int().positive("Initial time must be greater than 0"),
  incrementSeconds: z.number().int().min(0, "Increment seconds must be 0 or greater"),
  gameMode: z.enum(["quick", "friend", "ai"]),
  playAsLegend: z.boolean(),
  selectedLegend: z.string().nullable(),
});

type CreateGameRequest = z.infer<typeof createGameSchema>;

function calculateGameAmounts(stakeAmount: number) {
  const stakeAmountDecimal = new Decimal(stakeAmount);
  const totalPot = stakeAmountDecimal.mul(2);
  const platformFeePercentage = new Decimal(10);
  const platformFeeAmount = totalPot.mul(platformFeePercentage).div(100);

  return {
    stakeAmountDecimal,
    totalPot,
    platformFeePercentage,
    platformFeeAmount,
  };
}

function calculateExpirationTime(hoursFromNow: number = 1): Date {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
}

async function createGameTransaction(
  userId: bigint,
  userName: string,
  walletBalance: Decimal,
  walletLockedAmount: Decimal,
  request: CreateGameRequest,
  chessPositionId: bigint | null,
  startingFen: string,
) {
  const amounts = calculateGameAmounts(request.stakeAmount);
  const expiresAt = calculateExpirationTime(1);

  return prisma.$transaction(async (tx) => {
    // Create game
    const game = await tx.game.create({
      data: {
        creatorId: userId,
        stakeAmount: amounts.stakeAmountDecimal,
        totalPot: amounts.totalPot,
        platformFeePercentage: amounts.platformFeePercentage,
        platformFeeAmount: amounts.platformFeeAmount,
        chessPositionId,
        startingFen,
        initialTimeSeconds: request.initialTimeSeconds,
        incrementSeconds: request.incrementSeconds,
        creatorTimeRemaining: request.initialTimeSeconds,
        opponentTimeRemaining: request.initialTimeSeconds,
        expiresAt,
        status: "WAITING_FOR_OPPONENT",
        gameData: {
          gameMode: request.gameMode,
          playAsLegend: request.playAsLegend,
          selectedLegend: request.selectedLegend,
        },
      },
    });

    // Calculate new locked amount and balance after
    const newLockedAmount = walletLockedAmount.add(amounts.stakeAmountDecimal);
    const availableBalance = walletBalance.sub(walletLockedAmount);
    const balanceAfter = availableBalance.sub(amounts.stakeAmountDecimal);

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        gameId: game.id,
        type: "GAME_STAKE",
        amount: amounts.stakeAmountDecimal,
        balanceAfter,
        status: "COMPLETED",
        description: `Game stake of ${request.stakeAmount} by user ${userName} for game ${game.referenceId}`,
      },
    });

    // Update wallet - lock the stake amount
    const updatedWallet = await tx.wallet.update({
      where: {userId},
      data: {
        lockedAmount: newLockedAmount,
      },
    });

    return {game, transaction, wallet: updatedWallet};
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body using Zod schema
    const body = await request.json();
    const validatedData = createGameSchema.parse(body);

    // 2. Validate user and fetch with wallet
    const user = await validateAndFetchUser(validatedData.userReferenceId);

    // 3. Calculate amounts
    const amounts = calculateGameAmounts(validatedData.stakeAmount);

    // 4. Fetch random chess position
    const chessPosition = await getRandomChessPosition();

    // Default starting position FEN if no chess position found
    const DEFAULT_STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    const chessPositionId = chessPosition?.id ?? null;
    const startingFen = chessPosition?.fen ?? DEFAULT_STARTING_FEN;

    // 5. Execute transaction
    const result = await createGameTransaction(
      user.id,
      user.name,
      new Decimal(user.wallet!.balance),
      new Decimal(user.wallet!.lockedAmount),
      validatedData,
      chessPositionId,
      startingFen,
    );

    // 6. Increment position play count if a position was used
    if (chessPositionId) {
      await incrementPositionPlayCount(chessPositionId);
    }

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Game created successfully",
        data: {
          game: {
            referenceId: result.game.referenceId,
            stakeAmount: result.game.stakeAmount.toString(),
            totalPot: result.game.totalPot.toString(),
            platformFeeAmount: result.game.platformFeeAmount.toString(),
            startingFen: result.game.startingFen,
            chessPositionId: result.game.chessPositionId?.toString() ?? null,
            initialTimeSeconds: result.game.initialTimeSeconds,
            incrementSeconds: result.game.incrementSeconds,
            status: result.game.status,
            expiresAt: result.game.expiresAt,
            createdAt: result.game.createdAt,
          },
          wallet: {
            balance: result.wallet.balance.toString(),
            lockedAmount: result.wallet.lockedAmount.toString(),
            availableBalance: new Decimal(result.wallet.balance)
              .sub(new Decimal(result.wallet.lockedAmount))
              .toString(),
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
    console.error("Error creating game:", error);
    return NextResponse.json(
      {
        error: "Failed to create game",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
