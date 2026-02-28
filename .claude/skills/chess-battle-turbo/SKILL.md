# chess-battle-turbo Development Patterns

> Auto-generated skill from repository analysis

## Overview

This TypeScript codebase is a real-time chess battle platform featuring a Next.js web frontend and WebSocket-based multiplayer game engine. The application emphasizes observability with comprehensive Sentry instrumentation, SEO optimization, and thorough E2E testing coverage. Development follows modern patterns with proper error handling, structured logging, and responsive UI components.

## Coding Conventions

**File Naming:** camelCase convention
- Components: `PlayerInfoCard.tsx`, `ChessBoard.tsx`
- Pages: `[gameId]/page.tsx`
- API routes: `route.ts`
- Tests: `*.spec.ts`

**Import/Export Style:**
```typescript
// Named exports preferred
export const GameActionButtons = () => { ... }
export { GameManager, GameSession }

// Mixed imports as needed
import { Sentry } from '@sentry/nextjs'
import type { GameState } from '@/lib/types'
```

**Commit Style:** Freeform with `feat` prefix, average 33 characters
- `feat: add player reconnection logic`
- `feat: improve mobile chess board`

## Workflows

### UI Bug Fix
**Trigger:** When fixing visual bugs, layout issues, or mobile responsiveness problems  
**Command:** `/fix-ui`

1. Identify the specific UI issue across different breakpoints
2. Locate the relevant component in `apps/web/app/components/` or page file
3. Modify component styling, layout, or responsive behavior
4. Test across mobile, tablet, and desktop breakpoints
5. Commit with descriptive message about the fix

**Example files:**
```
apps/web/app/game/[gameId]/page.tsx
apps/web/app/components/ChessBoard.tsx
apps/web/app/components/PlayerInfoCard.tsx
```

### Sentry Instrumentation
**Trigger:** When adding observability to new features or debugging production issues  
**Command:** `/add-sentry`

1. Add Sentry.logger calls for key events and errors
2. Implement custom metrics using `apps/web/lib/metrics.ts`
3. Add error boundaries around critical components
4. Set up distributed tracing for request flows
5. Update relevant `sentry.*.config.ts` files

**Example implementation:**
```typescript
import { Sentry } from '@sentry/nextjs'

// Error logging
Sentry.captureException(error, { extra: { gameId, playerId } })

// Custom metrics
Sentry.metrics.increment('game.move.count', 1, { 
  tags: { gameType: 'blitz' } 
})
```

### Game Page Enhancement
**Trigger:** When enhancing the core chess game interface or fixing game-related bugs  
**Command:** `/enhance-game`

1. Modify game page layout in `apps/web/app/game/[gameId]/page.tsx`
2. Update game action buttons and player info components
3. Enhance chess board functionality and visual feedback
4. Test complete game flow from start to finish
5. Ensure mobile compatibility

**Key components:**
```
apps/web/app/game/[gameId]/GameActionButtons.tsx
apps/web/app/game/[gameId]/PlayerInfoCard.tsx
apps/web/app/components/ChessBoard.tsx
```

### API Route Creation
**Trigger:** When adding new backend functionality or data access endpoints  
**Command:** `/new-api`

1. Create new `route.ts` file in appropriate `apps/web/app/api/` directory
2. Implement API logic with proper error handling and validation
3. Add comprehensive Sentry logging for errors and performance
4. Update middleware if authentication or CORS changes needed
5. Document the endpoint and test with various inputs

**Example structure:**
```typescript
// apps/web/app/api/games/[id]/route.ts
export async function GET(request: Request) {
  try {
    // Implementation with error handling
    Sentry.addBreadcrumb({ message: 'Fetching game data' })
    // ...
  } catch (error) {
    Sentry.captureException(error)
    return Response.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}
```

### SEO Metadata Setup
**Trigger:** When creating new pages or improving existing page SEO  
**Command:** `/add-seo`

1. Create or update `layout.tsx` with comprehensive metadata
2. Add structured data for rich search results
3. Update `apps/web/app/sitemap.ts` with new routes
4. Add breadcrumbs component if needed for navigation
5. Test metadata with SEO tools

**Files involved:**
```
apps/web/app/*/layout.tsx
apps/web/lib/seo.ts
apps/web/app/sitemap.ts
apps/web/app/components/Breadcrumbs.tsx
```

### Feature with Tests
**Trigger:** When building major new functionality that needs test coverage  
**Command:** `/new-feature`

1. Implement core feature logic in appropriate components/pages
2. Create corresponding E2E test spec in `apps/web/e2e/specs/`
3. Add any necessary test fixtures or helpers
4. Update CI workflow if new test requirements exist
5. Ensure tests cover happy path and edge cases

**Test structure:**
```typescript
// apps/web/e2e/specs/gameFlow.spec.ts
import { test, expect } from '@playwright/test'

test('player can make moves in game', async ({ page }) => {
  // Test implementation
})
```

### WebSocket Game Logic
**Trigger:** When modifying multiplayer game logic or WebSocket event handling  
**Command:** `/update-websocket`

1. Update `GameManager.ts` or `GameSession.ts` for game state management
2. Modify socket event handlers in `apps/web-socket/index.ts`
3. Add appropriate logging and distributed tracing
4. Update type definitions in `apps/web/lib/types/socket-events.ts`
5. Test real-time functionality with multiple clients

**Key files:**
```
apps/web-socket/GameManager.ts
apps/web-socket/GameSession.ts
apps/web/lib/types/socket-events.ts
```

## Testing Patterns

**Framework:** Playwright for E2E testing  
**Pattern:** `*.spec.ts` files in `apps/web/e2e/specs/`

Tests focus on:
- Complete user flows (game creation, moves, completion)
- Real-time multiplayer interactions
- Mobile responsive behavior
- Error handling and edge cases

## Commands

| Command | Purpose |
|---------|---------|
| `/fix-ui` | Fix visual bugs, layout issues, or mobile responsiveness |
| `/add-sentry` | Add observability, logging, and error tracking |
| `/enhance-game` | Improve chess game interface and functionality |
| `/new-api` | Create new backend API endpoints with proper error handling |
| `/add-seo` | Set up SEO metadata and structured data for pages |
| `/new-feature` | Develop features with comprehensive E2E test coverage |
| `/update-websocket` | Modify real-time game logic and WebSocket handling |