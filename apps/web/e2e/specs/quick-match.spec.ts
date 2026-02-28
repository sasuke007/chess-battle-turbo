import { test, expect, ChessBoardHelper } from "../fixtures";

test.describe("Quick Match", () => {
  test("should matchmake two players, play moves, and resign", async ({ playerH, playerI }) => {
    const boardA = new ChessBoardHelper(playerH.page);
    const boardB = new ChessBoardHelper(playerI.page);

    // Both navigate to /play and select quick match
    await Promise.all([
      playerH.page.goto("/play"),
      playerI.page.goto("/play"),
    ]);

    await playerH.page.locator('[data-testid="mode-quick"]').click();
    await playerI.page.locator('[data-testid="mode-quick"]').click();

    // Player H queues first
    await playerH.page.locator('[data-testid="start-game-button"]').click();
    await playerH.page.waitForURL(/\/queue/, { timeout: 60_000, waitUntil: "commit" });

    // Wait for Player H to enter "searching" state (queue entry persisted in DB)
    await playerH.page.locator('[data-testid="queue-searching"]').waitFor({ timeout: 30_000 });

    // Player I queues — should get immediate match via tryFindMatch
    await playerI.page.locator('[data-testid="start-game-button"]').click();
    await playerI.page.waitForURL(/\/queue/, { timeout: 60_000, waitUntil: "commit" });

    // Both wait for matchmaking to redirect to a game
    await Promise.all([
      playerH.page.waitForURL(/\/game\//, { timeout: 90_000, waitUntil: "commit" }),
      playerI.page.waitForURL(/\/game\//, { timeout: 90_000, waitUntil: "commit" }),
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
