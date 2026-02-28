# chess-battle-turbo Development Patterns

> Auto-generated skill from repository analysis

## Overview

chess-battle-turbo is a real-time chess application built with TypeScript, featuring both web client and WebSocket server components. The codebase follows Next.js patterns with API routes, includes real-time game mechanics, and emphasizes mobile-responsive design. The project maintains clean separation between client-side game logic, server-side game management, and API endpoints.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names: `GameSession.ts`, `PlayerInfoCard.tsx`, `chessBoard.ts`
- API routes follow Next.js convention: `route.ts` in directory structure
- Test files use pattern: `*.spec.ts`

### Import/Export Style
- Use **named exports** primarily: `export const GameManager = ...`
- Mixed import styles accepted but be consistent within files
- Organize imports: external libraries first, then internal modules

```typescript
// External imports
import { NextRequest, NextResponse } from 'next/server';
import { WebSocket } from 'ws';

// Internal imports  
import { GameSession } from '../GameSession';
import { SocketEvents } from '../../lib/types/socket-events';
```

### Commit Conventions
- Use `feat:` prefix for new features
- Keep commit messages concise (~34 characters average)
- Use freeform style: `feat: add mobile responsive chess board`

## Workflows

### Mobile UI Responsive Fixes
**Trigger:** When mobile layout needs adjustment or optimization
**Command:** `/mobile-fix`

1. Identify mobile layout issues by testing on different breakpoints
2. Update component styles with responsive Tailwind classes
3. Adjust padding, margins, and spacing for mobile viewports
4. Focus on key components: ChessBoard, GameActionButtons, PlayerInfoCard
5. Test changes on mobile breakpoints (sm, md breakpoints)

```tsx
// Example responsive fix
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <ChessBoard className="w-full max-w-sm mx-auto md:max-w-none" />
  </div>
</div>
```

### API Route Creation
**Trigger:** When adding new backend functionality or endpoints
**Command:** `/new-api`

1. Create `route.ts` file in `app/api/[endpoint-name]/` directory
2. Add proper HTTP method handlers (GET, POST, PUT, DELETE)
3. Implement error handling with try/catch and proper HTTP status codes
4. Add logging for debugging and monitoring
5. Update related services in `lib/services/` and types in `lib/types/`

```typescript
// apps/web/app/api/games/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Handle game creation logic
    return NextResponse.json({ success: true, gameId: 'abc123' });
  } catch (error) {
    console.error('Game creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create game' }, 
      { status: 500 }
    );
  }
}
```

### CI/CD Deployment Fixes
**Trigger:** When deployment fails or CI configuration needs updates
**Command:** `/fix-deploy`

1. Identify the specific CI/deployment issue from logs
2. Update workflow configuration in `.github/workflows/`
3. Fix environment variables, build paths, or deployment scripts
4. Update deployment scripts in `apps/web-socket/deploy/`
5. Test deployment in staging environment first
6. Update `deployment.md` with any configuration changes

### SEO Metadata Enhancement
**Trigger:** When improving search engine optimization and discoverability  
**Command:** `/seo-boost`

1. Add or update `layout.tsx` files with proper metadata configuration
2. Implement structured data using JSON-LD format for chess games
3. Update `sitemap.ts` to include all game and analysis pages
4. Configure `robots.txt` for proper crawler access
5. Add Open Graph images and meta tags for social sharing
6. Create reusable SEO utilities in `lib/seo.ts`

```typescript
// apps/web/app/game/[gameId]/layout.tsx
export async function generateMetadata({ params }: { params: { gameId: string } }) {
  return {
    title: `Chess Game ${params.gameId} | Chess Battle Turbo`,
    description: 'Play live chess games with real-time updates',
    openGraph: {
      title: `Chess Game ${params.gameId}`,
      description: 'Join this exciting chess battle',
      type: 'website',
    },
  };
}
```

### Game Flow Improvements
**Trigger:** When game flow has issues like race conditions, state management, or UX problems
**Command:** `/fix-game`

1. Identify the specific game flow issue (connection drops, state sync, turn management)
2. Update server-side logic in `GameSession.ts` or `GameManager.ts`
3. Fix client-side game page logic in `app/game/[gameId]/page.tsx`
4. Update socket event types in `lib/types/socket-events.ts`
5. Add proper error handling for network issues and invalid moves
6. Test game flow with multiple clients

```typescript
// apps/web-socket/GameSession.ts
export class GameSession {
  handleMove(playerId: string, move: ChessMove) {
    try {
      if (!this.isPlayerTurn(playerId)) {
        throw new Error('Not player turn');
      }
      
      this.makeMove(move);
      this.broadcastGameState();
    } catch (error) {
      this.sendError(playerId, error.message);
    }
  }
}
```

### Configuration Cleanup
**Trigger:** When removing outdated configs, skills, or example files
**Command:** `/cleanup`

1. Identify unused or outdated configuration files
2. Remove obsolete directories like old `.agents/skills/` or `.claude/skills/`
3. Clean up example files that are no longer needed
4. Update related configuration files that reference removed items
5. Ensure no broken imports or references remain
6. Update documentation if configuration changes affect setup

## Testing Patterns

The project uses **Playwright** for end-to-end testing with the following patterns:

- Test files follow pattern: `*.spec.ts`
- Tests focus on user interactions and game flow
- Include mobile responsive testing
- Test real-time features with WebSocket connections

```typescript
// Example test structure
import { test, expect } from '@playwright/test';

test('mobile chess game layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/game/test-game-id');
  
  await expect(page.locator('.chess-board')).toBeVisible();
  await expect(page.locator('.game-actions')).toHaveClass(/mobile-responsive/);
});
```

## Commands

| Command | Purpose |
|---------|---------|
| `/mobile-fix` | Fix mobile UI layout and responsive design issues |
| `/new-api` | Create new API endpoints with proper structure |
| `/fix-deploy` | Resolve CI/CD pipeline and deployment problems |
| `/seo-boost` | Enhance SEO metadata and search optimization |
| `/fix-game` | Improve game flow and fix gameplay bugs |
| `/cleanup` | Remove unused configs and clean up artifacts |