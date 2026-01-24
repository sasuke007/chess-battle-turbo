import { NextResponse } from "next/server";
import { cleanupExpiredEntries } from "@/lib/services/matchmaking";

export async function POST() {
  try {
    const expiredCount = await cleanupExpiredEntries();

    return NextResponse.json({
      success: true,
      data: {
        expiredCount,
        message: `Marked ${expiredCount} entries as expired`,
      },
    });
  } catch (error) {
    console.error("Error cleaning up expired entries:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup expired entries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
