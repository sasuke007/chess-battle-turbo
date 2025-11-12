import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

const gameStateSchema = z.object({
  gameReferenceId: z.string().min(1, "Game reference ID is required"),
  whiteTime: z.number().int().min(0),
  blackTime: z.number().int().min(0),
  lastMoveAt: z.string().datetime().or(z.date()),
});

type GameStateRequest = z.infer<typeof gameStateSchema>;

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validatedData = gameStateSchema.parse(body);

    // 2. Find game
    const game = await prisma.game.findUnique({
      where: { referenceId: validatedData.gameReferenceId },
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

    // 4. Update game state (clocks and last move time)
    await prisma.game.update({
      where: { referenceId: validatedData.gameReferenceId },
      data: {
        creatorTimeRemaining: validatedData.whiteTime,
        opponentTimeRemaining: validatedData.blackTime,
        lastMoveAt: new Date(validatedData.lastMoveAt),
        updatedAt: new Date(),
      },
    });

    // 5. Return success
    return NextResponse.json(
      {
        success: true,
        message: "Game state updated successfully",
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
    console.error("Error updating game state:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update game state",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

