# CLAUDE.md

## CRITICAL: Public Repo — NEVER Commit Secrets

- No API keys, credentials, or `.env` files in commits
- Use placeholder values in examples
- Add secrets via GitHub Secrets UI, Vercel Dashboard, or EAS Secrets
- If secrets found committed: alert user, remove, rotate credentials

## Stack

Hono + Prisma + PostgreSQL (Neon) API, React Native + Expo + Clerk Auth mobile app. pnpm monorepo.

## Quick Start

```bash
pnpm install
npx vc dev                            # API server (from root)
cd apps/mobile && npx expo start      # Mobile app
```

## Code Quality

```bash
pnpm biome:check --write .            # Biome (not ESLint)
npx tsc --noEmit                      # TypeScript check
pnpm --filter @nv-internal/api test   # API tests (Jest with mocks, NEVER real DB)
```

## Critical Patterns

- **Tabs navigation**: Use stable Tabs component. NEVER use `screenOptions` on Stack.
- **Accessibility**: 4 required props on interactive elements: `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, `testID`
- **Language**: Vietnamese for user-facing strings, English for code
- **OTA env vars**: Must explicitly pass ALL env vars to publish step (they don't inherit)
- **Prefixed IDs**: `cust_*`, `geo_*`, `act_*`, `pay_*`
- **SearchableText**: Pre-computed field for multi-field search
- **Vietnamese search**: Use `removeVietnameseAccents()` for accent-insensitive search
- **Activity logging**: Log all state changes to Activity table
- **Batch queries**: Replace N+1 with batch fetching
- **Commits**: Conventional format (`type(scope): description`)

## File Locations

- **API Routes**: `apps/api/src/v1/*/` (route.ts + service.ts)
- **Mobile Screens**: `apps/mobile/app/` (Expo Router)
- **DB Schema**: `apps/api/prisma/schema.prisma`
- **Shared Validation**: `packages/validation/`
- **Shared Prisma**: `packages/prisma-client/`
