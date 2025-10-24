import { NextRequest, NextResponse } from "next/server";
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
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    // 1. Get invite code from params
    const { inviteCode } = await params;

    if (!inviteCode) {
      throw new ValidationError("Invite code is required", 400);
    }

    // 2. Fetch game with creator details
    const game = await prisma.game.findUnique({
      where: { inviteCode },
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

    // 3. Validate game exists
    if (!game) {
      throw new ValidationError("Game not found", 404);
    }

    // 4. Check if game is expired
    const now = new Date();
    if (game.expiresAt < now && game.status === "WAITING_FOR_OPPONENT") {
      throw new ValidationError(
        "This game invitation has expired",
        400,
        { expiresAt: game.expiresAt }
      );
    }

    // 5. Check if game is already completed or cancelled
    if (game.status === "COMPLETED" || game.status === "CANCELLED") {
      throw new ValidationError(
        `This game has already been ${game.status.toLowerCase()}`,
        400,
        { status: game.status }
      );
    }

    // 6. Return game details
    return NextResponse.json(
      {
        success: true,
        data: {
          referenceId: game.referenceId,
          inviteCode: game.inviteCode,
          status: game.status,
          stakeAmount: game.stakeAmount.toString(),
          totalPot: game.totalPot.toString(),
          platformFeePercentage: game.platformFeePercentage.toString(),
          platformFeeAmount: game.platformFeeAmount.toString(),
          timeControl: {
            initialTimeSeconds: game.initialTimeSeconds,
            incrementSeconds: game.incrementSeconds,
            format: `${game.initialTimeSeconds / 60}+${game.incrementSeconds}`,
          },
          creator: {
            referenceId: game.creator.referenceId,
            name: game.creator.name,
            profilePictureUrl: game.creator.profilePictureUrl,
            code: game.creator.code,
          },
          opponent: game.opponent
            ? {
                referenceId: game.opponent.referenceId,
                name: game.opponent.name,
                profilePictureUrl: game.opponent.profilePictureUrl,
                code: game.opponent.code,
              }
            : null,
          result: game.result,
          expiresAt: game.expiresAt,
          startedAt: game.startedAt,
          completedAt: game.completedAt,
          createdAt: game.createdAt,
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
    console.error("Error fetching game:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch game details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

