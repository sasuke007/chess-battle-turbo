import { logger } from "@/lib/sentry/logger";

const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3002";

interface TournamentEvent {
  event: "game_ended" | "game_started" | "tournament_started" | "tournament_ended" | "player_joined";
  tournamentReferenceId: string;
  data?: Record<string, unknown>;
}

export async function notifyTournamentEvent({ event, tournamentReferenceId, data }: TournamentEvent): Promise<void> {
  try {
    const url = `${WS_URL.replace("ws://", "http://").replace("wss://", "https://")}/internal/tournament-event`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, tournamentReferenceId, data }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    logger.error(`Failed to notify WS of tournament event: ${event}`, error);
  }
}
