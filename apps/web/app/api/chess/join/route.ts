import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors/validation-error";
import { validateAndFetchUser } from "@/lib/services/user-validation.service";
import * as Sentry from "@sentry/nextjs";

const joinGameSchema = z.object({
  gameReferenceId: z.string().min(1, "Game reference ID is required"),
  opponentReferenceId: z.string().min(1, "Opponent reference ID is required"),
});

type JoinGameRequest = z.infer<typeof joinGameSchema>;

interface GameWithCreator {
  id: bigint;
  referenceId: string;
  creatorId: bigint;
  stakeAmount: Decimal;
  status: string;
  expiresAt: Date;
  creator: {
    id: bigint;
    referenceId: string;
    name: string;
    profilePictureUrl: string | null;
    code: string;
  };
}

interface UserWithWallet {
  id: bigint;
  name: string;
  wallet: {
    balance: Decimal;
    lockedAmount: Decimal;
  } | null;
}

async function validateAndFetchGame(gameReferenceId: string): Promise<GameWithCreator> {
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
  game: GameWithCreator,
  opponent: UserWithWallet,
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

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validatedData = joinGameSchema.parse(body);
    console.log("validatedData", validatedData);

    Sentry.logger.info(`POST /api/chess/join - game ${validatedData.gameReferenceId}, opponent ${validatedData.opponentReferenceId}`);

    // 2. Fetch and validate game
    const game = await validateAndFetchGame(validatedData.gameReferenceId);

    // 3. Fetch and validate opponent
    const opponent = await validateAndFetchUser(validatedData.opponentReferenceId);

    // 4. Prevent self-play - check if opponent is the same as creator
    if (game.creatorId === opponent.id) {
      throw new ValidationError("You cannot join your own game", 400);
    }

    // 5. Execute join game transaction
    const result = await joinGameTransaction(
      game,
      opponent,
      new Decimal(opponent.wallet!.balance),
      new Decimal(opponent.wallet!.lockedAmount)
    );

    Sentry.logger.info(`Game joined: ${validatedData.gameReferenceId} by opponent ${validatedData.opponentReferenceId}`);

    // 6. Return success response
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
    Sentry.logger.error(`POST /api/chess/join failed: ${error instanceof Error ? error.message : "Unknown error"}`);
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

