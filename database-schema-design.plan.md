# Database Schema for Chess Betting Platform

## Schema Overview

The schema will include 5 main tables: **User**, **Wallet**, **Transaction**, **Game**, and **UserStats**. All tables use a dual-ID strategy: auto-increment BigInt `id` for internal foreign keys (performance) and UUID `referenceId` for external API references (security).

## Tables and Fields

### 1. User Table

Stores user profile information from Google OAuth:

- `id` (BigInt, auto-increment, primary key) - Internal ID for foreign keys
- `referenceId` (String/UUID, unique, indexed, default: cuid()) - External reference for API/URLs
- `code` (String, unique, indexed) - Unique user code for game URLs (e.g., "PLAYER123" or "john_doe")
- `googleId` (String, unique, indexed)
- `email` (String, unique, indexed)
- `name` (String)
- `profilePictureUrl` (String, nullable)
- `dateOfBirth` (DateTime, nullable)
- `isActive` (Boolean, default true) - for soft deletes
- `createdAt`, `updatedAt` (DateTime)

**Relations**: One wallet, many transactions, many games (as creator or opponent), one stats record

**Note**: The `code` field can be auto-generated or user-selected during registration. Game URLs could be structured as `/game/{userCode}/{gameInviteCode}` or just use the game's `inviteCode` directly.

### 2. Wallet Table

One-to-one with User, stores current balance:

- `id` (BigInt, auto-increment, primary key) - Internal ID
- `referenceId` (String/UUID, unique, indexed, default: cuid()) - External reference
- `userId` (BigInt, foreign key to User.id, unique)
- `balance` (Decimal, default 0) - Use Decimal for precise money handling
- `lockedAmount` (Decimal, default 0) - Money locked in active games
- `updatedAt` (DateTime)

**Important**: `lockedAmount` tracks money in active games to prevent double-spending. Available balance = balance - lockedAmount

### 3. Transaction Table

Immutable ledger of all financial operations:

- `id` (BigInt, auto-increment, primary key) - Internal ID
- `referenceId` (String/UUID, unique, indexed, default: cuid()) - External reference
- `userId` (BigInt, foreign key to User.id, indexed)
- `gameId` (BigInt, foreign key to Game.id, nullable, indexed) - null for deposits/withdrawals
- `type` (Enum: DEPOSIT, WITHDRAWAL, GAME_STAKE, GAME_WIN, GAME_DRAW_REFUND, PLATFORM_FEE, GAME_EXPIRED_REFUND)
- `amount` (Decimal) - Always positive; type indicates direction
- `balanceAfter` (Decimal) - Snapshot for audit trail
- `status` (Enum: PENDING, COMPLETED, FAILED)
- `metadata` (Json, nullable) - Store payment gateway info, etc.
- `description` (String)
- `createdAt` (DateTime, indexed)

**Key Design**: Immutable records with status tracking. GAME_STAKE debits when game created, GAME_WIN credits winner, PLATFORM_FEE records fee taken.

### 4. Game Table

Stores chess game details and betting info:

- `id` (BigInt, auto-increment, primary key) - Internal ID
- `referenceId` (String/UUID, unique, indexed, default: cuid()) - External reference
- `creatorId` (BigInt, foreign key to User.id, indexed)
- `opponentId` (BigInt, foreign key to User.id, nullable, indexed)
- `stakeAmount` (Decimal) - Amount each player stakes
- `totalPot` (Decimal) - stakeAmount * 2
- `platformFeePercentage` (Decimal) - Stored at creation (e.g., 5.0 for 5%)
- `platformFeeAmount` (Decimal) - Calculated fee in currency
- `status` (Enum: WAITING_FOR_OPPONENT, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED)
- `result` (Enum: CREATOR_WON, OPPONENT_WON, DRAW, CREATOR_TIMEOUT, OPPONENT_TIMEOUT, nullable)
- `winnerId` (BigInt, foreign key to User.id, nullable)
- **Time Control Fields:**
  - `initialTimeSeconds` (Int) - Starting time for each player (e.g., 180 for 3 minutes)
  - `incrementSeconds` (Int) - Time added after each move (e.g., 2 seconds)
  - `creatorTimeRemaining` (Int) - Creator's remaining time in seconds
  - `opponentTimeRemaining` (Int) - Opponent's remaining time in seconds
  - `lastMoveAt` (DateTime, nullable) - Timestamp of last move for time calculation
- `gameData` (Json) - Chess moves, board state, PGN notation, move history with timestamps
- `inviteCode` (String, unique, indexed) - Shareable code for joining
- `expiresAt` (DateTime) - 5 minutes from creation if no opponent
- `startedAt` (DateTime, nullable) - When opponent joined
- `completedAt` (DateTime, nullable)
- `createdAt`, `updatedAt` (DateTime)

**Status Flow**:

- WAITING_FOR_OPPONENT → expires after 5 min or opponent joins
- IN_PROGRESS → when opponent joins and stakes
- COMPLETED/EXPIRED/CANCELLED → final states

**Time Control Logic**:

- When game starts: both players get `initialTimeSeconds`
- After each move: player gets `incrementSeconds` added to their clock
- Time tracked server-side to prevent cheating
- If time reaches 0, game ends with timeout result (CREATOR_TIMEOUT or OPPONENT_TIMEOUT)

### 5. UserStats Table

One-to-one with User, stores analytics:

- `id` (BigInt, auto-increment, primary key) - Internal ID
- `referenceId` (String/UUID, unique, indexed, default: cuid()) - External reference
- `userId` (BigInt, foreign key to User.id, unique)
- `totalGamesPlayed` (Int, default 0)
- `gamesWon` (Int, default 0)
- `gamesLost` (Int, default 0)
- `gamesDrawn` (Int, default 0)
- `totalMoneyWon` (Decimal, default 0) - Gross winnings
- `totalMoneyLost` (Decimal, default 0) - Total stakes lost
- `totalPlatformFeesPaid` (Decimal, default 0)
- `netProfit` (Decimal, default 0) - Calculated field
- `currentWinStreak` (Int, default 0)
- `longestWinStreak` (Int, default 0)
- `averageGameDuration` (Int, nullable) - In seconds
- `lastPlayedAt` (DateTime, nullable)
- `updatedAt` (DateTime)

## Key Design Decisions

### Money Handling

- Use **Decimal** type (not Float) for all monetary values to avoid precision errors
- Store amounts in smallest currency unit (e.g., paise for INR) or use Decimal with 2 decimal places
- `lockedAmount` in Wallet prevents users from using money locked in active games

### Transaction Flow Examples

**Game Creation (Player A creates game with ₹10 stake):**

1. Check: wallet.balance - wallet.lockedAmount >= 10
2. Create Game with status WAITING_FOR_OPPONENT, expiresAt = now + 5 min
3. Update wallet: lockedAmount += 10
4. Create Transaction: type=GAME_STAKE, amount=10, status=COMPLETED

**Opponent Joins (Player B joins):**

1. Check: wallet.balance - wallet.lockedAmount >= 10
2. Update Game: status=IN_PROGRESS, opponentId=B, startedAt=now
3. Update wallet B: lockedAmount += 10
4. Create Transaction for B: type=GAME_STAKE, amount=10

**Game Completion - Player A Wins:**

1. Update Game: status=COMPLETED, result=CREATOR_WON, winnerId=A
2. Calculate: platformFee = 20 * 0.05 = ₹1, winAmount = 20 - 1 = ₹19
3. Update wallet A: balance += 19, lockedAmount -= 10
4. Update wallet B: lockedAmount -= 10
5. Create Transactions:
   - A: type=GAME_WIN, amount=19 (net winning after fee)
   - B: type=GAME_LOSS, amount=0 (already debited via stake)
   - Platform: type=PLATFORM_FEE, amount=1
6. Update UserStats for both players

**Game Draw:**

1. Calculate: platformFee = 20 * 0.05 = ₹1, refundEach = (20 - 1) / 2 = ₹9.50
2. Update wallet A: balance += 9.5, lockedAmount -= 10 (net: -0.5)
3. Update wallet B: balance += 9.5, lockedAmount -= 10 (net: -0.5)
4. Create Transactions for both: type=GAME_DRAW_REFUND, amount=9.5
5. Create Transaction: type=PLATFORM_FEE, amount=1

**Game Expiry (No opponent after 5 min):**

1. Update Game: status=EXPIRED
2. Update wallet A: lockedAmount -= 10 (full refund)
3. Create Transaction: type=GAME_EXPIRED_REFUND, amount=10

### Indexes

Critical indexes for performance:

- User: googleId, email, code, referenceId (all unique)
- Transaction: userId, gameId, createdAt, status, referenceId
- Game: creatorId, opponentId, inviteCode (unique), status, expiresAt, referenceId
- Wallet: userId (unique), referenceId
- UserStats: userId (unique), referenceId

### Constraints

- Wallet.balance and lockedAmount must be >= 0
- Transaction amounts must be > 0
- Game stakeAmount must be > 0
- Proper foreign key constraints with onDelete actions

## Implementation Status

✅ **Complete Prisma schema implemented** at: `apps/web/prisma/schema.prisma`

✅ **Prisma Client generated** at: `apps/web/app/generated/prisma`

⚠️ **Migration pending**: Run `npx prisma migrate dev --name init_complete_schema` to create migration files and apply to database

