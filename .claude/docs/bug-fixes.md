# Bug Fixes Found During E2E Testing

## 1. GameManager Race Condition (FIXED)

**File**: `apps/web-socket/GameManager.ts` (lines 39-75)

**Bug**: When two players connect to a game simultaneously (e.g., Quick Match redirect), both call `handleJoinGame`. Both check `this.games.get(ref)` before either stores a session. Both create separate `GameSession` objects. The second overwrites the first in the `Map`. Neither session has both players — game is stuck at "JOINING GAME" forever.

**Fix**: Double-check locking after the async `fetchGameByRef` call. After fetching game data, re-check `this.games.get(ref)` before creating a new session. Safe because Node.js is single-threaded — the only yield point is the `await`.

```typescript
if (!gameSession) {
  const gameData = await fetchGameByRef(gameReferenceId);
  // Re-check after async fetch
  gameSession = this.games.get(gameReferenceId);
  if (gameSession) {
    isReconnection = gameSession.isPlayerInGame(userReferenceId);
  } else {
    gameSession = new GameSession(gameData);
    this.games.set(gameReferenceId, gameSession);
  }
}
```

---

## 2. Matchmaking Timing Race — Missed Matches (FIXED)

**File**: `apps/web/lib/services/matchmaking/matchmaking.service.ts`

**Bug**: When two players queue for Quick Match within milliseconds of each other, `tryFindMatch` runs inside `createMatchRequest` BEFORE either queue entry exists in the DB. Both miss each other, both create SEARCHING entries, and the polling endpoint (`getMatchStatus`) only reads status — it never retries matching. Both entries expire after 60 seconds unmatched.

The comment at line 385 confirmed this was intentional:
```
// Note: We don't try to match here anymore. Matching only happens when a new player joins.
```

**Fix**: Two changes:

1. `tryFindMatch` now accepts optional `callerQueueEntryId`. When provided (from polling), it:
   - Locks the caller's own queue entry with `FOR UPDATE` first
   - Verifies it's still SEARCHING (could've been matched by another concurrent poll)
   - Searches for opponent with `FOR UPDATE SKIP LOCKED`
   - Updates BOTH entries to MATCHED atomically in the transaction

2. `getMatchStatus` now calls `tryFindMatch` when status is still SEARCHING, passing the caller's queue entry ID.

**Safety against duplicate games**: If two entries poll simultaneously, each locks their own row first. The opponent search uses `SKIP LOCKED`, which skips any locked row. So each poll skips the other's locked entry — no match that cycle. Next poll (1 second later) succeeds cleanly. No deadlocks, no duplicate games.

---

## 3. Clipboard Blocking Navigation (FIXED)

**File**: `apps/web/app/play/page.tsx`

**Bug**: `await navigator.clipboard.writeText(...)` blocks navigation in headless Chrome (Playwright). When creating a friend game, the clipboard call threw an error (no clipboard permission in headless mode), preventing `router.push()` from executing.

**Fix**: Changed to fire-and-forget:
```typescript
navigator.clipboard.writeText(`${window.location.origin}/join/${gameRef}`).catch(() => {});
router.push(`/game/${gameRef}`);
```

---

## 4. Metadata Type Portability (FIXED)

**Files**: 20 layout files across `apps/web/app/*/layout.tsx`

**Bug**: Adding `@playwright/test` as a devDep caused pnpm to include it in `next`'s resolution hash (since it's an optional peer dep). TypeScript's declaration emit couldn't portably name the `Metadata` type through the long pnpm path, causing IDE TS2742 errors.

`tsc --noEmit` passed (skips declaration emit checks), but the IDE flagged errors.

**Fix**: Added explicit `import type { Metadata } from "next"` and `: Metadata` type annotations to all layout files that export metadata via `createMetadata()`. This prevents TypeScript from needing to infer the type through the pnpm path.

**Pattern** (already existed in `privacy/layout.tsx`):
```typescript
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({ ... });
```

---

## 5. IDE `useRouter` Resolution (NOT A CODE BUG)

**File**: `apps/web/app/play/page.tsx` (IDE-only)

**Symptom**: VS Code shows `Module '"next/navigation.js"' has no exported member 'useRouter'` but ONLY for `play/page.tsx`. Other files with identical imports (`queue/page.tsx`, `Navbar.tsx`) have zero errors. `tsc --noEmit` passes.

**Cause**: Stale IDE TypeScript server cache for that specific file, caused by the pnpm peer-dep hash change.

**Fix**: Restart TS server — `Cmd+Shift+P` > "TypeScript: Restart TS Server".
