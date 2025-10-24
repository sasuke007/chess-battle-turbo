import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

const createGameSchema = z.object({
  userReferenceId: z.string().min(1, "User reference ID is required"),
  stakeAmount: z.number().positive("Stake amount must be greater than 0"),
  initialTimeSeconds: z.number().int().positive("Initial time must be greater than 0"),
  incrementSeconds: z.number().int().min(0, "Increment seconds must be 0 or greater"),
});

type CreateGameRequest = z.infer<typeof createGameSchema>;

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

async function generateUniqueInviteCode(maxAttempts: number = 10): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const inviteCode = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()
      .slice(0, 8);

    const existingGame = await prisma.game.findUnique({
      where: { inviteCode },
    });

    if (!existingGame) {
      return inviteCode;
    }
  }

  throw new ValidationError("Failed to generate unique invite code. Please try again.", 500);
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
  inviteCode: string
) {
  const amounts = calculateGameAmounts(request.stakeAmount);
  const expiresAt = calculateExpirationTime(1);

  return await prisma.$transaction(async (tx) => {
    // Create game
    const game = await tx.game.create({
      data: {
        creatorId: userId,
        stakeAmount: amounts.stakeAmountDecimal,
        totalPot: amounts.totalPot,
        platformFeePercentage: amounts.platformFeePercentage,
        platformFeeAmount: amounts.platformFeeAmount,
        initialTimeSeconds: request.initialTimeSeconds,
        incrementSeconds: request.incrementSeconds,
        creatorTimeRemaining: request.initialTimeSeconds,
        opponentTimeRemaining: request.initialTimeSeconds,
        inviteCode,
        expiresAt,
        status: "WAITING_FOR_OPPONENT",
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
      where: { userId },
      data: {
        lockedAmount: newLockedAmount,
      },
    });

    return { game, transaction, wallet: updatedWallet };
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
    // 1. Parse and validate request body using Zod schema
    const body = await request.json();
    const validatedData = createGameSchema.parse(body);

    // 2. Validate user and fetch with wallet
    const user = await validateAndFetchUser(validatedData.userReferenceId);

    // 3. Calculate amounts
    const amounts = calculateGameAmounts(validatedData.stakeAmount);

    // 4. Validate sufficient balance
    validateSufficientBalance(
      new Decimal(user.wallet!.balance),
      new Decimal(user.wallet!.lockedAmount),
      amounts.stakeAmountDecimal
    );

    // 5. Generate unique invite code
    const inviteCode = await generateUniqueInviteCode();

    // 6. Execute transaction
    const result = await createGameTransaction(
      user.id,
      user.name,
      new Decimal(user.wallet!.balance),
      new Decimal(user.wallet!.lockedAmount),
      validatedData,
      inviteCode
    );

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Game created successfully",
        data: {
          game: {
            referenceId: result.game.referenceId,
            inviteCode: result.game.inviteCode,
            stakeAmount: result.game.stakeAmount.toString(),
            totalPot: result.game.totalPot.toString(),
            platformFeeAmount: result.game.platformFeeAmount.toString(),
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
