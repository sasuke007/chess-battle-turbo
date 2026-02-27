import { test, expect, ChessBoardHelper } from "../fixtures";

test.describe("Play with Friend", () => {
  test("should create, join, play moves, and resign", async ({ playerA, playerB }) => {
    const boardA = new ChessBoardHelper(playerA.page);
    const boardB = new ChessBoardHelper(playerB.page);

    // Player A creates a friend game
    await playerA.page.goto("/play");
    await playerA.page.locator('[data-testid="mode-friend"]').click();
    await playerA.page.locator('[data-testid="start-game-button"]').click();
    await playerA.page.locator('[data-testid="go-to-game-button"]').click({ timeout: 30_000 });

    // Wait for Player A to land on the game page
    await playerA.page.waitForURL(/\/game\//, { timeout: 30_000 });

    // Extract game reference ID from URL
    const gameRefId = new URL(playerA.page.url()).pathname.split("/game/")[1]!;

    // Player B joins via the join page
    await playerB.page.goto(`/join/${gameRefId}`);
    await playerB.page.locator('[data-testid="accept-challenge-button"]').click();

    // Player B waits for redirect to game page
    await playerB.page.waitForURL(/\/game\//, { timeout: 30_000 });

    // Both wait for board and game to start (past analysis phase)
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

    // Play 3 rounds of alternating moves
    for (let i = 0; i < 3; i++) {
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
