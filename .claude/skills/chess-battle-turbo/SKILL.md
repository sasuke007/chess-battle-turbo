# chess-battle-turbo Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches development patterns for chess-battle-turbo, a real-time chess gaming platform built with TypeScript. The codebase features a Next.js web application with WebSocket support for real-time gameplay, Prisma for database management, and a component-driven architecture. The project emphasizes SEO optimization, mobile responsiveness, and comprehensive observability.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names
- Component files: `ComponentName.tsx`
- API routes: `route.ts`
- Pages: `page.tsx`
- Layouts: `layout.tsx`

### Import/Export Style
```typescript
// Mixed import style - use named exports primarily
export const GameBoard = () => { /* ... */ }
export const GameSession = () => { /* ... */ }

// Import examples
import { GameBoard } from './components/GameBoard'
import { NextRequest } from 'next/server'
```

### Commit Conventions
- Use freeform commits with `feat` prefix for new features
- Keep commit messages around 33 characters
- Example: `feat: add game timer component`

## Workflows

### New UI Component
**Trigger:** When adding a new user interface element
**Command:** `/new-component`

1. Create component file in `apps/web/app/components/ComponentName.tsx`
2. Add component-specific styling or update `apps/web/app/globals.css`
3. Import and integrate into relevant page or layout files
4. Test responsive behavior across breakpoints

```typescript
// Example component structure
export const GameTimer = ({ timeLeft }: { timeLeft: number }) => {
  return (
    <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
      <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
    </div>
  )
}
```

### New API Endpoint
**Trigger:** When adding a new backend endpoint
**Command:** `/new-api`

1. Create `route.ts` file in appropriate `apps/web/app/api/` directory
2. Implement HTTP methods (GET, POST, PUT, DELETE) as needed
3. Add database operations using Prisma client
4. Update service layer in `apps/web/lib/services/` if required
5. Add endpoint to middleware allowlist in `apps/web/middleware.ts` if needed

```typescript
// Example API route structure
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const games = await prisma.game.findMany({
      where: { status: 'active' },
      include: { players: true }
    })
    return NextResponse.json(games)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}
```

### SEO Page Optimization
**Trigger:** When optimizing a page for search engines
**Command:** `/seo-optimize`

1. Create or update `layout.tsx` with comprehensive metadata
2. Add structured data (JSON-LD) to the page
3. Update `apps/web/app/sitemap.ts` with new routes
4. Add breadcrumbs component using `apps/web/lib/seo.ts`
5. Optimize meta descriptions and titles

```typescript
// Example SEO layout
export const metadata: Metadata = {
  title: 'Chess Battle - Play Real-time Chess Online',
  description: 'Join thrilling chess battles with players worldwide. Real-time gameplay, rankings, and tournaments.',
  openGraph: {
    title: 'Chess Battle Turbo',
    description: 'Real-time chess gaming platform',
    images: ['/og-chess.jpg']
  }
}
```

### WebSocket Game Feature
**Trigger:** When adding real-time game functionality
**Command:** `/new-game-feature`

1. Update `apps/web-socket/GameSession.ts` with new game logic
2. Add new socket event types in `apps/web/lib/types/socket-events.ts`
3. Update client-side game page in `apps/web/app/game/[gameId]/page.tsx`
4. Create corresponding API routes for HTTP fallback
5. Test real-time synchronization between clients

```typescript
// Example socket event type
export interface GameMoveEvent {
  type: 'GAME_MOVE'
  gameId: string
  playerId: string
  move: {
    from: string
    to: string
    piece: string
  }
  timestamp: number
}
```

### Database Schema Update
**Trigger:** When modifying the database structure
**Command:** `/update-schema`

1. Update `apps/web/prisma/schema.prisma` with new models or fields
2. Run `npx prisma migrate dev` to generate migration files
3. Update seed data in `apps/web/prisma/seed.ts` if needed
4. Regenerate TypeScript types with `npx prisma generate`
5. Update related service functions and API endpoints

```prisma
// Example schema update
model Game {
  id        String   @id @default(cuid())
  status    GameStatus
  timeLimit Int?     // New field
  createdAt DateTime @default(now())
  players   Player[]
}
```

### Page Layout Creation
**Trigger:** When adding a new route/page
**Command:** `/new-page`

1. Create `page.tsx` file in appropriate directory structure
2. Add `layout.tsx` with metadata and page-specific styling
3. Update navigation components (`Navbar.tsx`, `Footer.tsx`) if needed
4. Add loading state with `loading.tsx`
5. Add error boundary with `error.tsx`

### Mobile Responsive Fixes
**Trigger:** When improving mobile user experience
**Command:** `/mobile-optimize`

1. Update component styling with responsive Tailwind classes
2. Test layouts on mobile breakpoints (sm, md, lg)
3. Adjust spacing, typography, and touch targets for small screens
4. Update game page layout for mobile chess interaction
5. Verify touch gestures work properly

```typescript
// Example responsive component
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
  <div className="w-full h-auto aspect-square md:aspect-video">
    {/* Game board adapts to screen size */}
  </div>
</div>
```

### Monitoring & Observability
**Trigger:** When adding observability to a feature
**Command:** `/add-monitoring`

1. Add Sentry instrumentation using utilities in `apps/web-socket/utils/sentry.ts`
2. Implement structured logging via `apps/web/lib/logger.ts`
3. Add custom metrics in `apps/web/lib/metrics.ts`
4. Update trace context for distributed tracing
5. Set up error boundaries for React components

```typescript
// Example monitoring implementation
import { logger } from '@/lib/logger'
import { captureException } from '@sentry/nextjs'

export const trackGameMove = (gameId: string, move: GameMove) => {
  logger.info('Game move executed', {
    gameId,
    move,
    timestamp: Date.now()
  })
  
  // Custom metrics
  metrics.increment('game.moves.total')
}
```

## Testing Patterns

Tests are written using **Playwright** with the `*.spec.ts` file pattern. Focus on:
- End-to-end user workflows
- Real-time WebSocket functionality
- Cross-browser compatibility
- Mobile responsive behavior

```typescript
// Example test structure
test('should allow player to make a chess move', async ({ page }) => {
  await page.goto('/game/test-game-id')
  await page.click('[data-testid="chess-piece-pawn"]')
  await page.click('[data-testid="chess-square-e4"]')
  await expect(page.locator('[data-testid="move-history"]')).toContainText('e4')
})
```

## Commands

| Command | Purpose |
|---------|---------|
| `/new-component` | Add new UI component with styling and integration |
| `/new-api` | Create new API endpoint with database operations |
| `/seo-optimize` | Add SEO metadata, structured data, and sitemap updates |
| `/new-game-feature` | Implement real-time game feature with WebSocket support |
| `/update-schema` | Modify database schema with migrations and type updates |
| `/new-page` | Create new page with layout, metadata, and navigation |
| `/mobile-optimize` | Make components responsive and mobile-friendly |
| `/add-monitoring` | Add logging, metrics, and error tracking |