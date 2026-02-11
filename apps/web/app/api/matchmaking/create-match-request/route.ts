import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createMatchRequest } from "@/lib/services/matchmaking";
import * as Sentry from "@sentry/nextjs";

const createMatchRequestSchema = z.object({
  userReferenceId: z.string().min(1, "User reference ID is required"),
  legendReferenceId: z.string().nullable().optional(),
  openingReferenceId: z.string().nullable().optional(),
  initialTimeSeconds: z
    .number()
    .int()
    .positive("Initial time must be greater than 0"),
  incrementSeconds: z
    .number()
    .int()
    .min(0, "Increment seconds must be 0 or greater"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createMatchRequestSchema.parse(body);

    Sentry.logger.info(`POST /api/matchmaking/create-match-request - user ${validatedData.userReferenceId}, time ${validatedData.initialTimeSeconds}+${validatedData.incrementSeconds}`);

    const result = await createMatchRequest({
      userReferenceId: validatedData.userReferenceId,
      legendReferenceId: validatedData.legendReferenceId,
      openingReferenceId: validatedData.openingReferenceId,
      initialTimeSeconds: validatedData.initialTimeSeconds,
      incrementSeconds: validatedData.incrementSeconds,
    });

    Sentry.logger.info(`Match request created for user ${validatedData.userReferenceId}`);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
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
      // Handle specific error messages
      if (error.message === "User not found") {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
      if (error.message === "User already has an active queue entry") {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }
    }

    Sentry.logger.error(`POST /api/matchmaking/create-match-request failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    console.error("Error creating match request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create match request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
