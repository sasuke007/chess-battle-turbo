import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

const joinGameSchema = z.object({
  gameReferenceId: z.string().min(1, "Game reference ID is required"),
  opponentReferenceId: z.string().min(1, "Opponent reference ID is required"),
});

type JoinGameRequest = z.infer<typeof joinGameSchema>;

async function validateAndFetchUser(userReferenceId: string) {
  const user = await prisma.user.findUnique({
    where: { referenceId: userReferenceId },
    include: { wallet: true },
  });

  if (!user) {
    throw new ValidationError("User not found", 404);
  }

  if (!user.isActive) {
    throw new ValidationError("User account is not active", 400);
  }

  if (!user.wallet) {
    throw new ValidationError("User wallet not found", 404);
  }

  return user;
}

function validateSufficientBalance(
  balance: Decimal,
  lockedAmount: Decimal,
  requiredAmount: Decimal
) {
  const availableBalance = balance.sub(lockedAmount);
  
  if (availableBalance.lt(requiredAmount)) {
    throw new ValidationError("Insufficient balance", 400, {
      required: requiredAmount.toNumber(),
      available: availableBalance.toNumber(),
      balance: balance.toString(),
      locked: lockedAmount.toString(),
    });
  }

  return availableBalance;
}

async function validateAndFetchGame(gameReferenceId: string) {
  const game = await prisma.game.findUnique({
    where: { referenceId: gameReferenceId },
    include: {
      creator: {
        select: {
          id: true,
          referenceId: true,
          name: true,
          profilePictureUrl: true,
          code: true,
        },
      },
    },
  });

  if (!game) {
    throw new ValidationError("Game not found", 404);
  }

  // Check if game is available to join
  if (game.status !== "WAITING_FOR_OPPONENT") {
    throw new ValidationError(
      `This game is not available to join. Current status: ${game.status}`,
      400,
      { currentStatus: game.status }
    );
  }

  // Check if game has expired
  const now = new Date();
  if (game.expiresAt < now) {
    throw new ValidationError(
      "This game invitation has expired",
      400,
      { expiresAt: game.expiresAt }
    );
  }

  return game;
}

async function joinGameTransaction(
  game: any,
  opponent: any,
  opponentWalletBalance: Decimal,
  opponentWalletLockedAmount: Decimal
) {
  const stakeAmount = new Decimal(game.stakeAmount);

  return await prisma.$transaction(async (tx) => {
    // 1. Update game - set opponent and change status to IN_PROGRESS
    const updatedGame = await tx.game.update({
      where: { id: game.id },
      data: {
        opponentId: opponent.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            referenceId: true,
            name: true,
            profilePictureUrl: true,
            code: true,
          },
        },
        opponent: {
          select: {
            referenceId: true,
            name: true,
            profilePictureUrl: true,
            code: true,
          },
        },
      },
    });

    // 2. Calculate new locked amount for opponent
    const newLockedAmount = opponentWalletLockedAmount.add(stakeAmount);
    const availableBalance = opponentWalletBalance.sub(opponentWalletLockedAmount);
    const balanceAfter = availableBalance.sub(stakeAmount);

    // 3. Create opponent transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId: opponent.id,
        gameId: game.id,
        type: "GAME_STAKE",
        amount: stakeAmount,
        balanceAfter,
        status: "COMPLETED",
        description: `Game stake of ${stakeAmount.toString()} by user ${opponent.name} for game ${game.referenceId}`,
      },
    });

    // 4. Update opponent wallet - lock the stake amount
    const updatedWallet = await tx.wallet.update({
      where: { userId: opponent.id },
      data: {
        lockedAmount: newLockedAmount,
      },
    });

    return { game: updatedGame, transaction, wallet: updatedWallet };
  });
}

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

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validatedData = joinGameSchema.parse(body);

    // 2. Fetch and validate game
    const game = await validateAndFetchGame(validatedData.gameReferenceId);

    // 3. Fetch and validate opponent
    const opponent = await validateAndFetchUser(validatedData.opponentReferenceId);

    // 4. Prevent self-play - check if opponent is the same as creator
    if (game.creatorId === opponent.id) {
      throw new ValidationError("You cannot join your own game", 400);
    }

    // 5. Validate opponent has sufficient balance
    const stakeAmount = new Decimal(game.stakeAmount);
    validateSufficientBalance(
      new Decimal(opponent.wallet!.balance),
      new Decimal(opponent.wallet!.lockedAmount),
      stakeAmount
    );

    // 6. Execute join game transaction
    const result = await joinGameTransaction(
      game,
      opponent,
      new Decimal(opponent.wallet!.balance),
      new Decimal(opponent.wallet!.lockedAmount)
    );

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined the game",
        data: {
          game: {
            referenceId: result.game.referenceId,
            status: result.game.status,
            stakeAmount: result.game.stakeAmount.toString(),
            totalPot: result.game.totalPot.toString(),
            platformFeeAmount: result.game.platformFeeAmount.toString(),
            initialTimeSeconds: result.game.initialTimeSeconds,
            incrementSeconds: result.game.incrementSeconds,
            timeControl: {
              format: `${result.game.initialTimeSeconds / 60}+${result.game.incrementSeconds}`,
            },
            creator: result.game.creator,
            opponent: result.game.opponent,
            startedAt: result.game.startedAt,
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
      { status: 200 }
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
    console.error("Error joining game:", error);
    return NextResponse.json(
      {
        error: "Failed to join game",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

