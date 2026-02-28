import { NextRequest, NextResponse } from "next/server";
import {
  getTournamentByRef,
  autoCompleteTournamentIfExpired,
  serializeTournament,
} from "@/lib/services/tournament/tournament.service";
import { prisma } from "@/lib/prisma";

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
