# CLAUDE.md

Quick Reference & Navigation Hub for Claude Code working with the NV Internal codebase.

---

## ⚠️ CRITICAL SECURITY WARNING

**THIS IS A PUBLIC REPOSITORY - NEVER COMMIT SECRETS OR API KEYS**

- ❌ **NEVER** push API keys, credentials, or secrets to this repository
- ❌ **NEVER** include real environment variable values in code or documentation
- ❌ **NEVER** commit `.env` files or files containing sensitive data
- ✅ **ALWAYS** use placeholder values in examples (e.g., `"your-api-key-here"`)
- ✅ **ALWAYS** add secrets via GitHub Secrets UI, Vercel Dashboard, or EAS Secrets
- ✅ **ALWAYS** verify committed files don't contain real credentials

**If you discover committed secrets**: Alert user immediately, remove secrets, rotate credentials, use `git filter-branch` if needed.

---

## Project Overview

NV Internal is a task management application for an air conditioning service company in Vietnam. Monorepo with pnpm workspaces containing a REST API and React Native mobile app.

**Technology Stack**:
- **API**: Hono + PostgreSQL (Neon) + Prisma + Vercel
- **Mobile**: React Native + Expo + Clerk Auth + TanStack Query
- **Shared**: Prisma client + Zod validation schemas

---

## 🎯 Quick Start

**New to the project?**
1. [Setup Guide](./docs/development/setup.md) - Environment setup and installation
2. [Commands Reference](./docs/development/commands.md) - Common development commands
3. [Architecture Patterns](./docs/architecture/patterns/README.md) - Implementation patterns

**Essential commands**:
```bash
pnpm install                          # Install dependencies
npx vc dev                            # Start API server (from root)
pnpm dev                              # Start Expo (from apps/mobile/)
pnpm biome:check --write .            # Format and lint
```

---

## 🤖 Specialized Agents (PRIMARY WORKFLOW)

**Default Behavior**: Always use specialized agents for development work. They are experts with deep domain knowledge.

### Agent Quick Reference

| Agent | Use For | Documentation |
|-------|---------|---------------|
| **backend-engineer** | All backend work (API, database, services) | [.claude/agents/backend-engineer.md](./.claude/agents/backend-engineer.md) |
| **frontend-engineer** | All mobile/UI work (React Native, Expo) | [.claude/agents/frontend-engineer.md](./.claude/agents/frontend-engineer.md) |
| **code-quality-enforcer** | Pre-commit checks (TS, tests, lint) | [.claude/agents/code-quality-enforcer.md](./.claude/agents/code-quality-enforcer.md) |
| **qa-ui** | Mobile testing (Mobile-MCP, accessibility) | [.claude/agents/qa-ui.md](./.claude/agents/qa-ui.md) |
| **task-doc-tracker** | Documentation tracking and updates | [.claude/agents/task-doc-tracker.md](./.claude/agents/task-doc-tracker.md) |

### Common Workflows

**Feature Implementation**:
```
task-doc-tracker (plan) → backend-engineer/frontend-engineer (implement)
→ code-quality-enforcer (validate) → qa-ui (test) → task-doc-tracker (complete)
```

**Bug Fix**:
```
backend-engineer/frontend-engineer (fix) → code-quality-enforcer (validate)
→ qa-ui (verify) → task-doc-tracker (document)
```

**Detailed Workflows**: [.claude/docs/agent-workflows.md](./.claude/docs/agent-workflows.md)

---

## 📚 Documentation Navigation

### Architecture & Patterns

- **Core Patterns**: [docs/architecture/patterns/README.md](./docs/architecture/patterns/README.md)
- **Recent Additions**: [docs/architecture/patterns/CHANGELOG.md](./docs/architecture/patterns/CHANGELOG.md)
- **Database Patterns**: [docs/architecture/database-patterns.md](./docs/architecture/database-patterns.md)

### Development Guides

- **Setup**: [docs/development/setup.md](./docs/development/setup.md)
- **Commands**: [docs/development/commands.md](./docs/development/commands.md)
- **Environment Setup**: [docs/development/environment-setup.md](./docs/development/environment-setup.md)

### Testing

- **Testing Guide**: [docs/testing/README.md](./docs/testing/README.md)
- **Mobile-MCP Testing**: [docs/testing/mobile-mcp.md](./docs/testing/mobile-mcp.md)

### Feature Planning

- **V1 Master Plan**: [.claude/plans/v1/README.md](./.claude/plans/v1/README.md)
- **Enhancement Ideas**: [.claude/enhancements/README.md](./.claude/enhancements/README.md)

### Project Knowledge

- **Task Documentation**: [.claude/tasks/](./.claude/tasks/)
- **Documentation Standards**: [.claude/memory/documentation-structure.md](./.claude/memory/documentation-structure.md)
- **Feature Flags Guide**: [.claude/docs/feature-flags-guide.md](./.claude/docs/feature-flags-guide.md)
- **Error Tracking Guide**: [.claude/docs/error-tracking-guide.md](./.claude/docs/error-tracking-guide.md)

---

## 🔑 Critical Patterns (Must Know)

### Security & Authentication

- **Never commit secrets** - Use environment variables only
- **All routes require auth** - Clerk middleware on every endpoint ([pattern](./docs/architecture/patterns/auth-middleware.md))
- **Environment variables** - Mobile uses build profiles, API uses .env ([guide](./docs/development/environment-setup.md))

### Database

- **Prefixed IDs** - `cust_*`, `geo_*`, `act_*`, `pay_*` for readability ([pattern](./docs/architecture/database-patterns.md#id-patterns))
- **Activity logging** - Log all state changes to Activity table ([pattern](./docs/architecture/patterns/activity-event.md))
- **SearchableText** - Pre-computed field for multi-field search ([pattern](./docs/architecture/patterns/searchable-text.md))
- **Transactions** - Use for multi-model operations ([pattern](./docs/architecture/patterns/payment-transactions.md))

### Mobile

- **Tabs Navigation** - Use stable Tabs, never `screenOptions` on Stack ([pattern](./docs/architecture/patterns/tabs-navigation.md)) ⚠️ CRITICAL
- **Mobile Accessibility** - 4 required props: accessibilityLabel, accessibilityHint, accessibilityRole, testID ([pattern](./docs/architecture/patterns/mobile-accessibility.md))
- **Feature Flags** - PostHog flags for controlled rollouts ([guide](./.claude/docs/feature-flags-guide.md))
- **OTA Updates** - Expo Updates with user-controlled reload ([pattern](./docs/architecture/patterns/ota-updates.md))

### Performance

- **Batch queries** - Replace N+1 queries with batch fetching ([pattern](./docs/architecture/patterns/batch-queries.md))
- **FlatList optimization** - Use for long lists with virtualization ([pattern](./docs/architecture/patterns/flatlist-optimization.md))
- **Vietnamese search** - Accent-insensitive with `removeVietnameseAccents()` ([pattern](./docs/architecture/patterns/vietnamese-search.md))

---

## 📖 Library Documentation (Context7 MCP)

**ALWAYS use Context7 MCP before coding with external libraries** to get the latest documentation.

### How to Use

1. **Resolve Library ID** (first time):
   ```
   mcp__context7__resolve-library-id
   libraryName: "prisma" (or "hono", "expo", etc.)
   ```

2. **Get Documentation**:
   ```
   mcp__context7__get-library-docs
   context7CompatibleLibraryID: "/prisma/docs"
   topic: "transactions" (optional)
   ```

### Common Libraries

Check Context7 first for: Hono, Prisma, React Native, Expo, TanStack Query, Clerk, Zod, date-fns-tz

---

## 📁 Important File Locations

- **API Routes**: `apps/api/src/v1/*/` (route.ts and service.ts)
- **Mobile Screens**: `apps/mobile/app/` (Expo Router)
- **Database Schema**: `apps/api/prisma/schema.prisma`
- **Shared Validation**: `packages/validation/`
- **Shared Prisma Client**: `packages/prisma-client/`
- **QA Documentation**: `.claude/qa/` (test plans, scenarios, results)

---

## 📝 Development Guidelines

### Code Style

- **TypeScript**: Strict typing throughout
- **Biome**: Format and lint (replaces ESLint/Prettier)
- **Commits**: Conventional format (`type(scope): description`)
- **Language**: Vietnamese for user-facing strings, English for code

### Quality Standards

Before committing:
1. Run `npx tsc --noEmit` (fix all TS errors)
2. Run `pnpm biome:check --write .`
3. Run relevant tests (`pnpm --filter @nv-internal/api test`)
4. Rebuild shared packages if modified
5. Invoke `code-quality-enforcer` agent for validation

### Task Documentation

**ALWAYS document work in `.claude/tasks/`**:
- Format: `YYYYMMDD-HHMMSS-description.md`
- Track problem, implementation, decisions, testing
- Link to v1 plans if applicable
- Extract learnings to patterns

### Testing

- **API**: Jest with mocks (NEVER real database)
- **Mobile**: Mobile-MCP for UI testing
- **Coverage**: Target critical paths
- **Speed**: API tests ~1.36s for 211 tests

---

## 🚀 Quick Tips

### When to Create What

| Scenario | Create |
|----------|--------|
| Implementing v1 feature | Task file + link to v1 plan |
| Bug fix | Task file with reproduction |
| New pattern discovered | Task file + update CHANGELOG |
| Future idea | Enhancement doc in `.claude/enhancements/` |
| Testing mobile | Test plan + scenarios + results |

### Before Invoking Agents

- **backend-engineer**: Have API contract, requirements, patterns to follow
- **frontend-engineer**: Have UI/UX requirements, API endpoints, accessibility needs
- **code-quality-enforcer**: Have changes staged, ready to validate
- **qa-ui**: Have test plan, expected behaviors, edge cases
- **task-doc-tracker**: Have work status, learnings to document

### Common Commands by Context

**Backend work**:
```bash
npx vc dev                                    # Start API
pnpm --filter @nv-internal/api test          # Run tests
pnpm --filter @nv-internal/prisma-client build
```

**Mobile work**:
```bash
pnpm dev              # Start Expo (from apps/mobile/)
pnpm ios              # Run iOS
pnpm android          # Run Android
```

**Quality checks**:
```bash
npx tsc --noEmit                        # TypeScript check
pnpm biome:check --write .              # Format and lint
pnpm --filter @nv-internal/api test    # Run API tests
```

---

## Project Scale Context

- **Team Size**: Small business (< 50 users)
- **Industry**: Air conditioning services in Vietnam
- **Platform**: Mobile-first for field workers
- **Features**: Task management, check-in/check-out, GPS tracking, photo attachments

---

## Related Global Instructions

This file provides project-specific guidance. For global Claude Code instructions across all projects, see:
- **Global instructions**: `~/.claude/CLAUDE.md` (if configured)
- **Agent auto-invocation**: Follow patterns in global instructions
- **Quality gates**: Pre-commit validation with agents

---

## Getting Help

- **Documentation issues**: Check [.claude/memory/documentation-structure.md](./.claude/memory/documentation-structure.md)
- **Pattern questions**: Review [docs/architecture/patterns/README.md](./docs/architecture/patterns/README.md) and [CHANGELOG](./docs/architecture/patterns/CHANGELOG.md)
- **Agent usage**: See detailed workflows in [.claude/docs/agent-workflows.md](./.claude/docs/agent-workflows.md)
- **Recent changes**: Check [docs/architecture/patterns/CHANGELOG.md](./docs/architecture/patterns/CHANGELOG.md)

---

**Last Updated**: 2025-11-07
**Structure Version**: 2.0 (Reorganized for maintainability)
**Backup**: Original version available as `CLAUDE.md.backup`
