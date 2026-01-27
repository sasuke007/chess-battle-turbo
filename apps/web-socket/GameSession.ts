import { Chess, Color, Move, Square } from "chess.js";
import { Socket } from "socket.io";
import { ClockManager } from "./ClockManager";
import {
  GameData,
  PlayerConnection,
  PlayerInfo,
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

  // AI game fields
  private isAIGame: boolean = false;
  private humanPlayerColor: Color | null = null;
  private botColor: Color | null = null;
  private aiDifficulty: "easy" | "medium" | "hard" | "expert" = "medium";

  // Disconnect handling
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DISCONNECT_GRACE_PERIOD = 30000; // 30 seconds

  constructor(gameData: GameData) {
    this.gameData = gameData;

    // Initialize chess instance with the starting FEN from database
    this.chess = new Chess(gameData.startingFen);

    // Detect AI game from gameData
    console.log("=== GAME SESSION CONSTRUCTOR DEBUG ===");
    console.log("gameData.gameData:", JSON.stringify(gameData.gameData, null, 2));
    console.log("gameData.gameData?.gameMode:", gameData.gameData?.gameMode);

    if (gameData.gameData?.gameMode === "AI") {
      this.isAIGame = true;
      this.aiDifficulty = (gameData.gameData.difficulty as "easy" | "medium" | "hard" | "expert") || "medium";
      // Player color from gameData
      const playerColor = gameData.gameData.playerColor;
      this.humanPlayerColor = playerColor === "white" ? "w" : "b";
      this.botColor = playerColor === "white" ? "b" : "w";
      console.log(`AI game detected - Player: ${this.humanPlayerColor}, Bot: ${this.botColor}, Difficulty: ${this.aiDifficulty}`);
    } else {
      console.log("NOT an AI game - gameMode:", gameData.gameData?.gameMode);
    }
    console.log("======================================");

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
    console.log("Is AI game?", this.isAIGame);
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

    // For AI games, start immediately when the human player joins
    if (this.isAIGame && !this.gameStarted && this.gameData.status === "IN_PROGRESS") {
      // Determine which player is the human
      const humanPlayerReferenceId = this.gameData.gameData?.playerReferenceId;
      const isHumanPlayer = userReferenceId === humanPlayerReferenceId;

      if (isHumanPlayer) {
        console.log("Human player joined AI game - starting immediately");
        await this.startAIGame(socket, userReferenceId);
        return;
      }
    }

    // For regular games, wait for both players
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
    const positionInfo = this.gameData.gameData?.positionInfo;

    const whitePayload: GameStartedPayload = {
      gameReferenceId: this.gameData.referenceId,
      yourColor: "w",
      fen: this.chess.fen(),
      whiteTime: this.clockManager.getTimeInSeconds("w"),
      blackTime: this.clockManager.getTimeInSeconds("b"),
      whitePlayer: this.whitePlayer.playerInfo,
      blackPlayer: this.blackPlayer.playerInfo,
      positionInfo: positionInfo || undefined,
    };

    const blackPayload: GameStartedPayload = {
      gameReferenceId: this.gameData.referenceId,
      yourColor: "b",
      fen: this.chess.fen(),
      whiteTime: this.clockManager.getTimeInSeconds("w"),
      blackTime: this.clockManager.getTimeInSeconds("b"),
      whitePlayer: this.whitePlayer.playerInfo,
      blackPlayer: this.blackPlayer.playerInfo,
      positionInfo: positionInfo || undefined,
    };

    this.whitePlayer.socket.emit("game_started", whitePayload);
    this.blackPlayer.socket.emit("game_started", blackPayload);

    console.log(`Game ${this.gameData.referenceId} started`);
  }

  /**
   * Start an AI game when the human player connects
   * In AI games, the bot doesn't have a socket - moves are sent from the client
   */
  private async startAIGame(socket: Socket, userReferenceId: string): Promise<void> {
    this.gameStarted = true;

    // Create bot player info
    const botPlayerInfo: PlayerInfo = {
      userReferenceId: this.gameData.gameData?.botReferenceId || "bot",
      name: this.gameData.gameData?.botName || "Chess Bot",
      code: "BOT",
      profilePictureUrl: null,
    };

    // Determine human player info
    const isCreator = userReferenceId === this.gameData.creator.userReferenceId;
    const humanPlayerInfo = isCreator ? this.gameData.creator : this.gameData.opponent!;

    // Create player connection for human
    const humanPlayer: PlayerConnection = {
      socket,
      userReferenceId,
      color: this.humanPlayerColor!,
      playerInfo: humanPlayerInfo,
    };

    // Assign white/black players based on configured color
    if (this.humanPlayerColor === "w") {
      this.whitePlayer = humanPlayer;
      // Create a virtual black player for the bot (no socket)
      this.blackPlayer = {
        socket: socket, // Use human's socket for broadcasts
        userReferenceId: botPlayerInfo.userReferenceId,
        color: "b",
        playerInfo: botPlayerInfo,
      };
    } else {
      this.blackPlayer = humanPlayer;
      // Create a virtual white player for the bot
      this.whitePlayer = {
        socket: socket, // Use human's socket for broadcasts
        userReferenceId: botPlayerInfo.userReferenceId,
        color: "w",
        playerInfo: botPlayerInfo,
      };
    }

    // Store references
    if (isCreator) {
      this.creatorPlayer = humanPlayer;
    } else {
      this.opponentPlayer = humanPlayer;
    }

    // Start the clock for whoever's turn it is according to the FEN
    const currentTurn = this.chess.turn();
    this.clockManager.startClock(currentTurn);
    console.log(`Starting clock for ${currentTurn === "w" ? "white" : "black"} (from FEN)`);

    // Emit game_started to the human player with AI game info
    const positionInfo = this.gameData.gameData?.positionInfo;
    const payload: GameStartedPayload = {
      gameReferenceId: this.gameData.referenceId,
      yourColor: this.humanPlayerColor!,
      fen: this.chess.fen(),
      whiteTime: this.clockManager.getTimeInSeconds("w"),
      blackTime: this.clockManager.getTimeInSeconds("b"),
      whitePlayer: this.whitePlayer!.playerInfo,
      blackPlayer: this.blackPlayer!.playerInfo,
      isAIGame: true,
      difficulty: this.aiDifficulty,
      positionInfo: positionInfo || undefined,
    };

    socket.emit("game_started", payload);
    console.log(`AI Game ${this.gameData.referenceId} started - Human: ${this.humanPlayerColor}, Bot: ${this.botColor}`);
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

    // In AI games, allow the human player's socket to make moves for both sides
    // The client sends bot moves from the human's socket
    if (this.isAIGame) {
      // In AI games, the human player can make moves for both colors
      // (they send their own moves AND the bot's moves computed client-side)
      const isHumanPlayer = player.color === this.humanPlayerColor;
      if (!isHumanPlayer) {
        socket.emit("move_error", { message: "You are not in this game" });
        return;
      }
      // Allow the move regardless of whose turn it is
      // The client will only send moves at the appropriate time
    } else {
      // Regular game: strict turn checking
      if (player.color !== currentTurn) {
        socket.emit("move_error", { message: "It's not your turn" });
        return;
      }
    }

    // Attempt the move
    let move: Move;
    try {
      move = this.chess.move({ from, to, promotion: promotion || "q" });
    } catch (error) {
      socket.emit("move_error", { message: "Invalid move" });
      return;
    }

    console.log(`Move made: ${move.san} in game ${this.gameData.referenceId}${this.isAIGame ? " (AI game)" : ""}`);

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

    // Broadcast to player (in AI games, just emit to the human player)
    if (this.isAIGame) {
      socket.emit("move_made", moveMadePayload);
    } else {
      this.broadcast("move_made", moveMadePayload);
    }

    // Check for game end conditions
    if (this.chess.isGameOver()) {
      await this.handleGameOver();
      return;
    }

    // Persist move to database (async, non-blocking)
    // For AI games, use the appropriate player reference ID
    const movePlayerId = this.isAIGame && currentTurn === this.botColor
      ? this.gameData.gameData?.botReferenceId || player.userReferenceId
      : player.userReferenceId;

    this.persistMoveToDb(movePlayerId, move).catch((error) => {
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

    // In AI games, if the human disconnects, end the game (bot wins)
    if (this.isAIGame && this.gameStarted && !this.gameEnded) {
      const isHumanPlayer = player.color === this.humanPlayerColor;
      if (isHumanPlayer) {
        console.log("Human player disconnected from AI game - starting grace period");
        // Start disconnect timer - if human doesn't reconnect, bot wins
        const timer = setTimeout(async () => {
          console.log("Human player did not reconnect to AI game - bot wins");
          const result: GameResult = this.botColor === "w" ? "CREATOR_WON" : "OPPONENT_WON";
          await this.endGame(result, this.botColor, "timeout");
        }, this.DISCONNECT_GRACE_PERIOD);
        this.disconnectTimers.set(player.userReferenceId, timer);
      }
      return;
    }

    // Regular game disconnect handling
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
      const positionInfo = this.gameData.gameData?.positionInfo;
      socket.emit("game_started", {
        gameReferenceId: this.gameData.referenceId,
        yourColor:
          this.whitePlayer?.userReferenceId === userReferenceId ? "w" : "b",
        fen: this.chess.fen(),
        whiteTime: this.clockManager.getTimeInSeconds("w"),
        blackTime: this.clockManager.getTimeInSeconds("b"),
        whitePlayer: this.whitePlayer!.playerInfo,
        blackPlayer: this.blackPlayer!.playerInfo,
        positionInfo: positionInfo || undefined,
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
   * Check if both players are present (or for AI games, just the human player)
   */
  public hasBothPlayers(): boolean {
    if (this.isAIGame) {
      // For AI games, we only need the human player
      return this.gameStarted;
    }
    return this.creatorPlayer !== null && this.opponentPlayer !== null;
  }

  /**
   * Check if this is an AI game
   */
  public getIsAIGame(): boolean {
    return this.isAIGame;
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
