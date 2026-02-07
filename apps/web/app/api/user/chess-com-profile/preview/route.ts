import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { fetchChessComPreview } from "@/lib/chess-com";

const previewSchema = z.object({
  chessComHandle: z.string().min(1, "Chess.com username is required").max(50),
});

/**
 * POST /api/user/chess-com-profile/preview
 * Fetches chess.com profile + stats for preview without saving to DB
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = previewSchema.parse(body);
    const handle = validatedData.chessComHandle.toLowerCase().trim();

    const previewData = await fetchChessComPreview(handle);

    return NextResponse.json({ success: true, data: previewData });
  } catch (error) {
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

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
