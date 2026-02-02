import { Socket } from "socket.io";
import { GameSession } from "./GameSession";
import { GameData } from "./types";
import { fetchGameByRef } from "./utils/apiClient";

/**
 * GameManager manages all active game sessions
 * Routes socket events to appropriate game sessions
 */
export class GameManager {
  private games: Map<string, GameSession> = new Map();
  // Map socket ID to game reference IDs for quick lookup on disconnect
  private socketToGames: Map<string, Set<string>> = new Map();

  /**
   * Handle a player joining a game
   */
  public async handleJoinGame(
    socket: Socket,
    gameReferenceId: string,
    userReferenceId: string
  ): Promise<void> {
    try {
      console.log(
        `Player ${userReferenceId} attempting to join game ${gameReferenceId}`
      );

      // Get or create game session
      let gameSession = this.games.get(gameReferenceId);
      let isReconnection = false;

      if (!gameSession) {
        // Fetch game data from API
        const gameData : GameData = await fetchGameByRef(gameReferenceId);

        console.log("=== GAME MANAGER FETCHED GAME DATA ===");
        console.log("gameData.gameData:", gameData.gameData);
        console.log("gameData.gameData?.gameMode:", gameData.gameData?.gameMode);
        console.log("=======================================");

        // Validate game status
        if (
          gameData.status !== "WAITING_FOR_OPPONENT" &&
          gameData.status !== "IN_PROGRESS"
        ) {
          socket.emit("error", {
            message: `Game is not available (status: ${gameData.status})`,
          });
          return;
        }

        // Create new game session
        gameSession = new GameSession(gameData);
        this.games.set(gameReferenceId, gameSession);

        console.log(`Created new game session for ${gameReferenceId}`);
      } else {
        // Check if this player is already in the game (reconnection)
        isReconnection = gameSession.isPlayerInGame(userReferenceId);
        console.log(`Is reconnection: ${isReconnection}`);
      }

      //TODO: do we need to validate game status again here, check what can go wrong if we don't.
      const game: GameData = await fetchGameByRef(gameReferenceId);
      await gameSession.setGameData(game);
      
      // Track socket to game mapping BEFORE adding player
      if (!this.socketToGames.has(socket.id)) {
        this.socketToGames.set(socket.id, new Set());
      }
      this.socketToGames.get(socket.id)!.add(gameReferenceId);

      // Handle reconnection vs new join
      if (isReconnection) {
        console.log(`Handling reconnection for ${userReferenceId}`);
        gameSession.handleReconnect(socket, userReferenceId);
      } else {
        console.log(`Handling new player join for ${userReferenceId}`);
        // Add player to session
        await gameSession.addPlayer(socket, userReferenceId);

        // If game is waiting for opponent, emit waiting status
        if (
          game.status === "WAITING_FOR_OPPONENT" &&
          !gameSession.hasBothPlayers()
        ) {
          socket.emit("waiting_for_opponent", { gameReferenceId });
          console.log(`Player waiting for opponent in game ${gameReferenceId}`);
        }
      }
    } catch (error) {
      console.error("Error handling join game:", error);
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to join game",
      });
    }
  }

  /**
   * Handle a move attempt
   */
  public async handleMove(
    socket: Socket,
    gameReferenceId: string,
    from: string,
    to: string,
    promotion?: "q" | "r" | "b" | "n"
  ): Promise<void> {
    const gameSession = this.games.get(gameReferenceId);

    if (!gameSession) {
      socket.emit("move_error", { message: "Game not found" });
      return;
    }

    await gameSession.makeMove(socket, from as any, to as any, promotion);
  }

  /**
   * Handle resignation
   */
  public async handleResign(
    socket: Socket,
    gameReferenceId: string
  ): Promise<void> {
    const gameSession = this.games.get(gameReferenceId);

    if (!gameSession) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    await gameSession.handleResignation(socket);

    // Clean up game session after resignation
    setTimeout(() => {
      this.removeGame(gameReferenceId);
    }, 5000); // Give time for clients to receive game_over event
  }

  /**
   * Handle draw offer
   */
  public handleOfferDraw(socket: Socket, gameReferenceId: string): void {
    const gameSession = this.games.get(gameReferenceId);

    if (!gameSession) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    gameSession.handleDrawOffer(socket);
  }

  /**
   * Handle draw acceptance
   */
  public async handleAcceptDraw(
    socket: Socket,
    gameReferenceId: string
  ): Promise<void> {
    const gameSession = this.games.get(gameReferenceId);

    if (!gameSession) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    await gameSession.handleDrawAcceptance(socket);

    // Clean up game session after draw
    setTimeout(() => {
      this.removeGame(gameReferenceId);
    }, 5000);
  }

  /**
   * Handle draw decline
   */
  public handleDeclineDraw(socket: Socket, gameReferenceId: string): void {
    const gameSession = this.games.get(gameReferenceId);

    if (!gameSession) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    gameSession.handleDrawDecline(socket);
    console.log(`Draw declined in game ${gameReferenceId}`);
  }

  /**
   * Handle analysis phase completion acknowledgment from client
   */
  public handleAnalysisComplete(
    socket: Socket,
    gameReferenceId: string,
    userReferenceId: string
  ): void {
    const gameSession = this.games.get(gameReferenceId);

    if (!gameSession) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    gameSession.handleAnalysisComplete(userReferenceId);
  }

  /**
   * Handle socket disconnection
   */
  public handleDisconnect(socket: Socket): void {
    const gameIds = this.socketToGames.get(socket.id);

    if (!gameIds) {
      return;
    }

    console.log(`Socket ${socket.id} disconnected from ${gameIds.size} game(s)`);

    // Notify all games this socket was part of
    gameIds.forEach((gameReferenceId) => {
      const gameSession = this.games.get(gameReferenceId);
      if (gameSession) {
        gameSession.handleDisconnect(socket);
      }
    });

    // Clean up socket mapping
    this.socketToGames.delete(socket.id);
  }

  /**
   * Handle socket reconnection to a game
   */
  public async handleReconnect(
    socket: Socket,
    gameReferenceId: string,
    userReferenceId: string
  ): Promise<void> {
    const gameSession = this.games.get(gameReferenceId);

    if (!gameSession) {
      socket.emit("error", { message: "Game not found or has ended" });
      return;
    }

    gameSession.handleReconnect(socket, userReferenceId);

    // Track socket to game mapping
    if (!this.socketToGames.has(socket.id)) {
      this.socketToGames.set(socket.id, new Set());
    }
    this.socketToGames.get(socket.id)!.add(gameReferenceId);
  }

  /**
   * Remove a game session (cleanup after game ends)
   */
  private removeGame(gameReferenceId: string): void {
    const gameSession = this.games.get(gameReferenceId);

    if (gameSession) {
      gameSession.destroy();
      this.games.delete(gameReferenceId);
      console.log(`Removed game session ${gameReferenceId}`);
    }
  }

  /**
   * Get count of active games
   */
  public getActiveGameCount(): number {
    return this.games.size;
  }

  /**
   * Get game session by reference ID (for debugging)
   */
  public getGame(gameReferenceId: string): GameSession | undefined {
    return this.games.get(gameReferenceId);
  }

  /**
   * Clean up all games (for server shutdown)
   */
  public destroy(): void {
    this.games.forEach((gameSession, gameReferenceId) => {
      gameSession.destroy();
    });
    this.games.clear();
    this.socketToGames.clear();
    console.log("GameManager destroyed");
  }
}

