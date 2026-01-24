import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cancelMatchRequest } from "@/lib/services/matchmaking";

const cancelMatchRequestSchema = z.object({
  queueReferenceId: z.string().min(1, "Queue reference ID is required"),
  userReferenceId: z.string().min(1, "User reference ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = cancelMatchRequestSchema.parse(body);

    await cancelMatchRequest(
      validatedData.queueReferenceId,
      validatedData.userReferenceId
    );

    return NextResponse.json({
      success: true,
      message: "Match request cancelled",
    });
  } catch (error) {
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

    if (error instanceof Error) {
      if (error.message === "User not found") {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
      if (error.message === "Queue entry not found") {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      if (error.message === "Cannot cancel - already matched or expired") {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }

    console.error("Error cancelling match request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel match request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
