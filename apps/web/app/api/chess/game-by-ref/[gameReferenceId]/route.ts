import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameReferenceId: string }> }
) {
  try {
    const { gameReferenceId } = await params;

    if (!gameReferenceId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Game reference ID is required" 
        }, 
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { referenceId: gameReferenceId },
      select: {
        referenceId: true,
        stakeAmount: true,
        totalPot: true,
        platformFeeAmount: true,
        chessPositionId: true,
        startingFen: true,
        status: true,
        initialTimeSeconds: true,
        incrementSeconds: true,
        creatorTimeRemaining: true,
        opponentTimeRemaining: true,
        gameData: true,
        creator: {
          select: {
            referenceId: true,
            name: true,
            code: true,
            profilePictureUrl: true,
          },
        },
        opponent: {
          select: {
            referenceId: true,
            name: true,
            code: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Game not found" 
        }, 
        { status: 404 }
      );
    }

    // Transform to match GameData interface
    const response = {
      success: true,
      data: {
        referenceId: game.referenceId,
        creatorId: game.creator.referenceId,
        opponentId: game.opponent?.referenceId ?? null,
        stakeAmount: game.stakeAmount.toString(),
        totalPot: game.totalPot.toString(),
        platformFeeAmount: game.platformFeeAmount.toString(),
        chessPositionId: game.chessPositionId?.toString() ?? null,
        startingFen: game.startingFen,
        initialTimeSeconds: game.initialTimeSeconds,
        incrementSeconds: game.incrementSeconds,
        creatorTimeRemaining: game.creatorTimeRemaining,
        opponentTimeRemaining: game.opponentTimeRemaining,
        status: game.status,
        gameData: game.gameData as Record<string, unknown> | undefined,
        creator: {
          userReferenceId: game.creator.referenceId,
          name: game.creator.name,
          code: game.creator.code,
          profilePictureUrl: game.creator.profilePictureUrl,
        },
        ...(game.opponent && {
          opponent: {
            userReferenceId: game.opponent.referenceId,
            name: game.opponent.name,
            code: game.opponent.code,
            profilePictureUrl: game.opponent.profilePictureUrl,
          },
        }),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching game by reference:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      }, 
      { status: 500 }
    );
  }
}

