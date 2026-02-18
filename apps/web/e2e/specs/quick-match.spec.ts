import { test, expect, ChessBoardHelper } from "../fixtures";

test.describe("Quick Match", () => {
  test("should matchmake two players, play moves, and resign", async ({ playerA, playerB }) => {
    const boardA = new ChessBoardHelper(playerA.page);
    const boardB = new ChessBoardHelper(playerB.page);

    // Both navigate to /play and select quick match
    await Promise.all([
      playerA.page.goto("/play"),
      playerB.page.goto("/play"),
    ]);

    await playerA.page.locator('[data-testid="mode-quick"]').click();
    await playerB.page.locator('[data-testid="mode-quick"]').click();

    // Player A queues first
    await playerA.page.locator('[data-testid="start-game-button"]').click();
    await playerA.page.waitForURL(/\/queue/, { timeout: 15_000 });

    // Wait for Player A to enter "searching" state (queue entry persisted in DB)
    await playerA.page.locator('[data-testid="queue-searching"]').waitFor({ timeout: 15_000 });

    // Player B queues — should get immediate match via tryFindMatch
    await playerB.page.locator('[data-testid="start-game-button"]').click();
    await playerB.page.waitForURL(/\/queue/, { timeout: 15_000 });

    // Both wait for matchmaking to redirect to a game
    await Promise.all([
      playerA.page.waitForURL(/\/game\//, { timeout: 90_000 }),
      playerB.page.waitForURL(/\/game\//, { timeout: 90_000 }),
    ]);

    // Wait for boards and game to start
    await Promise.all([
      boardA.waitForBoard().then(() => boardA.waitForGameStarted()),
      boardB.waitForBoard().then(() => boardB.waitForGameStarted()),
    ]);

    // Detect colors and verify they're different
    const [colorA, colorB] = await Promise.all([
      boardA.detectPlayerColor(),
      boardB.detectPlayerColor(),
    ]);
    expect(colorA).not.toBe(colorB);

    const boardByColor: Record<string, ChessBoardHelper> = {
      w: colorA === "w" ? boardA : boardB,
      b: colorA === "b" ? boardA : boardB,
    };

    // Detect who moves first (legend positions can start with black to move)
    const startingTurn = await boardA.getCurrentTurn();
    const otherTurn = startingTurn === "w" ? "b" : "w";

    // Play 2 rounds of alternating moves
    for (let i = 0; i < 2; i++) {
      await boardByColor[startingTurn]!.waitForTurn(startingTurn);
      await boardByColor[startingTurn]!.playValidMove(startingTurn);

      await boardByColor[otherTurn]!.waitForTurn(otherTurn);
      await boardByColor[otherTurn]!.playValidMove(otherTurn);
    }

    // The player whose turn it is resigns
    const resignBoard = boardByColor[startingTurn]!;
    const winnerBoard = boardByColor[otherTurn]!;
    await resignBoard.waitForTurn(startingTurn);
    await resignBoard.resign();

    // Assert results
    await expect(resignBoard.gameResult()).toContainText("Defeat", { timeout: 10_000 });
    await expect(winnerBoard.gameResult()).toContainText("Victory", { timeout: 10_000 });
  });
});
