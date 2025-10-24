# Chess Battle - WebSocket Architecture & Security Analysis

## Table of Contents
1. [Approach Analysis](#approach-analysis)
2. [Security Concerns & Cheating Vectors](#security-concerns--cheating-vectors)
3. [Recommended Architecture](#recommended-architecture)
4. [Class Diagrams](#class-diagrams)
5. [Anti-Cheat Implementation](#anti-cheat-implementation)
6. [Flow Diagrams](#flow-diagrams)
7. [Implementation Checklist](#implementation-checklist)
8. [Questions to Address](#questions-to-address)

---

## Approach Analysis

### ✅ What's GOOD About Current Approach:

1. **Server-side game initialization** - Correct! Never trust the client
2. **Room-based isolation** - Each game in its own Socket.IO room
3. **Random color assignment** - Fair and prevents manipulation
4. **Clock synchronization awareness** - Critical for timed chess games
5. **Database-first approach** - Game state persisted before socket connection

### ⚠️ Critical Issues to Address:

1. **Move Validation** - Must be 100% server-side
2. **Time Authority** - Server must be the ONLY source of truth for time
3. **State Management** - Client should never send game state, only move requests
4. **Race Conditions** - Handle simultaneous moves properly
5. **Disconnection Strategy** - What happens when player disconnects?
6. **Reconnection Logic** - How to restore game state seamlessly?

---

## Security Concerns & Cheating Vectors

### 1. 🚨 **Move Manipulation (CRITICAL PRIORITY)**

#### Attack Vectors:
- **Illegal Moves**: Client sends moves not allowed by chess rules
- **Out-of-Turn Moves**: Player makes move when it's opponent's turn
- **Move Injection**: Player modifies move data in transit
- **Replay Attacks**: Resending old valid moves

#### Solution:
```typescript
// SERVER VALIDATES EVERYTHING
function validateMove(game, socketId, moveRequest) {
  // 1. Verify player identity
  const player = getPlayerFromSocket(game, socketId);
  if (!player) throw new Error('Unauthorized');
  
  // 2. Verify turn
  if (game.currentTurn !== player.color) {
    throw new Error('Not your turn');
  }
  
  // 3. Validate move with chess.js (server-side)
  const result = game.chess.move(moveRequest.move);
  if (!result) throw new Error('Illegal move');
  
  // 4. Only AFTER validation, update state
  return result;
}
```

**Never trust client-side validation!**

---

### 2. 🚨 **Time Manipulation (HIGH PRIORITY)**

#### Attack Vectors:
- **Clock Tampering**: Modifying local clock to show more time
- **Timestamp Forgery**: Sending fake timestamps to server
- **Disconnect Exploits**: Disconnecting to pause clock
- **Lag Exploitation**: Artificial network delay when losing on time
- **Browser Tab Manipulation**: Switching tabs to pause JavaScript timers

#### Solution:
```typescript
class ServerTimeManager {
  private lastMoveTimestamp: number;
  private timeRemaining: { white: number; black: number };
  
  constructor(initialTime: number) {
    this.lastMoveTimestamp = Date.now();
    this.timeRemaining = { white: initialTime, black: initialTime };
  }
  
  makeMove(color: 'white' | 'black', increment: number) {
    const now = Date.now();
    const elapsed = now - this.lastMoveTimestamp;
    
    // Deduct time from current player
    this.timeRemaining[color] -= elapsed;
    
    // Add increment
    this.timeRemaining[color] += increment;
    
    // Check timeout
    if (this.timeRemaining[color] <= 0) {
      throw new TimeoutError(color);
    }
    
    // Update for next move
    this.lastMoveTimestamp = now;
    
    return this.timeRemaining;
  }
  
  getCurrentTime(currentTurn: 'white' | 'black'): TimeState {
    const now = Date.now();
    const elapsed = now - this.lastMoveTimestamp;
    
    return {
      white: this.timeRemaining.white - (currentTurn === 'white' ? elapsed : 0),
      black: this.timeRemaining.black - (currentTurn === 'black' ? elapsed : 0),
      lastUpdate: now
    };
  }
}
```

**Key Principle**: Server's `Date.now()` is the ONLY source of truth. Client timestamps are NEVER trusted.

---

### 3. 🔐 **State Injection Attacks**

#### Attack Vectors:
- **FEN Injection**: Client sends modified board position
- **Game State Override**: Client sends fake game state (different pieces, positions)
- **Score Manipulation**: Modifying captured pieces or material count

#### Solution:
**Client NEVER sends state, only move requests.**

```typescript
// ❌ NEVER DO THIS:
socket.on('game_update', (clientGameState) => {
  game.chess.load(clientGameState.fen); // VULNERABLE!
});

// ✅ CORRECT APPROACH:
socket.on('move_request', (moveData) => {
  // Client only sends: { move: 'e2e4' }
  // Server maintains all state
  const result = game.chess.move(moveData.move);
  // Broadcast SERVER state
  io.to(gameId).emit('move_made', {
    fen: game.chess.fen(),      // Server's truth
    pgn: game.chess.pgn(),      // Server's truth
    turn: game.chess.turn(),    // Server's truth
    time: serverTime.getCurrentTime()  // Server's truth
  });
});
```

---

### 4. 🔐 **Race Conditions**

#### Attack Vectors:
- **Simultaneous Moves**: Both players send moves at same time
- **Double Move**: Player sends multiple moves before server responds
- **Move Queue Manipulation**: Overwhelming server with move requests

#### Solution:
```typescript
class GameLock {
  private processing = false;
  private moveQueue: MoveRequest[] = [];
  
  async processMove(move: MoveRequest) {
    // Add to queue
    this.moveQueue.push(move);
    
    // If already processing, wait
    if (this.processing) return;
    
    this.processing = true;
    
    while (this.moveQueue.length > 0) {
      const nextMove = this.moveQueue.shift()!;
      
      try {
        await this.executeMove(nextMove);
      } catch (error) {
        // Notify player of error
        this.notifyError(nextMove.socketId, error);
      }
    }
    
    this.processing = false;
  }
}

// Rate limiting per player
const moveRateLimit = new Map<string, number>();

function checkRateLimit(playerId: string): boolean {
  const lastMove = moveRateLimit.get(playerId) || 0;
  const now = Date.now();
  
  if (now - lastMove < 100) { // Min 100ms between moves
    return false;
  }
  
  moveRateLimit.set(playerId, now);
  return true;
}
```

---

### 5. 🔐 **Disconnection Exploits**

#### Attack Vectors:
- **Rage Quit**: Disconnect when losing to avoid defeat
- **Clock Pause**: Disconnect to pause their clock
- **Reconnect Spam**: Repeatedly disconnect/reconnect to disrupt game
- **Fake Disconnections**: Simulating network issues

#### Solution:
```typescript
class DisconnectionHandler {
  private disconnectedPlayers = new Map<string, DisconnectInfo>();
  
  onDisconnect(game: ChessGame, socketId: string) {
    const player = game.getPlayerBySocket(socketId);
    if (!player) return;
    
    // Mark as disconnected but KEEP CLOCK RUNNING
    this.disconnectedPlayers.set(player.userId, {
      disconnectTime: Date.now(),
      color: player.color,
      gameId: game.id
    });
    
    // Notify opponent
    game.broadcast('opponent_disconnected', {
      color: player.color,
      gracePeriod: 30000 // 30 seconds
    });
    
    // Set forfeit timer
    setTimeout(() => {
      if (this.disconnectedPlayers.has(player.userId)) {
        // Player didn't reconnect - forfeit
        this.endGameByForfeit(game, player.color);
      }
    }, 30000);
  }
  
  onReconnect(userId: string, newSocketId: string) {
    const disconnectInfo = this.disconnectedPlayers.get(userId);
    if (!disconnectInfo) return;
    
    const game = GameManager.getGame(disconnectInfo.gameId);
    if (!game) return;
    
    // Update socket ID
    game.updatePlayerSocket(userId, newSocketId);
    
    // Remove from disconnected list
    this.disconnectedPlayers.delete(userId);
    
    // Send full game state to reconnected player
    const fullState = game.getFullState();
    io.to(newSocketId).emit('game_restored', fullState);
    
    // Notify opponent
    game.broadcast('opponent_reconnected', {
      color: disconnectInfo.color
    });
  }
}
```

**Key Points**:
- Clock NEVER stops during disconnection
- Grace period before forfeit (30 seconds)
- Reconnection restores exact game state
- Opponent is notified of disconnect/reconnect

---

### 6. 🔐 **Authentication & Authorization**

#### Attack Vectors:
- **Socket Hijacking**: Attacker connects with another player's socket
- **Unauthorized Join**: Non-participant joins game room
- **Spectator Manipulation**: Spectator tries to make moves
- **Multi-Account**: Same person controlling both players

#### Solution:
```typescript
// Authenticate socket connection
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;
  
  try {
    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { referenceId: userId }
    });
    
    if (!user) throw new Error('User not found');
    
    // Store user info in socket
    socket.data.userId = user.id;
    socket.data.userReferenceId = user.referenceId;
    
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Authorize game actions
function authorizeGameAction(game: ChessGame, socketId: string): boolean {
  const userId = getSocketUserId(socketId);
  
  // Check if user is a participant
  return game.isParticipant(userId);
}

// Before processing any move
socket.on('move_request', (moveData) => {
  const game = GameManager.getGame(moveData.gameId);
  
  if (!authorizeGameAction(game, socket.id)) {
    socket.emit('error', { message: 'Unauthorized' });
    return;
  }
  
  // Process move...
});
```

---

## Recommended Architecture

### **Server-Authoritative Model** (Non-negotiable)

The server is the SINGLE SOURCE OF TRUTH for:
- ✅ Board position
- ✅ Legal moves
- ✅ Time remaining
- ✅ Whose turn it is
- ✅ Game outcome

Clients are:
- ❌ NOT trusted for validation
- ❌ NOT trusted for time tracking
- ❌ NOT trusted for state
- ✅ ONLY send move requests
- ✅ ONLY render what server tells them

---

### Communication Flow

```
CLIENT (White)          SOCKET.IO SERVER           CLIENT (Black)
     |                        |                          |
     |                        |                          |
  [1] Create Game via API    |                          |
     |------------------->    |                          |
     |    Game created        |                          |
     |    DB record saved     |                          |
     |<-------------------    |                          |
     |                        |                          |
  [2] Connect to Socket       |                          |
     |--connect(userId)-->    |                          |
     |                   [Authenticate]                  |
     |                   [Create GameSession]            |
     |                   [Init chess.js]                 |
     |                   [Assign WHITE]                  |
     |<--joined_as_white--    |                          |
     |<--waiting_opponent-    |                          |
     |                        |                          |
     |                        |    [3] Join via API      |
     |                        |    Opponent clicks join  |
     |                        |<-------------------------| 
     |                        |    Join successful       |
     |                        |    DB updated            |
     |                        |------------------------->|
     |                        |                          |
     |                        |    [4] Connect Socket    |
     |                        |<--connect(userId)--------|
     |                   [Authenticate]                  |
     |                   [Validate game participant]     |
     |                   [Assign BLACK]                  |
     |                   [Start game timer]              |
     |<-----game_started------------------->             |
     |  { white: {...}, black: {...} }                   |
     |  { fen: 'starting position' }                     |
     |  { turn: 'white' }                                |
     |  { time: { white: 600, black: 600 } }            |
     |                        |                          |
  [5] Make Move: e2e4         |                          |
     |--move_request-------->  |                          |
     |                    [VALIDATE]                     |
     |                    1. Is WHITE's turn? ✓          |
     |                    2. Is move legal? ✓            |
     |                    3. Has time? ✓                 |
     |                    [Execute move]                 |
     |                    [Update chess.js]              |
     |                    [Deduct time + increment]      |
     |                    [Switch turn to BLACK]         |
     |<------move_made---------------------------->      |
     |  { move: 'e4', from: 'e2', to: 'e4' }            |
     |  { fen: 'updated position' }                      |
     |  { turn: 'black' }                                |
     |  { time: { white: 605, black: 600 } }            |
     |                        |                          |
     |                        |  [6] Black's turn        |
     |                        |<--move_request(e7e5)-----|
     |                    [VALIDATE]                     |
     |                    [Execute move]                 |
     |<------move_made---------------------------->      |
     |                        |                          |
  [7] Time Updates (every 100ms)                        |
     |<------time_tick---------------------------->      |
     |  { white: 604.9, black: 599.1 }                  |
     |                        |                          |
  [8] Game End (checkmate)    |                          |
     |--move_request-------->  |                          |
     |                    [Execute move]                 |
     |                    [Detect checkmate]             |
     |                    [Save to DB]                   |
     |                    [Unlock stakes]                |
     |                    [Transfer winnings]            |
     |<------game_ended---------------------------->     |
     |  { result: 'checkmate', winner: 'white' }        |
     |  { payout: { winner: 18, loser: 0, fee: 2 } }   |
```

---

## Class Diagrams

### Core Classes

```typescript
// ============================================
// GAME MANAGER (Singleton)
// ============================================
class GameManager {
  private static instance: GameManager;
  private activeGames: Map<string, ChessGameSession>;
  private socketToGame: Map<string, string>; // socketId -> gameId
  
  static getInstance(): GameManager;
  
  createGame(
    gameReferenceId: string,
    creatorUserId: bigint,
    config: GameConfig
  ): ChessGameSession;
  
  joinGame(
    gameReferenceId: string,
    opponentUserId: bigint,
    socketId: string
  ): void;
  
  getGameBySocket(socketId: string): ChessGameSession | null;
  
  getGame(gameReferenceId: string): ChessGameSession | null;
  
  removeGame(gameReferenceId: string): void;
  
  handleDisconnect(socketId: string): void;
  
  handleReconnect(userId: bigint, socketId: string): void;
}

// ============================================
// CHESS GAME SESSION
// ============================================
class ChessGameSession {
  readonly gameId: string;
  readonly gameReferenceId: string;
  private chess: Chess; // chess.js instance
  private players: {
    white: PlayerInfo;
    black: PlayerInfo;
  };
  private config: GameConfig;
  private timeManager: TimeManager;
  private moveHistory: ExtendedMove[];
  private status: GameStatus;
  private room: string; // Socket.IO room name
  
  constructor(
    gameReferenceId: string,
    config: GameConfig,
    creatorId: bigint
  );
  
  // Player Management
  addPlayer(userId: bigint, socketId: string, color: 'white' | 'black'): void;
  getPlayerBySocket(socketId: string): PlayerInfo | null;
  getPlayerByUserId(userId: bigint): PlayerInfo | null;
  updatePlayerSocket(userId: bigint, newSocketId: string): void;
  isParticipant(userId: bigint): boolean;
  
  // Game Actions
  start(): void;
  makeMove(socketId: string, move: string): MoveResult;
  resign(socketId: string): GameEndResult;
  offerDraw(socketId: string): void;
  acceptDraw(socketId: string): GameEndResult;
  
  // State Queries
  getFullState(): GameState;
  getCurrentPosition(): string; // FEN
  getTurn(): 'white' | 'black';
  isGameOver(): boolean;
  getGameResult(): GameEndResult | null;
  
  // Broadcasting
  broadcast(event: string, data: any): void;
  emitToPlayer(color: 'white' | 'black', event: string, data: any): void;
  
  // Persistence
  async saveToDatabase(): Promise<void>;
}

// ============================================
// TIME MANAGER
// ============================================
class TimeManager {
  private timeRemaining: { white: number; black: number };
  private lastMoveTimestamp: number;
  private currentTurn: 'white' | 'black';
  private increment: number;
  private tickInterval: NodeJS.Timer | null;
  
  constructor(initialTime: number, increment: number);
  
  start(startingColor: 'white' | 'black'): void;
  
  makeMove(color: 'white' | 'black'): TimeState;
  
  getCurrentTime(): TimeState;
  
  hasTimeRemaining(color: 'white' | 'black'): boolean;
  
  pause(): void;
  
  resume(): void;
  
  stop(): void;
  
  startTickBroadcast(broadcastFn: (time: TimeState) => void): void;
  
  stopTickBroadcast(): void;
}

// ============================================
// MOVE VALIDATOR
// ============================================
class MoveValidator {
  static validateTurn(
    game: ChessGameSession,
    socketId: string
  ): ValidationResult;
  
  static validateMove(
    chess: Chess,
    move: string
  ): ValidationResult;
  
  static validateTime(
    timeManager: TimeManager,
    color: 'white' | 'black'
  ): ValidationResult;
  
  static validateAll(
    game: ChessGameSession,
    socketId: string,
    move: string
  ): ValidationResult;
}

// ============================================
// GAME END HANDLER
// ============================================
class GameEndHandler {
  static async handleCheckmate(
    game: ChessGameSession,
    winner: 'white' | 'black'
  ): Promise<GameEndResult>;
  
  static async handleStalemate(
    game: ChessGameSession
  ): Promise<GameEndResult>;
  
  static async handleTimeout(
    game: ChessGameSession,
    loser: 'white' | 'black'
  ): Promise<GameEndResult>;
  
  static async handleResignation(
    game: ChessGameSession,
    loser: 'white' | 'black'
  ): Promise<GameEndResult>;
  
  static async handleDraw(
    game: ChessGameSession
  ): Promise<GameEndResult>;
  
  static async handleForfeit(
    game: ChessGameSession,
    loser: 'white' | 'black'
  ): Promise<GameEndResult>;
  
  private static async updateDatabase(
    game: ChessGameSession,
    result: GameEndResult
  ): Promise<void>;
  
  private static async distributeWinnings(
    game: ChessGameSession,
    result: GameEndResult
  ): Promise<void>;
}

// ============================================
// TYPE DEFINITIONS
// ============================================
interface PlayerInfo {
  userId: bigint;
  socketId: string;
  color: 'white' | 'black';
  connected: boolean;
  disconnectTime?: number;
}

interface GameConfig {
  stakeAmount: number;
  initialTimeSeconds: number;
  incrementSeconds: number;
  platformFeePercentage: number;
}

interface GameState {
  gameId: string;
  fen: string;
  pgn: string;
  turn: 'white' | 'black';
  status: GameStatus;
  players: {
    white: { name: string; userId: bigint };
    black: { name: string; userId: bigint };
  };
  time: TimeState;
  moveHistory: ExtendedMove[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
}

interface TimeState {
  white: number;
  black: number;
  lastUpdate: number;
}

interface MoveResult {
  success: boolean;
  move?: ExtendedMove;
  fen?: string;
  turn?: 'white' | 'black';
  time?: TimeState;
  gameEnd?: GameEndResult;
  error?: string;
}

interface GameEndResult {
  result: 'checkmate' | 'stalemate' | 'timeout' | 'resignation' | 'draw' | 'forfeit';
  winner: 'white' | 'black' | null;
  payout: {
    winner: number;
    loser: number;
    platformFee: number;
  };
}

type GameStatus = 'waiting' | 'active' | 'paused' | 'ended';

interface ExtendedMove {
  from: string;
  to: string;
  piece: string;
  captured?: string;
  promotion?: string;
  flags: string;
  san: string;
  timestamp: number;
  timeRemaining: TimeState;
}
```

---

## Anti-Cheat Implementation

### 1. Move Validation Pipeline

```typescript
async function handleMoveRequest(
  socket: Socket,
  data: { gameId: string; move: string }
) {
  const gameManager = GameManager.getInstance();
  const game = gameManager.getGameBySocket(socket.id);
  
  if (!game) {
    socket.emit('error', { message: 'Game not found' });
    return;
  }
  
  // STEP 1: Rate limiting
  if (!checkRateLimit(socket.data.userId)) {
    socket.emit('error', { message: 'Too many requests' });
    return;
  }
  
  // STEP 2: Get player info
  const player = game.getPlayerBySocket(socket.id);
  if (!player) {
    socket.emit('error', { message: 'Player not found' });
    return;
  }
  
  // STEP 3: Validate turn
  if (game.getTurn() !== player.color) {
    socket.emit('error', { message: 'Not your turn' });
    return;
  }
  
  // STEP 4: Validate time
  const timeValid = game.timeManager.hasTimeRemaining(player.color);
  if (!timeValid) {
    await GameEndHandler.handleTimeout(game, player.color);
    return;
  }
  
  // STEP 5: Validate move with chess.js
  try {
    const result = game.makeMove(socket.id, data.move);
    
    if (!result.success) {
      socket.emit('move_rejected', { error: result.error });
      return;
    }
    
    // STEP 6: Broadcast validated move
    game.broadcast('move_made', {
      move: result.move,
      fen: result.fen,
      turn: result.turn,
      time: result.time
    });
    
    // STEP 7: Check game end
    if (result.gameEnd) {
      game.broadcast('game_ended', result.gameEnd);
      await game.saveToDatabase();
      gameManager.removeGame(game.gameReferenceId);
    }
    
    // STEP 8: Persist move
    await game.saveToDatabase();
    
  } catch (error) {
    console.error('Move processing error:', error);
    socket.emit('error', { message: 'Failed to process move' });
  }
}
```

### 2. Time Synchronization

```typescript
class TimeManager {
  private tickInterval: NodeJS.Timer | null = null;
  
  startTickBroadcast(broadcastFn: (time: TimeState) => void) {
    // Broadcast time updates every 100ms
    this.tickInterval = setInterval(() => {
      const currentTime = this.getCurrentTime();
      
      // Check for timeout
      if (currentTime.white <= 0) {
        this.handleTimeout('white');
        return;
      }
      if (currentTime.black <= 0) {
        this.handleTimeout('black');
        return;
      }
      
      // Broadcast current time
      broadcastFn(currentTime);
    }, 100);
  }
  
  getCurrentTime(): TimeState {
    const now = Date.now();
    const elapsed = now - this.lastMoveTimestamp;
    
    const whiteTime = this.currentTurn === 'white'
      ? this.timeRemaining.white - elapsed
      : this.timeRemaining.white;
      
    const blackTime = this.currentTurn === 'black'
      ? this.timeRemaining.black - elapsed
      : this.timeRemaining.black;
    
    return {
      white: Math.max(0, whiteTime),
      black: Math.max(0, blackTime),
      lastUpdate: now
    };
  }
  
  makeMove(color: 'white' | 'black'): TimeState {
    const now = Date.now();
    const elapsed = now - this.lastMoveTimestamp;
    
    // Deduct time from player who just moved
    this.timeRemaining[color] = 
      this.timeRemaining[color] - elapsed + (this.increment * 1000);
    
    // Ensure no negative time
    if (this.timeRemaining[color] < 0) {
      throw new TimeoutError(color);
    }
    
    // Switch turn
    this.currentTurn = color === 'white' ? 'black' : 'white';
    
    // Reset timestamp
    this.lastMoveTimestamp = now;
    
    return this.getCurrentTime();
  }
}
```

### 3. Comprehensive Logging

```typescript
class GameLogger {
  static async logMove(
    gameId: string,
    userId: bigint,
    move: ExtendedMove,
    timestamp: number
  ) {
    await prisma.gameLog.create({
      data: {
        gameId,
        userId,
        action: 'MOVE',
        data: {
          move: move.san,
          from: move.from,
          to: move.to,
          fen: move.fen,
          timeRemaining: move.timeRemaining
        },
        timestamp: new Date(timestamp)
      }
    });
  }
  
  static async logGameEnd(
    gameId: string,
    result: GameEndResult,
    timestamp: number
  ) {
    await prisma.gameLog.create({
      data: {
        gameId,
        action: 'GAME_END',
        data: result,
        timestamp: new Date(timestamp)
      }
    });
  }
  
  static async logSuspiciousActivity(
    gameId: string,
    userId: bigint,
    reason: string,
    data: any
  ) {
    await prisma.suspiciousActivity.create({
      data: {
        gameId,
        userId,
        reason,
        data,
        timestamp: new Date()
      }
    });
  }
}
```

---

## Flow Diagrams

### 1. Game Creation & Connection Flow

```
┌─────────────┐              ┌─────────────┐              ┌──────────────┐
│  Challenger │              │   Next.js   │              │   Database   │
│   (White)   │              │     API     │              │  (Postgres)  │
└──────┬──────┘              └──────┬──────┘              └──────┬───────┘
       │                            │                            │
       │  POST /api/chess/          │                            │
       │  create-game               │                            │
       ├───────────────────────────>│                            │
       │                            │   Create game record       │
       │                            │   Lock stake in wallet     │
       │                            ├───────────────────────────>│
       │                            │                            │
       │                            │<───────────────────────────┤
       │  { gameReferenceId,        │   Game created             │
       │    inviteCode }            │                            │
       │<───────────────────────────┤                            │
       │                            │                            │
       │                                                         │
       │                     ┌──────────────┐                   │
       │                     │  Socket.IO   │                   │
       │                     │    Server    │                   │
       │                     └──────┬───────┘                   │
       │                            │                            │
       │  connect({ userId,         │                            │
       │            gameRefId })    │                            │
       ├───────────────────────────>│                            │
       │                            │   Authenticate             │
       │                            │   Create GameSession       │
       │                            │   Assign color (WHITE)     │
       │                            │   Join room                │
       │                            │                            │
       │  { status: 'waiting',      │                            │
       │    color: 'white' }        │                            │
       │<───────────────────────────┤                            │
       │                            │                            │
       │  waiting_for_opponent      │                            │
       │<───────────────────────────┤                            │
       │                            │                            │
```

### 2. Opponent Join Flow

```
┌─────────────┐              ┌─────────────┐              ┌──────────────┐              ┌──────────────┐
│  Opponent   │              │   Next.js   │              │   Database   │              │  Socket.IO   │
│   (Black)   │              │     API     │              │  (Postgres)  │              │    Server    │
└──────┬──────┘              └──────┬──────┘              └──────┬───────┘              └──────┬───────┘
       │                            │                            │                            │
       │  GET /api/chess/game/      │                            │                            │
       │  {inviteCode}              │                            │                            │
       ├───────────────────────────>│                            │                            │
       │                            │   Fetch game details       │                            │
       │                            ├───────────────────────────>│                            │
       │                            │<───────────────────────────┤                            │
       │  { game details }          │                            │                            │
       │<───────────────────────────┤                            │                            │
       │                            │                            │                            │
       │  POST /api/chess/join      │                            │                            │
       ├───────────────────────────>│                            │                            │
       │                            │   Update game              │                            │
       │                            │   Lock opponent stake      │                            │
       │                            │   Set status: IN_PROGRESS  │                            │
       │                            ├───────────────────────────>│                            │
       │                            │<───────────────────────────┤                            │
       │  { success: true }         │                            │                            │
       │<───────────────────────────┤                            │                            │
       │                            │                            │                            │
       │  connect({ userId,         │                            │                            │
       │            gameRefId })    │                            │                            │
       ├────────────────────────────┼────────────────────────────┼───────────────────────────>│
       │                            │                            │   Authenticate             │
       │                            │                            │   Find GameSession         │
       │                            │                            │   Assign color (BLACK)     │
       │                            │                            │   Start game               │
       │                            │                            │                            │
       │  { status: 'active', color: 'black' }                  │                            │
       │<───────────────────────────┼────────────────────────────┼────────────────────────────┤
       │                            │                            │                            │
       │                            │                            │   Broadcast to both        │
       │  game_started { white: ..., black: ..., fen, time }    │                            │
       │<═══════════════════════════════════════════════════════════════════════════════════════
       │                            │                            │                            │
```

### 3. Move Processing Flow

```
┌─────────────┐                          ┌──────────────┐                         ┌─────────────┐
│   White     │                          │  Socket.IO   │                         │   Black     │
│   Player    │                          │    Server    │                         │   Player    │
└──────┬──────┘                          └──────┬───────┘                         └──────┬──────┘
       │                                        │                                        │
       │  move_request                          │                                        │
       │  { move: 'e2e4' }                      │                                        │
       ├───────────────────────────────────────>│                                        │
       │                                        │                                        │
       │                                 ┌──────▼──────┐                                 │
       │                                 │   VALIDATE  │                                 │
       │                                 │             │                                 │
       │                                 │ 1. Turn?    │                                 │
       │                                 │ 2. Legal?   │                                 │
       │                                 │ 3. Time?    │                                 │
       │                                 └──────┬──────┘                                 │
       │                                        │                                        │
       │                                 ┌──────▼──────┐                                 │
       │                                 │   EXECUTE   │                                 │
       │                                 │             │                                 │
       │                                 │ chess.move()│                                 │
       │                                 │ Update time │                                 │
       │                                 │ Switch turn │                                 │
       │                                 │ Check end   │                                 │
       │                                 └──────┬──────┘                                 │
       │                                        │                                        │
       │  move_made                             │      move_made                         │
       │  { move, fen, turn, time }             │      { move, fen, turn, time }         │
       │<───────────────────────────────────────┼───────────────────────────────────────>│
       │                                        │                                        │
       │                                        │                                        │
       │                                        │  move_request                          │
       │                                        │  { move: 'e7e5' }                      │
       │                                        │<───────────────────────────────────────┤
       │                                        │                                        │
       │                                 ┌──────▼──────┐                                 │
       │                                 │   VALIDATE  │                                 │
       │                                 └──────┬──────┘                                 │
       │                                        │                                        │
       │                                 ┌──────▼──────┐                                 │
       │                                 │   EXECUTE   │                                 │
       │                                 └──────┬──────┘                                 │
       │                                        │                                        │
       │  move_made                             │      move_made                         │
       │<───────────────────────────────────────┼───────────────────────────────────────>│
       │                                        │                                        │
```

---

## Implementation Checklist

### Phase 1: Core Socket.IO Setup
- [ ] Set up Socket.IO server in `apps/web-socket/`
- [ ] Implement socket authentication middleware
- [ ] Create GameManager singleton
- [ ] Set up room management

### Phase 2: Game Session Management
- [ ] Implement ChessGameSession class
- [ ] Initialize chess.js instance per game
- [ ] Implement player join logic
- [ ] Implement color assignment (random)
- [ ] Implement game start broadcast

### Phase 3: Time Management
- [ ] Create TimeManager class
- [ ] Implement server-side time tracking
- [ ] Implement time deduction on move
- [ ] Implement increment logic
- [ ] Implement time broadcast (100ms intervals)
- [ ] Implement timeout detection

### Phase 4: Move Validation & Processing
- [ ] Create MoveValidator class
- [ ] Implement turn validation
- [ ] Implement move legality check (chess.js)
- [ ] Implement time check before move
- [ ] Implement move processing pipeline
- [ ] Implement move broadcast
- [ ] Implement rate limiting

### Phase 5: Game End Handling
- [ ] Create GameEndHandler class
- [ ] Implement checkmate detection
- [ ] Implement stalemate detection
- [ ] Implement timeout handling
- [ ] Implement resignation
- [ ] Implement draw offers
- [ ] Implement database update on game end
- [ ] Implement payout distribution

### Phase 6: Disconnection Handling
- [ ] Implement disconnect detection
- [ ] Implement grace period timer
- [ ] Implement reconnection logic
- [ ] Implement game state restoration
- [ ] Implement forfeit on timeout

### Phase 7: Security & Anti-Cheat
- [ ] Implement authentication on socket connect
- [ ] Implement authorization for game actions
- [ ] Implement rate limiting
- [ ] Implement move queue with locks
- [ ] Implement comprehensive logging
- [ ] Implement suspicious activity detection

### Phase 8: Database Integration
- [ ] Save game state after each move
- [ ] Update game status in database
- [ ] Create transaction records
- [ ] Update wallet locked amounts
- [ ] Create game logs table
- [ ] Implement game replay functionality

### Phase 9: Testing
- [ ] Unit tests for each class
- [ ] Integration tests for move flow
- [ ] Test time synchronization
- [ ] Test disconnection scenarios
- [ ] Test concurrent games
- [ ] Load testing
- [ ] Security penetration testing

### Phase 10: Frontend Integration
- [ ] Socket.IO client setup
- [ ] Game board rendering
- [ ] Move input handling
- [ ] Clock display
- [ ] Game state synchronization
- [ ] Disconnection UI
- [ ] Game end UI

---

## Questions to Address Before Implementation

### 1. **Reconnection Policy**
**Question**: What happens to the clock when a player disconnects?

**Options**:
- **A) Keep clock running** (recommended for competitive play)
  - Pros: Prevents disconnect exploits
  - Cons: Player might lose on time due to network issues
  
- **B) Pause clock**
  - Pros: More forgiving for network issues
  - Cons: Can be exploited (disconnect when thinking)

**Recommendation**: Keep clock running with 30-second grace period before forfeit.

---

### 2. **Abandonment Timeout**
**Question**: How long to wait before declaring a disconnected player forfeited?

**Options**:
- **A) 30 seconds** (recommended)
- **B) 1 minute**
- **C) 2 minutes**

**Recommendation**: 30 seconds - long enough for legitimate reconnects, short enough to prevent griefing.

---

### 3. **Draw Mechanics**
**Question**: How should draw offers work?

**Options**:
- **A) Explicit draw offer/accept system**
  - Player offers draw
  - Opponent can accept or decline
  - Offer expires after opponent makes next move
  
- **B) Mutual agreement only**
  - Both players must request draw simultaneously
  
- **C) Automatic draws**
  - Stalemate
  - Insufficient material
  - Three-fold repetition
  - 50-move rule

**Recommendation**: Implement both A and C.

---

### 4. **Spectators**
**Question**: Should we allow spectators to watch ongoing games?

**Consideration**: If yes:
- Need separate socket room or permission level
- Should spectators see time?
- Should spectators be listed?
- Can add this feature later

**Recommendation**: Not in MVP, add later if needed.

---

### 5. **Database Synchronization Frequency**
**Question**: How often should we save game state to database?

**Options**:
- **A) After every move** (recommended for security)
  - Pros: Always recoverable, audit trail
  - Cons: More database writes
  
- **B) Every N moves**
  - Pros: Less database load
  - Cons: Possible data loss
  
- **C) Only on game end**
  - Pros: Minimal writes
  - Cons: No recovery on server crash

**Recommendation**: After every move + periodic snapshots (every 10 seconds).

---

### 6. **Move Undo/Takeback**
**Question**: Should players be able to undo moves?

**Recommendation**: No - this is for competitive play with stakes. No takebacks.

---

### 7. **Pre-moves**
**Question**: Should players be allowed to queue their next move while opponent is thinking?

**Consideration**:
- Common in online chess
- Saves time
- Requires careful implementation to prevent issues

**Recommendation**: Not in MVP, can add later if desired.

---

### 8. **Game Abandonment**
**Question**: What if someone creates a game but never connects to socket?

**Solution**:
- Game expires after 1 hour (already in DB)
- Cron job returns locked stake
- Clean up socket rooms

---

### 9. **Server Crash Recovery**
**Question**: What happens if Socket.IO server crashes mid-game?

**Solution**:
- Save game state to database after each move
- On server restart:
  - Load active games from database
  - Wait for players to reconnect
  - Restore game state
- If players don't reconnect within 5 minutes:
  - Declare draw
  - Return both stakes (minus fee)

---

### 10. **Time Zone Issues**
**Question**: How to handle players in different time zones?

**Solution**: Always use Unix timestamps (milliseconds since epoch). Time zones don't matter when using `Date.now()` on server.

---

## Security Best Practices Summary

### ✅ DO:
1. **Validate everything on server**
2. **Use server timestamps only**
3. **Persist state after each move**
4. **Rate limit all requests**
5. **Authenticate socket connections**
6. **Log all actions**
7. **Use transaction locks**
8. **Check authorization for every action**
9. **Handle disconnections gracefully**
10. **Test edge cases extensively**

### ❌ DON'T:
1. **Trust client timestamps**
2. **Trust client move validation**
3. **Allow client to send game state**
4. **Process moves without validation**
5. **Stop clock on disconnect (exploitable)**
6. **Allow unlimited move requests**
7. **Skip authentication**
8. **Forget to handle edge cases**
9. **Expose internal server state**
10. **Skip logging**

---

## Recommended Tech Stack

- **Socket.IO** v4.x - WebSocket communication
- **chess.js** - Chess move validation and logic
- **Prisma** - Database ORM
- **TypeScript** - Type safety
- **express** - HTTP server for Socket.IO
- **ioredis** (optional) - For scaling across multiple servers

---

## Next Steps

1. **Review this document** with your team
2. **Answer the questions** in the Questions section
3. **Create implementation plan** with detailed tasks
4. **Set up project structure**
5. **Begin Phase 1 implementation**

---

## Conclusion

The proposed architecture is **server-authoritative**, which is the ONLY secure approach for a competitive chess game with real money stakes. The server is the single source of truth for all game state, time tracking, and move validation.

Key principles:
- **Never trust the client**
- **Validate everything**
- **Log everything**
- **Handle edge cases**
- **Test thoroughly**

With proper implementation of the security measures outlined in this document, the system will be resistant to common cheating methods while providing a smooth user experience.

**Ready to implement when you are!**

