# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (all apps)
pnpm dev

# Development (single app)
pnpm --filter web dev          # Next.js on port 3000
pnpm --filter web-socket dev   # WebSocket server (tsx watch)

# Build
pnpm --filter web build        # runs prisma generate first
pnpm --filter web-socket build

# Type checking
pnpm --filter web check-types

# Lint
pnpm --filter web lint         # next lint --max-warnings 0

# Format
pnpm format                    # prettier across repo

# Prisma
pnpm --filter web prisma:generate
pnpm --filter web prisma:migrate:deploy
pnpm --filter web prisma:seed
pnpm --filter web prisma:seed:openings
```

## Architecture

**Monorepo** (pnpm workspaces + Turbo) with two apps and shared packages:

### `apps/web` — Next.js 15 (App Router)

- **React 19 + React Compiler** — memoization is automatic; do not use `React.memo`, `useMemo`, or `useCallback`
- **Auth**: Clerk (`@clerk/nextjs`). Middleware at `middleware.ts` applies Clerk to all routes except `/api/scraper/*` (uses X-API-Key)
- **Database**: PostgreSQL via Prisma. Client generated to `app/generated/prisma`. Singleton in `lib/prisma.ts`
- **Styling**: Tailwind CSS v4 + `motion` (framer-motion) for animations
- **Chess engine**: `chess.js` for board logic, `stockfish.js` for browser-side AI analysis
- **Real-time**: `socket.io-client` connects to the WebSocket server. Connection URL from `NEXT_PUBLIC_WEBSOCKET_URL`
- **Error tracking**: Sentry with distributed tracing across web ↔ web-socket. Game lifecycle tracing via `lib/sentry/game-trace.ts`
- **PWA**: `@ducanh2912/next-pwa` for offline support and install prompts

### `apps/web-socket` — Socket.IO Game Server

- Express + Socket.IO server for real-time multiplayer chess
- **Core classes**: `GameManager` (orchestrates all games), `GameSession` (individual game state/FEN/moves), `ClockManager` (per-game timers)
- **Socket events**: Defined in `types.ts`. Client→Server: `join_game`, `make_move`, `resign`, `offer_draw`, `accept_draw`, `decline_draw`. Server→Client: `game_started`, `move_made`, `clock_update`, `game_over`, `analysis_phase_started`, `analysis_tick`, draw events
- Shared type definitions also mirrored in `apps/web/lib/types/socket-events.ts`
- Deployed to EC2 via GitHub Actions (`.github/workflows/deploy-websocket.yml`)

### `packages/`

- `eslint-config` — shared ESLint configs (base, next.js, react-internal)
- `typescript-config` — shared tsconfig (base, nextjs)
- `ui` — minimal React component library stub

## Key Patterns

- **Console logging**: wrap in `process.env.NODE_ENV === 'development'` guards (tree-shaken in prod)
- **Static constants**: hoist to module scope (sizeConfig, gameModes, gradient styles, etc.)
- **Game page sub-components** live alongside the page at `app/game/[gameId]/*.tsx`: `PlayerInfoCard`, `GameActionButtons`, `AnalysisPhaseBanner`
- **API routes** at `app/api/` — chess, matchmaking, user, analysis, chess-positions, legends, openings, scraper
- **Custom hooks** in `lib/hooks/` — `useMatchmaking`, `useStockfish`, `useBotMove`, `useChessSound`, `useAnalysisBoard`, `usePlayFromPosition`
- **Path alias**: `@/*` maps to `apps/web/*`

## Code Style

- Be extremely concise — sacrifice grammar for brevity
- Avoid unnecessary comments or docstrings; code should be self-documenting
- Only add comments for non-obvious logic, workarounds, or important context
- No redundant docstrings that restate function names/params

## Debugging

- **Neon MCP** is available for querying the production database directly. Use it to inspect database state when debugging issues — run SQL queries, check table schemas, list tables, and analyze query performance without needing a local DB connection.

## Deployment

- **Web**: Vercel (auto-deploy from main)
- **WebSocket**: AWS EC2 via GitHub Actions on changes to `apps/web-socket/**`
- Docker support available (Dockerfiles + docker-compose for local dev)