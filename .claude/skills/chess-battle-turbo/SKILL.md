# chess-battle-turbo Development Patterns

> Auto-generated skill from repository analysis

## Overview

Chess Battle Turbo is a TypeScript-based chess gaming platform featuring real-time multiplayer functionality, tournaments, and game analysis. The codebase follows modern web development patterns with WebSocket integration for real-time gameplay, Playwright for E2E testing, and a focus on responsive design and SEO optimization.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names
- E2E test files follow pattern `*.spec.ts`
- Component files use `.tsx` extension
- API routes follow Next.js conventions in `app/api/`

### Import/Export Style
- Use **named exports** for components and utilities
- Mixed import styles are acceptable
- Organize imports: external libraries first, then internal modules

### Commit Messages
- Use freeform style with optional `feat` prefix
- Keep messages concise (average 34 characters)
- Focus on clear, descriptive messages

## Workflows

### CI/CD Pipeline Fixes
**Trigger:** When CI tests fail due to missing env vars or configuration issues
**Command:** `/fix-ci`

1. Identify missing environment variables or secrets in workflow files
2. Update `.github/workflows/e2e-tests.yml` and `.github/workflows/deploy-websocket.yml`
3. Add missing secrets to GitHub Actions configuration
4. Update `playwright.config.ts` if needed for test environment
5. Test pipeline changes with a test commit

```yaml
# Example workflow fix
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

### E2E Test Development
**Trigger:** When adding new features that need E2E test coverage
**Command:** `/add-e2e-test`

1. Create test spec in `apps/web/e2e/specs/*.spec.ts`
2. Update test fixtures in `apps/web/e2e/fixtures/*.ts`
3. Configure authentication setup in `global-setup.ts`
4. Add test data isolation and cleanup
5. Run tests locally before committing

```typescript
// Example E2E test structure
import { test, expect } from '@playwright/test';

test('game functionality', async ({ page }) => {
  await page.goto('/game/123');
  await expect(page.locator('[data-testid="chess-board"]')).toBeVisible();
});
```

### Game Feature Development
**Trigger:** When implementing new game functionality like tournaments, matchmaking, or gameplay features
**Command:** `/add-game-feature`

1. Add WebSocket server logic in `apps/web-socket/*.ts`
2. Create corresponding API routes in `apps/web/app/api/**/*.ts`
3. Build frontend components in `apps/web/app/**/*.tsx`
4. Update database schema in `apps/web/prisma/schema.prisma`
5. Add comprehensive E2E tests for the new feature

```typescript
// Example WebSocket handler
export const handleGameMove = (socket: Socket, data: MoveData) => {
  // Validate move
  // Update game state
  // Broadcast to other players
  socket.to(data.gameId).emit('move', data);
};
```

### Mobile UI Layout Fixes
**Trigger:** When UI components don't display properly on mobile or different screen sizes
**Command:** `/fix-mobile-ui`

1. Identify layout problems on mobile devices
2. Update component styling with responsive Tailwind classes
3. Focus on game pages (`apps/web/app/game/[gameId]/*.tsx`)
4. Test analysis pages (`apps/web/app/analysis/[gameId]/*.tsx`)
5. Verify components render correctly across screen sizes

```tsx
// Example responsive component
<div className="flex flex-col md:flex-row gap-4 p-2 md:p-4">
  <div className="w-full md:w-2/3">
    <ChessBoard />
  </div>
  <div className="w-full md:w-1/3">
    <GameInfo />
  </div>
</div>
```

### SEO Metadata Updates
**Trigger:** When improving SEO or adding new indexable pages
**Command:** `/update-seo`

1. Add or update `layout.tsx` files with proper metadata
2. Create structured data schemas in `lib/seo.ts`
3. Update `sitemap.ts` and `robots.ts` files
4. Add Open Graph images and meta tags
5. Test metadata with SEO tools

```typescript
// Example metadata export
export const metadata: Metadata = {
  title: 'Chess Battle - Online Chess Tournament',
  description: 'Play competitive chess tournaments online',
  openGraph: {
    title: 'Chess Battle Turbo',
    description: 'Real-time chess gaming platform',
    url: 'https://chessbattle.com'
  }
};
```

### Project Tooling Cleanup
**Trigger:** When cleaning up development tools and removing obsolete configurations
**Command:** `/cleanup-tooling`

1. Identify unused configuration files and agent definitions
2. Remove obsolete files in `.claude/skills/` and `.agents/skills/`
3. Clean up development tooling configurations
4. Update remaining configurations for consistency
5. Document any breaking changes

### API Route Creation
**Trigger:** When adding new backend functionality or integrating external services
**Command:** `/add-api-route`

1. Create route handler in `apps/web/app/api/` following Next.js patterns
2. Add database operations with proper error handling
3. Implement request validation and sanitization
4. Add comprehensive error responses
5. Test API endpoints thoroughly

```typescript
// Example API route structure
export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Validate input
    // Process request
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Testing Patterns

- Use **Playwright** for all E2E testing
- Test files located in `apps/web/e2e/specs/`
- Follow naming convention `*.spec.ts`
- Include authentication setup in global configuration
- Focus on user-critical paths: game creation, moves, tournaments

```typescript
// Test structure example
test.describe('Chess Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/game/new');
  });

  test('should create new game', async ({ page }) => {
    // Test implementation
  });
});
```

## Commands

| Command | Purpose |
|---------|---------|
| `/fix-ci` | Fix CI/CD pipeline issues with environment variables and configurations |
| `/add-e2e-test` | Create comprehensive E2E tests for new features |
| `/add-game-feature` | Implement full-stack game features with WebSocket support |
| `/fix-mobile-ui` | Resolve responsive design issues across game components |
| `/update-seo` | Add or improve SEO metadata and structured data |
| `/cleanup-tooling` | Remove unused configurations and development tools |
| `/add-api-route` | Create new API endpoints with proper error handling |