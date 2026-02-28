import {
  test,
  expect,
  ChessBoardHelper,
  createTournamentViaApi,
  createTempUsersAndJoin,
  cleanupTempUsers,
} from "../fixtures";
import type { Page } from "@playwright/test";

/**
 * Call the find-match API from a page context. Returns the API response data.
 */
async function callFindMatchApi(
  page: Page,
  tournamentRefId: string,
): Promise<{ status: string; gameReferenceId?: string }> {
  return page.evaluate(async (refId: string) => {
    const res = await fetch("/api/tournament/find-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentReferenceId: refId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `find-match failed: ${res.status}`);
    return data.data as { status: string; gameReferenceId?: string };
  }, tournamentRefId);
}

/**
 * Both players find a match via the API (with random stagger to mimic client jitter),
 * navigate to the game, play a short game (2 rounds + resign).
 */
async function playTournamentRound(
  pageX: Page,
  pageY: Page,
  tournamentRefId: string,
) {
  const boardX = new ChessBoardHelper(pageX);
  const boardY = new ChessBoardHelper(pageY);

  // Navigate both to tournament page first (ensures auth context is active)
  await Promise.all([
    pageX.goto(`/tournament/${tournamentRefId}`, { waitUntil: "domcontentloaded" }),
    pageY.goto(`/tournament/${tournamentRefId}`, { waitUntil: "domcontentloaded" }),
  ]);

  // Call find-match sequentially with a random delay between them.
  // X's transaction must commit before Y starts, so Y sees X's committed
  // isSearching=true row (avoids SKIP LOCKED race and stale-flag overwrites).
  let gameRefId: string | undefined;
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let attempt = 0; attempt < 5 && !gameRefId; attempt++) {
    const resultX = await callFindMatchApi(pageX, tournamentRefId);
    if ((resultX.status === "MATCHED" || resultX.status === "IN_GAME") && resultX.gameReferenceId) {
      gameRefId = resultX.gameReferenceId;
      break;
    }

    await delay(200 + Math.random() * 500);

    const resultY = await callFindMatchApi(pageY, tournamentRefId);
    if ((resultY.status === "MATCHED" || resultY.status === "IN_GAME") && resultY.gameReferenceId) {
      gameRefId = resultY.gameReferenceId;
      break;
    }
  }

  if (!gameRefId) {
    throw new Error("Players failed to match after 5 attempts");
  }

  // Both navigate directly to the game page
  await Promise.all([
    pageX.goto(`/game/${gameRefId}`, { waitUntil: "domcontentloaded" }),
    pageY.goto(`/game/${gameRefId}`, { waitUntil: "domcontentloaded" }),
  ]);

  // Wait for boards and game to start (past analysis phase)
  await Promise.all([
    boardX.waitForBoard().then(() => boardX.waitForGameStarted()),
    boardY.waitForBoard().then(() => boardY.waitForGameStarted()),
  ]);

  // Detect colors
  const [colorX, colorY] = await Promise.all([
    boardX.detectPlayerColor(),
    boardY.detectPlayerColor(),
  ]);
  expect(colorX).not.toBe(colorY);

  const boardByColor: Record<string, ChessBoardHelper> = {
    w: colorX === "w" ? boardX : boardY,
    b: colorX === "b" ? boardX : boardY,
  };

  // Detect starting turn (legend positions can start with black to move)
  const startingTurn = await boardX.getCurrentTurn();
  const otherTurn = startingTurn === "w" ? "b" : "w";

  // Play 2 rounds of alternating moves
  for (let i = 0; i < 2; i++) {
    await boardByColor[startingTurn]!.waitForTurn(startingTurn);
    await boardByColor[startingTurn]!.playValidMove(startingTurn);

    await boardByColor[otherTurn]!.waitForTurn(otherTurn);
    await boardByColor[otherTurn]!.playValidMove(otherTurn);
  }

  // The starting-turn player resigns
  const resignBoard = boardByColor[startingTurn]!;
  const winnerBoard = boardByColor[otherTurn]!;
  await resignBoard.waitForTurn(startingTurn);
  await resignBoard.resign();

  // Assert results
  await expect(resignBoard.gameResult()).toContainText("Defeat", { timeout: 10_000 });
  await expect(winnerBoard.gameResult()).toContainText("Victory", { timeout: 10_000 });
}

test.describe("Tournament", () => {
  let tempUserIds: string[] = [];

  test.afterAll(async () => {
    if (tempUserIds.length > 0) {
      await cleanupTempUsers(tempUserIds);
    }
  });

  test("full tournament lifecycle: create, join 10 users, play games, end, verify leaderboard", async ({
    playerJ,
    playerK,
    playerL,
    playerM,
    browser,
  }) => {
    test.setTimeout(600_000);

    // ── PHASE 1: CREATE TOURNAMENT ──
    const tournamentRefId = await createTournamentViaApi(
      playerJ.page,
      `E2E Test Tournament ${Date.now()}`,
    );
    // PlayerJ is auto-joined as creator

    // ── PHASE 2: JOIN - Browser users (K, L, M) ──
    await Promise.all([
      playerK.page.goto(`/tournament/${tournamentRefId}`, { waitUntil: "domcontentloaded" }),
      playerL.page.goto(`/tournament/${tournamentRefId}`, { waitUntil: "domcontentloaded" }),
      playerM.page.goto(`/tournament/${tournamentRefId}`, { waitUntil: "domcontentloaded" }),
    ]);

    // Each clicks "Join Tournament" sequentially to avoid race conditions
    for (const player of [playerK, playerL, playerM]) {
      const joinBtn = player.page.locator('[data-testid="join-tournament-button"]');
      await joinBtn.waitFor({ timeout: 30_000 });
      await joinBtn.click();
      await joinBtn.waitFor({ state: "hidden", timeout: 30_000 });
    }

    // ── PHASE 3: JOIN - API users (4 temp Clerk users) ──
    tempUserIds = await createTempUsersAndJoin(browser, tournamentRefId, 4);
    // Now 8 participants total (J + K + L + M + 4 temp)

    // ── PHASE 4: VERIFY LOBBY STATE ──
    await playerJ.page.goto(`/tournament/${tournamentRefId}`, { waitUntil: "domcontentloaded" });
    // Wait for participant count to show 8
    await expect(playerJ.page.getByText("8 players")).toBeVisible({ timeout: 15_000 });

    // ── PHASE 5: START TOURNAMENT ──
    await playerJ.page.locator('[data-testid="start-tournament-button"]').click();
    await expect(playerJ.page.locator('[data-testid="tournament-status"]')).toContainText(
      "ACTIVE",
      { timeout: 15_000 },
    );

    // ── PHASE 6: ROUND 1 - PlayerJ vs PlayerK ──
    await playTournamentRound(playerJ.page, playerK.page, tournamentRefId);

    // ── PHASE 7: ROUND 2 - PlayerL vs PlayerM ──
    await playTournamentRound(playerL.page, playerM.page, tournamentRefId);

    // ── PHASE 8: END TOURNAMENT ──
    await playerJ.page.goto(`/tournament/${tournamentRefId}`, { waitUntil: "domcontentloaded" });
    const endBtn = playerJ.page.locator('[data-testid="end-tournament-button"]');
    await endBtn.waitFor({ timeout: 15_000 });
    await endBtn.click();
    await expect(playerJ.page.locator('[data-testid="tournament-status"]')).toContainText(
      "COMPLETED",
      { timeout: 15_000 },
    );

    // ── PHASE 9: VERIFY LEADERBOARD ──
    const leaderboard = playerJ.page.locator('[data-testid="leaderboard"]');
    await expect(leaderboard).toBeVisible({ timeout: 15_000 });

    const rows = leaderboard.locator('[data-testid="leaderboard-row"]');
    await expect(rows).toHaveCount(8, { timeout: 15_000 });
  });
});
