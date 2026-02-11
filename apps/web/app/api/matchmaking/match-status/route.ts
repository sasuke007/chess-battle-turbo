import { NextRequest, NextResponse } from "next/server";
import { getMatchStatus } from "@/lib/services/matchmaking";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const referenceId = searchParams.get("referenceId");

    Sentry.logger.info(`GET /api/matchmaking/match-status - referenceId ${referenceId}`);

    if (!referenceId) {
      return NextResponse.json(
        {
          success: false,
          error: "referenceId query parameter is required",
        },
        { status: 400 }
      );
    }

    const result = await getMatchStatus(referenceId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Queue entry not found") {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
    }

    Sentry.logger.error(`GET /api/matchmaking/match-status failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    console.error("Error getting match status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get match status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
