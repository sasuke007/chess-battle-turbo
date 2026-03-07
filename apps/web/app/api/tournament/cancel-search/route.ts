import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveUser } from "@/lib/auth/resolve-user";

const cancelSchema = z.object({
  tournamentReferenceId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const dbUser = await resolveUser(request);
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = cancelSchema.parse(body);

    const tournament = await prisma.tournament.findUnique({
      where: { referenceId: data.tournamentReferenceId },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    await prisma.tournamentParticipant.updateMany({
      where: {
        tournamentId: tournament.id,
        userId: dbUser.id,
        isSearching: true,
      },
      data: { isSearching: false, searchingSince: null },
    });

    return NextResponse.json({ success: true, message: "Search cancelled" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to cancel search" },
      { status: 500 }
    );
  }
}
