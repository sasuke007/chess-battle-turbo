import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const joinSchema = z.object({
  tournamentReferenceId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = joinSchema.parse(body);

    const tournament = await prisma.tournament.findUnique({
      where: { referenceId: data.tournamentReferenceId },
      include: { _count: { select: { participants: true } } },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status !== "LOBBY" && tournament.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Tournament is not accepting participants" },
        { status: 400 }
      );
    }

    if (
      tournament.maxParticipants &&
      tournament._count.participants >= tournament.maxParticipants
    ) {
      return NextResponse.json(
        { error: "Tournament is full" },
        { status: 400 }
      );
    }

    // Check if already joined
    const existing = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: tournament.id,
          userId: dbUser.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: true, message: "Already joined" },
        { status: 200 }
      );
    }

    await prisma.tournamentParticipant.create({
      data: {
        tournamentId: tournament.id,
        userId: dbUser.id,
      },
    });

    logger.info(`User ${dbUser.referenceId} joined tournament ${tournament.referenceId}`);

    return NextResponse.json(
      { success: true, message: "Joined tournament" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    logger.error("Error joining tournament", error);
    return NextResponse.json(
      { error: "Failed to join tournament" },
      { status: 500 }
    );
  }
}
