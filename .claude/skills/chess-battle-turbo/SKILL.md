# chess-battle-turbo Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches development patterns for chess-battle-turbo, a TypeScript-based real-time chess application. The codebase features a web application with WebSocket game sessions, comprehensive E2E testing, and modern Next.js patterns. The project emphasizes responsive design, SEO optimization, and robust game state management.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names
- Component files: `ChessBoard.tsx`, `GameActionButtons.tsx`
- API routes: `route.ts` in directory structure
- Test files: `*.spec.ts` pattern

### Import/Export Patterns
```typescript
// Mixed import styles - adapt to context
import { GameSession } from './GameSession'
import * as React from 'react'
import type { Game } from '@/types'

// Prefer named exports
export const GameActionButtons = () => { ... }
export { ChessBoard } from './ChessBoard'
```

### Commit Style
- Use descriptive freeform messages (~34 characters)
- Common prefixes: `feat` for new features
- Example: `feat: add mobile responsive layout`

## Workflows

### Bug Fix Single File
**Trigger:** When you need to fix a specific bug, race condition, or issue in individual files  
**Command:** `/fix-bug`

1. Identify the problematic code in the target file
2. Implement the fix focusing on the specific issue
3. Test the fix locally if possible
4. Commit with a descriptive message explaining what was fixed

**Common files:**
- `apps/web/app/api/user/sync/route.ts` - API route issues
- `apps/web/app/game/[gameId]/page.tsx` - Game page bugs
- `apps/web-socket/GameSession.ts` - WebSocket session issues

### CI Configuration Update
**Trigger:** When you need to fix CI issues, add secrets, or update workflow configurations  
**Command:** `/update-ci`

1. Modify the appropriate `.github/workflows/*.yml` file
2. Update environment variables or secrets configuration
3. Adjust build/test configurations as needed
4. Test workflow changes with a small commit

**Example workflow update:**
```yaml
# .github/workflows/e2e-tests.yml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

### Mobile Responsive Fixes
**Trigger:** When you need to fix mobile UI issues or improve responsive design  
**Command:** `/fix-mobile`

1. Identify mobile layout problems in target components
2. Update component styling with responsive classes/CSS
3. Adjust spacing, sizing, and layout for mobile viewports
4. Test on multiple screen sizes

**Common patterns:**
```tsx
// Add responsive classes
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">
    {/* Mobile-first responsive content */}
  </div>
</div>
```

### SEO Layout Updates
**Trigger:** When you need to improve SEO or add metadata to pages  
**Command:** `/add-seo`

1. Create or update `layout.tsx` files with proper metadata
2. Configure indexing/noindex settings appropriately
3. Add structured data and Open Graph images
4. Update sitemap configuration if needed

**Example layout:**
```tsx
// apps/web/app/game/[gameId]/layout.tsx
export const metadata = {
  title: 'Chess Game - Chess Battle Turbo',
  description: 'Play real-time chess battles',
  robots: { index: true, follow: true }
}
```

### Game Flow Enhancement
**Trigger:** When you want to enhance game features or fix game-related functionality  
**Command:** `/enhance-game`

1. Update game page components with new features
2. Modify game action buttons or navigation elements
3. Improve game state handling and synchronization
4. Ensure WebSocket integration works properly

**Key files:**
- `apps/web/app/game/[gameId]/page.tsx` - Main game interface
- `apps/web/app/game/[gameId]/GameActionButtons.tsx` - Game controls
- `apps/web/app/analysis/[gameId]/page.tsx` - Post-game analysis

### Observability Integration
**Trigger:** When you want to add Sentry, logging, or monitoring capabilities  
**Command:** `/add-monitoring`

1. Install monitoring dependencies (Sentry, logging libraries)
2. Add instrumentation and configuration files
3. Wire up logging and metrics throughout the codebase
4. Configure error tracking and performance monitoring

**Example setup:**
```typescript
// apps/web-socket/instrument.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})
```

### Large Feature Development
**Trigger:** When you want to add major features like tournaments, billing, or comprehensive testing  
**Command:** `/new-feature`

1. Create multiple API routes for backend functionality
2. Build frontend components and pages for the feature
3. Add or update database schemas in Prisma
4. Implement comprehensive E2E testing
5. Update configurations and documentation

**Structure example:**
```
apps/web/app/api/tournaments/
├── route.ts
├── [tournamentId]/
│   ├── route.ts
│   └── join/route.ts
apps/web/app/tournaments/
├── page.tsx
└── [tournamentId]/page.tsx
```

## Testing Patterns

### E2E Testing with Playwright
- Test files follow `*.spec.ts` pattern in `apps/web/e2e/`
- Configuration in `playwright.config.ts`
- Focus on critical user flows and game functionality

```typescript
// Example E2E test pattern
import { test, expect } from '@playwright/test'

test('should start a chess game', async ({ page }) => {
  await page.goto('/game/new')
  await expect(page.locator('.chess-board')).toBeVisible()
})
```

## Commands

| Command | Purpose |
|---------|---------|
| `/fix-bug` | Fix specific bugs in individual files |
| `/update-ci` | Update GitHub Actions and CI configuration |
| `/fix-mobile` | Improve mobile responsive design |
| `/add-seo` | Add SEO metadata and layout improvements |
| `/enhance-game` | Improve core game functionality |
| `/add-monitoring` | Integrate logging and error tracking |
| `/new-feature` | Implement large features with multiple components |