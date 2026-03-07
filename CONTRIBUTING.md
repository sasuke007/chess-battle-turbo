# Contributing to ReplayChess

Thank you for your interest in contributing to ReplayChess! This guide will help you get started.

## Getting Started

1. **Fork the repository** and clone your fork
2. **Install dependencies**: `pnpm install`
3. **Set up your environment** — see the [README](README.md#environment-variables) for required variables
4. **Run the dev server**: `pnpm dev`

## Development Workflow

1. Create a branch from `main` for your work
2. Make your changes
3. Run type checking: `pnpm --filter web check-types`
4. Run linting: `pnpm --filter web lint`
5. Run the build: `pnpm --filter web build`
6. Open a pull request against `main`

## Project Structure

This is a **pnpm monorepo** with Turborepo:

- `apps/web` — Next.js 15 web application
- `apps/web-socket` — Socket.IO game server
- `packages/` — Shared configs and UI components

## Code Style

- **TypeScript** is required for all code
- **React Compiler** handles memoization — do not use manual `React.memo`, `useMemo`, or `useCallback`
- **Tailwind CSS v4** for styling
- Run `pnpm format` before committing to ensure consistent formatting

## Reporting Issues

- Use [GitHub Issues](https://github.com/replay-chess/chess-battle-turbo/issues) to report bugs or request features
- Include steps to reproduce for bugs
- Check existing issues before opening a new one

## Pull Requests

- Use [GitHub Issues](https://github.com/replay-chess/chess-battle-turbo/issues) to report bugs or request features
- Write a clear description of what changed and why
- Ensure all checks pass (types, lint, build)
- Link related issues in the PR description

## Need Help?

Feel free to open an issue with the `question` label if you need guidance on where to start.
