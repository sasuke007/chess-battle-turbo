import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createMatchRequest } from "@/lib/services/matchmaking";

const createMatchRequestSchema = z.object({
  userReferenceId: z.string().min(1, "User reference ID is required"),
  legendReferenceId: z.string().nullable().optional(),
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

    const result = await createMatchRequest({
      userReferenceId: validatedData.userReferenceId,
      legendReferenceId: validatedData.legendReferenceId,
      initialTimeSeconds: validatedData.initialTimeSeconds,
      incrementSeconds: validatedData.incrementSeconds,
    });

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
