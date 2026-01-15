import { Chess, Color, Move, Square } from "chess.js";
import { Socket } from "socket.io";
import { ClockManager } from "./ClockManager";
import {
  GameData,
  PlayerConnection,
  GameStartedPayload,
  MoveMadePayload,
  GameOverPayload,
  GameResult,
  GameEndMethod,
  ClockUpdatePayload,
} from "./types";
import { persistMove, completeGame } from "./utils/apiClient";

/**
 * GameSession manages the state and logic for a single chess game
 */
export class GameSession {
  private gameData: GameData;
  private chess: Chess;
  private clockManager: ClockManager;

  private whitePlayer: PlayerConnection | null = null;
  private blackPlayer: PlayerConnection | null = null;
  private creatorPlayer: PlayerConnection | null = null;
  private opponentPlayer: PlayerConnection | null = null;

  private gameStarted: boolean = false;
  private gameEnded: boolean = false;

  // Disconnect handling
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DISCONNECT_GRACE_PERIOD = 30000; // 30 seconds

  constructor(gameData: GameData) {
    this.gameData = gameData;

    // Initialize chess instance with the starting FEN from database
    this.chess = new Chess(gameData.startingFen);


    // Initialize clock manager
    this.clockManager = new ClockManager(
      {
        initialTime: gameData.initialTimeSeconds,
        increment: gameData.incrementSeconds,
      },
      gameData.creatorTimeRemaining * 1000,
      gameData.opponentTimeRemaining * 1000
    );

    // Set up clock event handlers
    this.clockManager.setOnClockUpdate((whiteTime, blackTime) => {
      this.broadcastClockUpdate(whiteTime, blackTime);
    });

    this.clockManager.setOnTimeout((color) => {
      this.handleTimeout(color);
    });

    console.log(`GameSession created for game ${gameData.referenceId} with starting FEN: ${gameData.startingFen}`);
  }

  public async setGameData(gameData: GameData): Promise<void> {
    this.gameData = gameData;
  }

  /**
   * Check if player is already in the game
   */
  public isPlayerInGame(userReferenceId: string): boolean {
    return (
      this.creatorPlayer?.userReferenceId === userReferenceId ||
      this.opponentPlayer?.userReferenceId === userReferenceId
    );
  }

  /**
   * Check if game has started
   */
  public isGameStarted(): boolean {
    return this.gameStarted;
  }
  
  /**
   * Add a player to the game session
   */
  public async addPlayer(
    socket: Socket,
    userReferenceId: string
  ): Promise<void> {
    const isCreator = userReferenceId === this.gameData.creator.userReferenceId;
    const isOpponent = userReferenceId === this.gameData.opponent?.userReferenceId;

    console.log("=== ADD PLAYER DEBUG ===");
    console.log("Attempting to add player:", userReferenceId);
    console.log("Game reference ID:", this.gameData.referenceId);
    console.log("Game status:", this.gameData.status);
    console.log("Creator ID:", this.gameData.creator.userReferenceId);
    console.log("Opponent ID:", this.gameData.opponent?.userReferenceId);
    console.log("Is creator?", isCreator);
    console.log("Is opponent?", isOpponent);
    console.log("Full game data:", JSON.stringify(this.gameData, null, 2));
    console.log("=======================");

    if (!isCreator && !isOpponent) {
      throw new Error(`User ${userReferenceId} is not part of game ${this.gameData.referenceId}. Creator: ${this.gameData.creator.userReferenceId}, Opponent: ${this.gameData.opponent?.userReferenceId || 'null'}`);
    }

    // Store creator or opponent
    if (isCreator) {
      const playerInfo = this.gameData.creator;
      this.creatorPlayer = {
        socket,
        userReferenceId,
        color: "w", // Will be assigned properly when game starts
        playerInfo,
      };
      socket.join(this.gameData.referenceId);
      console.log(`Creator joined game ${this.gameData.referenceId}`);
    } else if (isOpponent) {
      const playerInfo = this.gameData.opponent!;
      this.opponentPlayer = {
        socket,
        userReferenceId,
        color: "b", // Will be assigned properly when game starts
        playerInfo,
      };
      socket.join(this.gameData.referenceId);
      console.log(`Opponent joined game ${this.gameData.referenceId}`);
    }

    // If both players are present and game hasn't started, start it
    if (
      this.creatorPlayer &&
      this.opponentPlayer &&
      !this.gameStarted &&
      this.gameData.status === "IN_PROGRESS"
    ) {
      await this.startGame();
    }
  }

  /**
   * Start the game when both players are connected
   */
  private async startGame(): Promise<void> {
    if (!this.creatorPlayer || !this.opponentPlayer) {
      throw new Error("Both players must be present to start game");
    }

    this.gameStarted = true;

    // Randomly assign colors to players
    const creatorGetsWhite = Math.random() < 0.5;
    if (creatorGetsWhite) {
      this.whitePlayer = this.creatorPlayer;
      this.blackPlayer = this.opponentPlayer;
    } else {
      this.whitePlayer = this.opponentPlayer;
      this.blackPlayer = this.creatorPlayer;
    }
    this.whitePlayer.color = "w";
    this.blackPlayer.color = "b";

    // Start white's clock
    this.clockManager.startClock("w");

    // Emit game_started to both players
    const clockState = this.clockManager.getState();

    const whitePayload: GameStartedPayload = {
      gameReferenceId: this.gameData.referenceId,
      yourColor: "w",
      fen: this.chess.fen(),
      whiteTime: this.clockManager.getTimeInSeconds("w"),
      blackTime: this.clockManager.getTimeInSeconds("b"),
      whitePlayer: this.whitePlayer.playerInfo,
      blackPlayer: this.blackPlayer.playerInfo,
    };

    const blackPayload: GameStartedPayload = {
      gameReferenceId: this.gameData.referenceId,
      yourColor: "b",
      fen: this.chess.fen(),
      whiteTime: this.clockManager.getTimeInSeconds("w"),
      blackTime: this.clockManager.getTimeInSeconds("b"),
      whitePlayer: this.whitePlayer.playerInfo,
      blackPlayer: this.blackPlayer.playerInfo,
    };

    this.whitePlayer.socket.emit("game_started", whitePayload);
    this.blackPlayer.socket.emit("game_started", blackPayload);

    console.log(`Game ${this.gameData.referenceId} started`);
  }

  /**
   * Handle a move attempt from a player
   */
  public async makeMove(
    socket: Socket,
    from: Square,
    to: Square,
    promotion?: "q" | "r" | "b" | "n"
  ): Promise<void> {
    if (this.gameEnded) {
      socket.emit("move_error", { message: "Game has ended" });
      return;
    }

    if (!this.gameStarted) {
      socket.emit("move_error", { message: "Game has not started yet" });
      return;
    }

    // Verify it's this player's turn
    const currentTurn = this.chess.turn();
    const player = this.getPlayerBySocket(socket);

    if (!player) {
      socket.emit("move_error", { message: "You are not in this game" });
      return;
    }

    if (player.color !== currentTurn) {
      socket.emit("move_error", { message: "It's not your turn" });
      return;
    }

    // Attempt the move
    let move: Move;
    try {
      move = this.chess.move({ from, to, promotion: promotion || "q" });
    } catch (error) {
      socket.emit("move_error", { message: "Invalid move" });
      return;
    }

    console.log(`Move made: ${move.san} in game ${this.gameData.referenceId}`);

    // Stop current player's clock and add increment
    this.clockManager.stopClock();
    this.clockManager.addIncrement(currentTurn);

    // Start opponent's clock
    const nextTurn = this.chess.turn();
    this.clockManager.startClock(nextTurn);

    // Prepare move payload
    const moveMadePayload: MoveMadePayload = {
      from: move.from,
      to: move.to,
      san: move.san,
      fen: this.chess.fen(),
      whiteTime: this.clockManager.getTimeInSeconds("w"),
      blackTime: this.clockManager.getTimeInSeconds("b"),
      turn: nextTurn,
      promotion: move.promotion,
    };

    // Broadcast to both players
    this.broadcast("move_made", moveMadePayload);

    // Check for game end conditions
    if (this.chess.isGameOver()) {
      await this.handleGameOver();
      return;
    }

    // Persist move to database (async, non-blocking)
    this.persistMoveToDb(player.userReferenceId, move).catch((error) => {
      console.error("Error persisting move to DB:", error);
    });
  }

  /**
   * Handle resignation
   */
  public async handleResignation(socket: Socket): Promise<void> {
    if (this.gameEnded) {
      return;
    }

    const player = this.getPlayerBySocket(socket);
    if (!player) {
      return;
    }

    const winner = player.color === "w" ? "b" : "w";
    const result: GameResult =
      winner === "w" ? "CREATOR_WON" : "OPPONENT_WON";

    await this.endGame(result, winner, "resignation");
  }

  /**
   * Handle draw offer
   */
  public handleDrawOffer(socket: Socket): void {
    if (this.gameEnded) {
      return;
    }

    const player = this.getPlayerBySocket(socket);
    if (!player) {
      return;
    }

    // Notify opponent
    const opponent = player.color === "w" ? this.blackPlayer : this.whitePlayer;
    if (opponent) {
      opponent.socket.emit("draw_offered", {});
    }
  }

  /**
   * Handle draw acceptance
   */
  public async handleDrawAcceptance(socket: Socket): Promise<void> {
    if (this.gameEnded) {
      return;
    }

    await this.endGame("DRAW", null, "draw_agreement");
  }

  /**
   * Handle player disconnection
   */
  public handleDisconnect(socket: Socket): void {
    const player = this.getPlayerBySocket(socket);
    if (!player) {
      return;
    }

    console.log(
      `Player ${player.userReferenceId} disconnected from game ${this.gameData.referenceId}`
    );

    // Notify opponent
    const opponent =
      player === this.whitePlayer ? this.blackPlayer : this.whitePlayer;
    if (opponent && this.gameStarted && !this.gameEnded) {
      opponent.socket.emit("opponent_disconnected", {});

      // Start disconnect timer
      const timer = setTimeout(async () => {
        console.log(
          `Player ${player.userReferenceId} did not reconnect in time`
        );
        // Player forfeits
        const result: GameResult =
          player.color === "w" ? "OPPONENT_WON" : "CREATOR_WON";
        await this.endGame(result, opponent.color, "timeout");
      }, this.DISCONNECT_GRACE_PERIOD);

      this.disconnectTimers.set(player.userReferenceId, timer);
    }
  }

  /**
   * Handle player reconnection
   */
  public handleReconnect(socket: Socket, userReferenceId: string): void {
    const isCreator = userReferenceId === this.gameData.creator.userReferenceId;
    const isOpponent = userReferenceId === this.gameData.opponent?.userReferenceId;

    console.log(
      `Player ${userReferenceId} reconnecting to game ${this.gameData.referenceId}`,
      { isCreator, isOpponent, gameStarted: this.gameStarted }
    );

    // Clear disconnect timer if exists
    const timer = this.disconnectTimers.get(userReferenceId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(userReferenceId);
      console.log(`Cleared disconnect timer for ${userReferenceId}`);
    }

    // Update socket references
    if (isCreator && this.creatorPlayer) {
      this.creatorPlayer.socket = socket;
      if (this.whitePlayer?.userReferenceId === userReferenceId) {
        this.whitePlayer.socket = socket;
      }
      if (this.blackPlayer?.userReferenceId === userReferenceId) {
        this.blackPlayer.socket = socket;
      }
      socket.join(this.gameData.referenceId);
    } else if (isOpponent && this.opponentPlayer) {
      this.opponentPlayer.socket = socket;
      if (this.whitePlayer?.userReferenceId === userReferenceId) {
        this.whitePlayer.socket = socket;
      }
      if (this.blackPlayer?.userReferenceId === userReferenceId) {
        this.blackPlayer.socket = socket;
      }
      socket.join(this.gameData.referenceId);
    }

    // Notify opponent of reconnection if game has started
    if (this.gameStarted) {
      const opponent =
        this.whitePlayer?.userReferenceId === userReferenceId
          ? this.blackPlayer
          : this.whitePlayer;
      
      if (opponent) {
        opponent.socket.emit("opponent_reconnected", {});
        console.log(`Notified opponent of reconnection`);
      }

      // Send current game state to reconnected player
      socket.emit("game_started", {
        gameReferenceId: this.gameData.referenceId,
        yourColor:
          this.whitePlayer?.userReferenceId === userReferenceId ? "w" : "b",
        fen: this.chess.fen(),
        whiteTime: this.clockManager.getTimeInSeconds("w"),
        blackTime: this.clockManager.getTimeInSeconds("b"),
        whitePlayer: this.whitePlayer!.playerInfo,
        blackPlayer: this.blackPlayer!.playerInfo,
      });
      console.log(`Sent game state to reconnected player`);
    } else {
      // Game hasn't started yet, just send waiting status
      socket.emit("waiting_for_opponent", { 
        gameReferenceId: this.gameData.referenceId 
      });
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clockManager.destroy();
    this.disconnectTimers.forEach((timer) => clearTimeout(timer));
    this.disconnectTimers.clear();
    console.log(`GameSession destroyed for game ${this.gameData.referenceId}`);
  }

  /**
   * Check if both players are present
   */
  public hasBothPlayers(): boolean {
    return this.creatorPlayer !== null && this.opponentPlayer !== null;
  }

  /**
   * Get game reference ID
   */
  public getGameReferenceId(): string {
    return this.gameData.referenceId;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private getPlayerBySocket(socket: Socket): PlayerConnection | null {
    if (this.whitePlayer?.socket.id === socket.id) {
      return this.whitePlayer;
    }
    if (this.blackPlayer?.socket.id === socket.id) {
      return this.blackPlayer;
    }
    return null;
  }

  private broadcast(event: string, payload: any): void {
    if (this.whitePlayer) {
      this.whitePlayer.socket.emit(event, payload);
    }
    if (this.blackPlayer) {
      this.blackPlayer.socket.emit(event, payload);
    }
  }

  private broadcastClockUpdate(whiteTime: number, blackTime: number): void {
    const payload: ClockUpdatePayload = { whiteTime, blackTime };
    this.broadcast("clock_update", payload);
  }

  private async handleTimeout(color: Color): Promise<void> {
    console.log(
      `Timeout for ${color === "w" ? "White" : "Black"} in game ${this.gameData.referenceId}`
    );

    const result: GameResult = color === "w" ? "OPPONENT_WON" : "CREATOR_WON";
    const winner = color === "w" ? "b" : "w";

    await this.endGame(result, winner, "timeout");
  }

  private async handleGameOver(): Promise<void> {
    let result: GameResult;
    let winner: Color | null = null;
    let method: GameEndMethod;

    if (this.chess.isCheckmate()) {
      // Opponent of current turn wins
      const loser = this.chess.turn();
      winner = loser === "w" ? "b" : "w";
      result = winner === "w" ? "CREATOR_WON" : "OPPONENT_WON";
      method = "checkmate";
    } else if (this.chess.isStalemate()) {
      result = "DRAW";
      method = "stalemate";
    } else if (this.chess.isInsufficientMaterial()) {
      result = "DRAW";
      method = "insufficient_material";
    } else if (this.chess.isDraw()) {
      result = "DRAW";
      method = "draw_agreement";
    } else {
      // Shouldn't reach here, but handle it
      result = "DRAW";
      method = "draw_agreement";
    }

    await this.endGame(result, winner, method);
  }

  private async endGame(
    result: GameResult,
    winner: Color | null,
    method: GameEndMethod
  ): Promise<void> {
    if (this.gameEnded) {
      return;
    }

    this.gameEnded = true;
    this.clockManager.stopClock();

    const gameOverPayload: GameOverPayload = {
      result,
      winner,
      method,
      fen: this.chess.fen(),
      whiteTime: this.clockManager.getTimeInSeconds("w"),
      blackTime: this.clockManager.getTimeInSeconds("b"),
    };

    this.broadcast("game_over", gameOverPayload);

    console.log(
      `Game ${this.gameData.referenceId} ended: ${result} by ${method}`
    );

    // Persist game result to database
    const winnerId =
      winner === "w"
        ? this.whitePlayer?.userReferenceId
        : winner === "b"
        ? this.blackPlayer?.userReferenceId
        : undefined;

    await completeGame({
      gameReferenceId: this.gameData.referenceId,
      result,
      winnerId,
      method,
      fen: this.chess.fen(),
      whiteTime: this.clockManager.getTimeInSeconds("w"),
      blackTime: this.clockManager.getTimeInSeconds("b"),
    }).catch((error) => {
      console.error("Error completing game in DB:", error);
    });
  }

  private async persistMoveToDb(
    userReferenceId: string,
    move: Move
  ): Promise<void> {
    await persistMove({
      gameReferenceId: this.gameData.referenceId,
      userReferenceId,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      fen: this.chess.fen(),
      moveHistory: this.chess.history({ verbose: true }),
      whiteTime: this.clockManager.getTimeInSeconds("w"),
      blackTime: this.clockManager.getTimeInSeconds("b"),
    });
  }
}
