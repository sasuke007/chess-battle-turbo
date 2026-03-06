import { NextRequest, NextResponse } from "next/server";
import {
  getTournamentByRef,
  autoCompleteTournamentIfExpired,
  serializeTournament,
} from "@/lib/services/tournament/tournament.service";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentReferenceId: string }> }
) {
  try {
    const { tournamentReferenceId } = await params;

    const tournament = await getTournamentByRef(tournamentReferenceId);

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Auto-complete if expired
    await autoCompleteTournamentIfExpired(tournament);

    // Re-fetch if status changed
    const freshTournament =
      tournament.status === "ACTIVE" &&
      tournament.endsAt &&
      tournament.endsAt < new Date()
        ? await getTournamentByRef(tournamentReferenceId)
        : tournament;

    if (!freshTournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Get active games in this tournament
    const activeGames = await prisma.game.findMany({
      where: {
        tournamentId: freshTournament.id,
        status: "IN_PROGRESS",
      },
      include: {
        creator: {
          select: { referenceId: true, name: true, profilePictureUrl: true },
        },
        opponent: {
          select: { referenceId: true, name: true, profilePictureUrl: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...serializeTournament(freshTournament),
        activeGames: activeGames.map((g) => ({
          referenceId: g.referenceId,
          creator: g.creator,
          opponent: g.opponent,
          startedAt: g.startedAt?.toISOString() ?? null,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentReferenceId: string }> }
) {
  try {
    // Protected by a secret token — only e2e tests / CI can call this
    const secret = process.env.E2E_CLEANUP_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Not configured" }, { status: 404 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tournamentReferenceId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { referenceId: tournamentReferenceId },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Delete in order: transactions → games → tournament (participants cascade)
    await prisma.$transaction(async (tx) => {
      // Delete transactions linked to tournament games
      await tx.transaction.deleteMany({
        where: { game: { tournamentId: tournament.id } },
      });

      // Delete all games in the tournament
      await tx.game.deleteMany({
        where: { tournamentId: tournament.id },
      });

      // Delete tournament (cascade deletes participants)
      await tx.tournament.delete({
        where: { id: tournament.id },
      });
    });

    logger.info(`Tournament ${tournamentReferenceId} deleted via cleanup API`);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting tournament", error);
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    );
  }
}
