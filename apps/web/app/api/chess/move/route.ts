import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

const moveSchema = z.object({
  gameReferenceId: z.string().min(1, "Game reference ID is required"),
  userReferenceId: z.string().min(1, "User reference ID is required"),
  from: z.string().min(2).max(2),
  to: z.string().min(2).max(2),
  promotion: z.string().optional(),
  fen: z.string().min(1, "FEN is required"),
  moveHistory: z.array(z.any()),
  whiteTime: z.number().int().min(0),
  blackTime: z.number().int().min(0),
});

type MoveRequest = z.infer<typeof moveSchema>;

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validatedData = moveSchema.parse(body);

    // 2. Find game with user relations to get reference IDs
    const game = await prisma.game.findUnique({
      where: { referenceId: validatedData.gameReferenceId },
      include: {
        creator: true,
        opponent: true,
      },
    });

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    // 3. Verify game status
    if (game.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, error: "Game is not in progress" },
        { status: 400 }
      );
    }

    // 4. Verify user is part of the game (compare reference IDs)
    const isCreator = game.creator.referenceId === validatedData.userReferenceId;
    const isOpponent = game.opponent?.referenceId === validatedData.userReferenceId;

    if (!isCreator && !isOpponent) {
      return NextResponse.json(
        { success: false, error: "User is not part of this game" },
        { status: 403 }
      );
    }

    // 5. Update game with new state
    const updatedGame = await prisma.game.update({
      where: { referenceId: validatedData.gameReferenceId },
      data: {
        gameData: {
          fen: validatedData.fen,
          moveHistory: validatedData.moveHistory,
        },
        creatorTimeRemaining: validatedData.whiteTime,
        opponentTimeRemaining: validatedData.blackTime,
        lastMoveAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 6. Return success
    return NextResponse.json(
      {
        success: true,
        data: {
          game: {
            referenceId: updatedGame.referenceId,
            status: updatedGame.status,
            updatedAt: updatedGame.updatedAt,
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
          success: false,
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    console.error("Error persisting move:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to persist move",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

