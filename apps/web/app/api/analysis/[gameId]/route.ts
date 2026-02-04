import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { Chess, Move } from "chess.js";

interface AnalysisData {
  // Game info
  gameReferenceId: string;
  startingFen: string;
  userMoves: Move[];
  userColor: "w" | "b";
  gameResult: string | null;

  // Legend info
  legendMoves: Move[];
  moveNumberStart: number;
  whitePlayerName: string | null;
  blackPlayerName: string | null;
  tournamentName: string | null;
  legendPgn: string | null;
}

/**
 * Parse PGN to extract moves starting from a specific move number.
 * Returns moves from moveNumberStart onwards.
 */
function parsePgnFromMoveNumber(
  pgn: string,
  startingFen: string,
  moveNumberStart: number
): Move[] {
  try {
    // Create a game and load the full PGN
    const game = new Chess();
    game.loadPgn(pgn);

    // Get all moves from the game
    const allMoves = game.history({ verbose: true });

    // Calculate which ply to start from
    // Move number 31 with black to move means we start at ply (31-1)*2 + 1 = 61
    // Move number 31 with white to move means we start at ply (31-1)*2 = 60
    const fenParts = startingFen.split(" ");
    const sideToMove = fenParts[1]; // 'w' or 'b'

    let startPly: number;
    if (sideToMove === "b") {
      // Black to move: we're at the start of black's move in that move number
      startPly = (moveNumberStart - 1) * 2 + 1;
    } else {
      // White to move: we're at the start of white's move in that move number
      startPly = (moveNumberStart - 1) * 2;
    }

    // Return moves from startPly onwards
    return allMoves.slice(startPly);
  } catch (error) {
    console.error("Error parsing PGN:", error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    // 1. Find the game with its chess position
    const game = await prisma.game.findUnique({
      where: { referenceId: gameId },
      select: {
        referenceId: true,
        startingFen: true,
        gameData: true,
        result: true,
        creatorId: true,
        opponentId: true,
        chessPositionId: true,
      },
    });

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    // 2. Extract user moves from gameData
    const gameData = game.gameData as {
      moveHistory?: Move[];
      playerColor?: string;
      positionInfo?: {
        whitePlayerName?: string;
        blackPlayerName?: string;
        tournamentName?: string;
      };
    } | null;

    const userMoves = gameData?.moveHistory || [];
    const userColor = (gameData?.playerColor === "black" ? "b" : "w") as "w" | "b";

    // 3. If game has a chess position, fetch it for legend data
    let legendMoves: Move[] = [];
    let moveNumberStart = 1;
    let whitePlayerName: string | null = null;
    let blackPlayerName: string | null = null;
    let tournamentName: string | null = null;
    let legendPgn: string | null = null;

    if (game.chessPositionId) {
      const chessPosition = await prisma.chessPosition.findUnique({
        where: { id: game.chessPositionId },
        select: {
          pgn: true,
          moveNumber: true,
          whitePlayerName: true,
          blackPlayerName: true,
          tournamentName: true,
          fen: true,
        },
      });

      if (chessPosition) {
        whitePlayerName = chessPosition.whitePlayerName;
        blackPlayerName = chessPosition.blackPlayerName;
        tournamentName = chessPosition.tournamentName;
        legendPgn = chessPosition.pgn;
        moveNumberStart = chessPosition.moveNumber || 1;

        if (chessPosition.pgn) {
          legendMoves = parsePgnFromMoveNumber(
            chessPosition.pgn,
            game.startingFen,
            moveNumberStart
          );
        }
      }
    } else if (gameData?.positionInfo) {
      // Fallback to positionInfo stored in gameData
      whitePlayerName = gameData.positionInfo.whitePlayerName || null;
      blackPlayerName = gameData.positionInfo.blackPlayerName || null;
      tournamentName = gameData.positionInfo.tournamentName || null;
    }

    // 4. Build response
    const analysisData: AnalysisData = {
      gameReferenceId: game.referenceId,
      startingFen: game.startingFen,
      userMoves,
      userColor,
      gameResult: game.result,
      legendMoves,
      moveNumberStart,
      whitePlayerName,
      blackPlayerName,
      tournamentName,
      legendPgn,
    };

    return NextResponse.json({
      success: true,
      data: analysisData,
    });
  } catch (error) {
    console.error("Error fetching analysis data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analysis data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
