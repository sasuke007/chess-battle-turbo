import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import * as Sentry from "@sentry/nextjs";
import { Prisma } from "@/app/generated/prisma";
import { prisma } from "../../../../lib/prisma";
import { logger } from "@/lib/logger";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

interface StatsUpdateData {
  totalGamesPlayed?: { increment: number };
  lastPlayedAt?: Date;
  gamesWon?: { increment: number };
  gamesLost?: { increment: number };
  gamesDrawn?: { increment: number };
  totalMoneyWon?: { increment: Decimal };
  totalMoneyLost?: { increment: Decimal };
  netProfit?: { increment: Decimal } | { decrement: Decimal };
  currentWinStreak?: number | { increment: number };
  longestWinStreak?: number;
}

const gameOverSchema = z.object({
  gameReferenceId: z.string().min(1, "Game reference ID is required"),
  result: z.enum([
    "CREATOR_WON",
    "OPPONENT_WON",
    "DRAW",
    "CREATOR_TIMEOUT",
    "OPPONENT_TIMEOUT",
  ]),
  winnerId: z.string().optional(),
  method: z.enum([
    "checkmate",
    "timeout",
    "resignation",
    "draw_agreement",
    "stalemate",
    "insufficient_material",
  ]),
  fen: z.string().min(1),
  whiteTime: z.number().int().min(0),
  blackTime: z.number().int().min(0),
});

type GameOverRequest = z.infer<typeof gameOverSchema>;

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validatedData = gameOverSchema.parse(body);

    Sentry.setTag("game.referenceId", validatedData.gameReferenceId);

    // 2. Find game
    const game = await prisma.game.findUnique({
      where: { referenceId: validatedData.gameReferenceId },
      include: {
        creator: { include: { wallet: true } },
        opponent: { include: { wallet: true } },
      },
    });

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    // 3. Verify game is in progress
    if (game.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, error: "Game is not in progress" },
        { status: 400 }
      );
    }

    // 4. Get winner's database ID if provided (winnerId is referenceId from API)
    let winnerDbId: bigint | null = null;
    if (validatedData.winnerId) {
      const winner = await prisma.user.findUnique({
        where: { referenceId: validatedData.winnerId },
        select: { id: true },
      });
      if (winner) {
        winnerDbId = winner.id;
      }
    }

    // 5. Execute transaction to complete game and update wallets
    const result = await prisma.$transaction(async (tx) => {
      // Update game status
      const updatedGame = await tx.game.update({
        where: { referenceId: validatedData.gameReferenceId },
        data: {
          status: "COMPLETED",
          result: validatedData.result,
          winnerId: winnerDbId,
          completedAt: new Date(),
          creatorTimeRemaining: validatedData.whiteTime,
          opponentTimeRemaining: validatedData.blackTime,
          gameData: {
            ...(game.gameData as any),
            fen: validatedData.fen,
            method: validatedData.method,
          },
        },
      });

      const stakeAmount = new Decimal(game.stakeAmount);
      const platformFeeAmount = new Decimal(game.platformFeeAmount);
      const totalPot = new Decimal(game.totalPot);
      const winnings = totalPot.sub(platformFeeAmount);

      // Handle wallet updates based on result
      if (validatedData.result === "DRAW") {
        // Refund both players their stake
        // Unlock creator's stake
        await tx.wallet.update({
          where: { userId: game.creatorId },
          data: {
            lockedAmount: {
              decrement: stakeAmount,
            },
          },
        });

        // Unlock opponent's stake
        if (game.opponentId) {
          await tx.wallet.update({
            where: { userId: game.opponentId },
            data: {
              lockedAmount: {
                decrement: stakeAmount,
              },
            },
          });
        }

        // Create refund transactions
        await tx.transaction.create({
          data: {
            userId: game.creatorId,
            gameId: game.id,
            type: "GAME_DRAW_REFUND",
            amount: stakeAmount,
            balanceAfter: game.creator.wallet!.balance,
            status: "COMPLETED",
            description: `Draw refund for game ${game.referenceId}`,
          },
        });

        if (game.opponentId) {
          await tx.transaction.create({
            data: {
              userId: game.opponentId,
              gameId: game.id,
              type: "GAME_DRAW_REFUND",
              amount: stakeAmount,
              balanceAfter: game.opponent!.wallet!.balance,
              status: "COMPLETED",
              description: `Draw refund for game ${game.referenceId}`,
            },
          });
        }
      } else {
        // Determine winner and loser
        const winnerId =
          validatedData.result === "CREATOR_WON" ||
          validatedData.result === "OPPONENT_TIMEOUT"
            ? game.creatorId
            : game.opponentId!;
        const loserId =
          winnerId === game.creatorId ? game.opponentId! : game.creatorId;

        // Update winner's wallet - unlock their stake and add winnings
        const winnerWallet = await tx.wallet.findUnique({
          where: { userId: winnerId },
        });

        if (winnerWallet) {
          await tx.wallet.update({
            where: { userId: winnerId },
            data: {
              balance: {
                increment: winnings,
              },
              lockedAmount: {
                decrement: stakeAmount,
              },
            },
          });

          // Create win transaction
          await tx.transaction.create({
            data: {
              userId: winnerId,
              gameId: game.id,
              type: "GAME_WIN",
              amount: winnings,
              balanceAfter: new Decimal(winnerWallet.balance).add(winnings),
              status: "COMPLETED",
              description: `Winnings from game ${game.referenceId}`,
            },
          });
        }

        // Update loser's wallet - unlock their stake (which goes to winner)
        await tx.wallet.update({
          where: { userId: loserId },
          data: {
            lockedAmount: {
              decrement: stakeAmount,
            },
          },
        });

        // Create platform fee transaction (deducted from pot)
        await tx.transaction.create({
          data: {
            userId: winnerId,
            gameId: game.id,
            type: "PLATFORM_FEE",
            amount: platformFeeAmount,
            balanceAfter: new Decimal(winnerWallet!.balance).add(winnings),
            status: "COMPLETED",
            description: `Platform fee for game ${game.referenceId}`,
          },
        });
      }

      // Update user stats
      await updateUserStats(
        tx,
        game.creatorId,
        game.opponentId,
        validatedData.result,
        stakeAmount,
        winnings
      );

      return { game: updatedGame };
    }, {
      maxWait: 10000, // Maximum time to wait to start transaction (10 seconds)
      timeout: 15000, // Maximum time for transaction to complete (15 seconds)
    });

    // 6. Return success (don't send full game object with BigInt fields)
    return NextResponse.json(
      {
        success: true,
        data: {
          gameReferenceId: result.game.referenceId,
          status: result.game.status,
          result: result.game.result,
        },
        message: "Game completed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    logger.error("Error completing game", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete game",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function updateUserStats(
  tx: TransactionClient,
  creatorId: bigint,
  opponentId: bigint | null,
  result: string,
  stakeAmount: Decimal,
  winnings: Decimal
) {
  // Update creator stats
  const creatorStats = await tx.userStats.findUnique({
    where: { userId: creatorId },
  });

  if (creatorStats) {
    const creatorUpdate: StatsUpdateData = {
      totalGamesPlayed: { increment: 1 },
      lastPlayedAt: new Date(),
    };

    if (result === "CREATOR_WON" || result === "OPPONENT_TIMEOUT") {
      creatorUpdate.gamesWon = { increment: 1 };
      creatorUpdate.totalMoneyWon = { increment: winnings };
      creatorUpdate.netProfit = { increment: winnings.sub(stakeAmount) };
      creatorUpdate.currentWinStreak = { increment: 1 };
      if (
        creatorStats.currentWinStreak + 1 >
        creatorStats.longestWinStreak
      ) {
        creatorUpdate.longestWinStreak = creatorStats.currentWinStreak + 1;
      }
    } else if (result === "DRAW") {
      creatorUpdate.gamesDrawn = { increment: 1 };
      creatorUpdate.currentWinStreak = 0;
    } else {
      creatorUpdate.gamesLost = { increment: 1 };
      creatorUpdate.totalMoneyLost = { increment: stakeAmount };
      creatorUpdate.netProfit = { decrement: stakeAmount };
      creatorUpdate.currentWinStreak = 0;
    }

    await tx.userStats.update({
      where: { userId: creatorId },
      data: creatorUpdate,
    });
  }

  // Update opponent stats
  if (opponentId) {
    const opponentStats = await tx.userStats.findUnique({
      where: { userId: opponentId },
    });

    if (opponentStats) {
      const opponentUpdate: StatsUpdateData = {
        totalGamesPlayed: { increment: 1 },
        lastPlayedAt: new Date(),
      };

      if (result === "OPPONENT_WON" || result === "CREATOR_TIMEOUT") {
        opponentUpdate.gamesWon = { increment: 1 };
        opponentUpdate.totalMoneyWon = { increment: winnings };
        opponentUpdate.netProfit = { increment: winnings.sub(stakeAmount) };
        opponentUpdate.currentWinStreak = { increment: 1 };
        if (
          opponentStats.currentWinStreak + 1 >
          opponentStats.longestWinStreak
        ) {
          opponentUpdate.longestWinStreak = opponentStats.currentWinStreak + 1;
        }
      } else if (result === "DRAW") {
        opponentUpdate.gamesDrawn = { increment: 1 };
        opponentUpdate.currentWinStreak = 0;
      } else {
        opponentUpdate.gamesLost = { increment: 1 };
        opponentUpdate.totalMoneyLost = { increment: stakeAmount };
        opponentUpdate.netProfit = { decrement: stakeAmount };
        opponentUpdate.currentWinStreak = 0;
      }

      await tx.userStats.update({
        where: { userId: opponentId },
        data: opponentUpdate,
      });
    }
  }
}

