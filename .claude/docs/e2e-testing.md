# E2E Testing with Playwright

## Overview

End-to-end tests cover the three core game flows: Bot, Friend, and Quick Match. Tests use Playwright with Clerk Testing Tokens for auth and two browser contexts for multiplayer scenarios.

## Setup

### Dependencies

- `@playwright/test` (devDep in `apps/web`)
- `@clerk/testing` (devDep in `apps/web`)
- Chromium installed via `pnpm --filter web exec playwright install --with-deps chromium`

### Test Users (pre-created in Clerk + DB)

- **User A**: testplayera@chessbattle.dev / xK9mQ!chess2026TestAz (DB ID: 31, Clerk: user_39r93dWRTqRPyGv2u0hSDuszD0i)
- **User B**: testplayerb@chessbattle.dev / yL3nR!chess2026TestBw (DB ID: 32, Clerk: user_39r94kjlVvo6MCgW968pfstP5wM)
- Both have `onboarded: true`, wallets, and stats records in the production DB (created via Neon MCP)

### Environment

`apps/web/.env.test` (gitignored) contains:
```
E2E_USER_A_EMAIL=testplayera@chessbattle.dev
E2E_USER_A_PASSWORD=xK9mQ!chess2026TestAz
E2E_USER_B_EMAIL=testplayerb@chessbattle.dev
E2E_USER_B_PASSWORD=yL3nR!chess2026TestBw
```

### Running Tests

```bash
# Load env vars and run (from apps/web)
set -a && source .env.test && set +a && npx playwright test

# Single spec
set -a && source .env.test && set +a && npx playwright test e2e/specs/play-with-bot.spec.ts

# Headed (visible browser)
set -a && source .env.test && set +a && npx playwright test --headed

# UI mode
set -a && source .env.test && set +a && npx playwright test --ui
```

## File Structure

```
apps/web/
  playwright.config.ts          # 180s timeout, serial workers, dual webServer (3000 + 3002)
  e2e/
    global-setup.ts             # Validates env vars, calls clerkSetup()
    fixtures/
      auth.ts                   # authedPage, playerA, playerB fixtures with Clerk sign-in
      chess-board.ts            # ChessBoardHelper class for board interaction
      index.ts                  # Re-exports test, expect, ChessBoardHelper
    specs/
      play-with-bot.spec.ts     # Single player vs AI
      play-with-friend.spec.ts  # Two players via invite link
      quick-match.spec.ts       # Two players via matchmaking queue
```

## Key Design Decisions

### data attributes added to source components

| File | Attribute | Purpose |
|------|-----------|---------|
| `ChessBoard.tsx` | `data-square={notation}` | Target squares for moves |
| `play/page.tsx` | `data-testid="mode-{id}"` | Game mode selection buttons |
| `play/page.tsx` | `data-testid="start-game-button"` | Start/find game button |
| `join/[ref]/page.tsx` | `data-testid="accept-challenge-button"` | Accept friend challenge |
| `GameActionButtons.tsx` | `data-testid="resign-button"` | Resign button (mobile + desktop) |
| `game/[id]/page.tsx` | `data-testid="confirm-resign-button"` | Confirm resign in modal |
| `game/[id]/page.tsx` | `data-testid="game-result"` | Game result display |
| `game/[id]/page.tsx` | `data-testid="game-board-container"` | Main container |
| `game/[id]/page.tsx` | `data-player-color={myColor}` | "w" or "b" |
| `game/[id]/page.tsx` | `data-current-turn={currentTurn}` | "w" or "b" |
| `game/[id]/page.tsx` | `data-game-started={gameStarted}` | "true" or "false" |
| `QueueSearching.tsx` | `data-testid="queue-searching"` | Queue searching state indicator |

### `data-game-started` is critical

The analysis phase fires `analysis_phase_started` which sets `myColor` BEFORE `game_started` fires. Without `data-game-started`, `detectPlayerColor()` would resolve during analysis phase, and resigning would trigger the `!gameStartedRef.current` guard that redirects to `/play`.

### Legend positions can start with black to move

Friend and Quick Match games use random historical positions ("legend" FENs). These can have either white or black to move. Tests must read `data-current-turn` to determine the starting side rather than hardcoding white-first.

### `playValidMove()` works with any starting position

Since legend positions have random FENs, hardcoded moves like e2-e4 are invalid. The `playValidMove(color)` method:
1. Finds pieces of the given color via `img.alt` (starts with "White"/"Black")
2. Clicks each piece to reveal legal move indicators
3. Detects legal targets via `.rounded-full` (move dots) or `rgba(220, 80, 80` (capture triangles)
4. Clicks a valid target

**Important**: Piece detection uses `img.alt.startsWith("White"/"Black")`, NOT `img.src`. Next.js Image rewrites `src` to `/_next/image?url=...&w=200`, and `img.src.includes('/w')` falsely matches the `&w=200` parameter for ALL images.

### Auth fixture retry logic

The `signIn` function in `auth.ts` has try/catch retry on `page.goto("/")` because the dev server compilation can cause `net::ERR_ABORTED` when two browser contexts hit it simultaneously during the first test run.

### Quick Match queue synchronization

The quick match test waits for Player A's `data-testid="queue-searching"` to appear before Player B queues. This ensures Player A's queue entry is persisted in the DB, giving Player B's `createMatchRequest.tryFindMatch()` the best chance of an immediate match.

## CI

`.github/workflows/e2e-tests.yml` runs on PRs to main. Requires secrets: Clerk keys, DB URL, test user credentials. Uploads playwright-report as artifacts.
