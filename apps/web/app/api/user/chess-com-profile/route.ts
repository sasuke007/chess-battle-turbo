import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const chessComProfileSchema = z.object({
  chessComHandle: z.string().min(1, "Chess.com username is required").max(50),
});

/**
 * Fetch chess.com stats from their public API
 */
async function fetchChessComStats(handle: string) {
  try {
    const response = await fetch(`https://api.chess.com/pub/player/${handle}/stats`, {
      headers: {
        'User-Agent': 'ChessBattle/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Chess.com user not found. Please check the username and try again.");
      }
      throw new Error(`Failed to fetch chess.com data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to connect to chess.com API");
  }
}

/**
 * POST /api/user/chess-com-profile
 * Save user's chess.com profile and fetch their stats
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = chessComProfileSchema.parse(body);
    const chessComHandle = validatedData.chessComHandle.toLowerCase().trim();

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { googleId: userId },
      include: { chessComProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Fetch stats from chess.com
    console.log(`Fetching chess.com stats for: ${chessComHandle}`);
    const chessComData = await fetchChessComStats(chessComHandle);

    // Extract ratings and stats
    const rapidData = chessComData.chess_rapid;
    const blitzData = chessComData.chess_blitz;
    const bulletData = chessComData.chess_bullet;
    const dailyData = chessComData.chess_daily;

    // Prepare profile data
    const profileData = {
      chessComHandle,
      
      // Rapid stats
      rapidRating: rapidData?.last?.rating,
      rapidBestRating: rapidData?.best?.rating,
      rapidWins: rapidData?.record?.win,
      rapidLosses: rapidData?.record?.loss,
      rapidDraws: rapidData?.record?.draw,
      
      // Blitz stats
      blitzRating: blitzData?.last?.rating,
      blitzBestRating: blitzData?.best?.rating,
      blitzWins: blitzData?.record?.win,
      blitzLosses: blitzData?.record?.loss,
      blitzDraws: blitzData?.record?.draw,
      
      // Bullet stats
      bulletRating: bulletData?.last?.rating,
      bulletBestRating: bulletData?.best?.rating,
      bulletWins: bulletData?.record?.win,
      bulletLosses: bulletData?.record?.loss,
      bulletDraws: bulletData?.record?.draw,
      
      // Daily stats
      dailyRating: dailyData?.last?.rating,
      dailyBestRating: dailyData?.best?.rating,
      dailyWins: dailyData?.record?.win,
      dailyLosses: dailyData?.record?.loss,
      dailyDraws: dailyData?.record?.draw,
      
      lastSyncedAt: new Date(),
    };

    // Upsert chess.com profile (create or update)
    const result = await prisma.chessComProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...profileData,
      },
      update: profileData,
    });

    const isNewProfile = !user.chessComProfile;
    console.log(`Chess.com profile ${isNewProfile ? 'created' : 'updated'} for user ${user.referenceId}`);

    return NextResponse.json(
      {
        success: true,
        message: `Chess.com profile ${isNewProfile ? 'connected' : 'updated'} successfully`,
        profile: {
          referenceId: result.referenceId,
          chessComHandle: result.chessComHandle,
          rapidRating: result.rapidRating,
          blitzRating: result.blitzRating,
        },
      },
      { status: isNewProfile ? 201 : 200 }
    );
  } catch (error) {
    console.error("Error saving chess.com profile:", error);

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

    // Handle custom errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

