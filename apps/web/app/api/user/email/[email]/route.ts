import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../../../../lib/prisma";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    // 1. Get email from params
    const { email } = await params;

    if (!email) {
      throw new ValidationError("User email is required", 400);
    }

    // 2. Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format", 400);
    }

    // 3. Fetch user with wallet and stats
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        wallet: true,
        stats: true,
      },
    });

    // 4. Validate user exists
    if (!user) {
      throw new ValidationError("User not found", 404);
    }

    // 5. Check if user is active
    if (!user.isActive) {
      throw new ValidationError("User account is not active", 400);
    }

    // 6. Calculate available balance
    const balance = user.wallet ? new Decimal(user.wallet.balance) : new Decimal(0);
    const lockedAmount = user.wallet ? new Decimal(user.wallet.lockedAmount) : new Decimal(0);
    const availableBalance = balance.sub(lockedAmount);

    // 7. Calculate win rate if stats exist
    const winRate = user.stats && user.stats.totalGamesPlayed > 0
      ? ((user.stats.gamesWon / user.stats.totalGamesPlayed) * 100).toFixed(2)
      : "0.00";

    // 8. Return user details
    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            referenceId: user.referenceId,
            code: user.code,
            name: user.name,
            email: user.email,
            profilePictureUrl: user.profilePictureUrl,
            dateOfBirth: user.dateOfBirth,
            isActive: user.isActive,
            createdAt: user.createdAt,
          },
          wallet: user.wallet
            ? {
                referenceId: user.wallet.referenceId,
                balance: user.wallet.balance.toString(),
                lockedAmount: user.wallet.lockedAmount.toString(),
                availableBalance: availableBalance.toString(),
                updatedAt: user.wallet.updatedAt,
              }
            : null,
          stats: user.stats
            ? {
                referenceId: user.stats.referenceId,
                totalGamesPlayed: user.stats.totalGamesPlayed,
                gamesWon: user.stats.gamesWon,
                gamesLost: user.stats.gamesLost,
                gamesDrawn: user.stats.gamesDrawn,
                winRate: `${winRate}%`,
                totalMoneyWon: user.stats.totalMoneyWon.toString(),
                totalMoneyLost: user.stats.totalMoneyLost.toString(),
                netProfit: user.stats.netProfit.toString(),
                currentWinStreak: user.stats.currentWinStreak,
                longestWinStreak: user.stats.longestWinStreak,
                averageGameDuration: user.stats.averageGameDuration,
                lastPlayedAt: user.stats.lastPlayedAt,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
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
    console.error("Error fetching user by email:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

