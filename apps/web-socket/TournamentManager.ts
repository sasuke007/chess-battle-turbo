import { Server, Socket } from "socket.io";
import { logger } from "./utils/logger";

export interface TournamentLobbyPayload {
  tournamentReferenceId: string;
}

/**
 * TournamentManager handles Socket.IO rooms for tournament lobbies.
 * Uses rooms named `tournament:{referenceId}` for real-time lobby updates.
 */
export class TournamentManager {
  private io: Server;
  // Track which sockets are in which tournament rooms
  private socketToTournaments: Map<string, Set<string>> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Handle a client joining a tournament lobby room
   */
  public handleJoinLobby(socket: Socket, tournamentReferenceId: string): void {
    const room = `tournament:${tournamentReferenceId}`;
    socket.join(room);

    if (!this.socketToTournaments.has(socket.id)) {
      this.socketToTournaments.set(socket.id, new Set());
    }
    this.socketToTournaments.get(socket.id)!.add(tournamentReferenceId);

    logger.info(`Socket ${socket.id} joined tournament lobby ${tournamentReferenceId}`);
  }

  /**
   * Handle a client leaving a tournament lobby room
   */
  public handleLeaveLobby(socket: Socket, tournamentReferenceId: string): void {
    const room = `tournament:${tournamentReferenceId}`;
    socket.leave(room);

    this.socketToTournaments.get(socket.id)?.delete(tournamentReferenceId);

    logger.info(`Socket ${socket.id} left tournament lobby ${tournamentReferenceId}`);
  }

  /**
   * Broadcast that a new player joined the tournament
   */
  public emitPlayerJoined(
    tournamentReferenceId: string,
    player: { referenceId: string; name: string; profilePictureUrl: string | null }
  ): void {
    this.io
      .to(`tournament:${tournamentReferenceId}`)
      .emit("tournament_player_joined", { player });
  }

  /**
   * Broadcast that the tournament has started
   */
  public emitTournamentStarted(
    tournamentReferenceId: string,
    data: { startedAt: string; endsAt: string }
  ): void {
    this.io
      .to(`tournament:${tournamentReferenceId}`)
      .emit("tournament_started", data);
  }

  /**
   * Broadcast that a game started within the tournament
   */
  public emitGameStarted(
    tournamentReferenceId: string,
    data: {
      gameReferenceId: string;
      white: { name: string; referenceId: string };
      black: { name: string; referenceId: string };
    }
  ): void {
    this.io
      .to(`tournament:${tournamentReferenceId}`)
      .emit("tournament_game_started", data);
  }

  /**
   * Broadcast that a game ended within the tournament (leaderboard update)
   */
  public emitGameEnded(
    tournamentReferenceId: string,
    data: {
      gameReferenceId: string;
      result: string;
    }
  ): void {
    this.io
      .to(`tournament:${tournamentReferenceId}`)
      .emit("tournament_game_ended", data);
  }

  /**
   * Broadcast that the tournament has ended
   */
  public emitTournamentEnded(tournamentReferenceId: string): void {
    this.io
      .to(`tournament:${tournamentReferenceId}`)
      .emit("tournament_ended", { tournamentReferenceId });
  }

  /**
   * Notify specific sockets that a match was found
   */
  public emitMatchFound(
    tournamentReferenceId: string,
    gameReferenceId: string
  ): void {
    this.io
      .to(`tournament:${tournamentReferenceId}`)
      .emit("tournament_match_found", { gameReferenceId });
  }

  /**
   * Handle socket disconnect - clean up tournament room memberships
   */
  public handleDisconnect(socket: Socket): void {
    const tournaments = this.socketToTournaments.get(socket.id);
    if (tournaments) {
      tournaments.forEach((ref) => {
        socket.leave(`tournament:${ref}`);
      });
      this.socketToTournaments.delete(socket.id);
    }
  }

  /**
   * Clean up all state (for server shutdown)
   */
  public destroy(): void {
    this.socketToTournaments.clear();
    logger.info("TournamentManager destroyed");
  }
}
