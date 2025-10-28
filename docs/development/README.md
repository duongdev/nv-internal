# Development Guide

Complete guide for developing on the NV Internal project.

## Getting Started

- **[Environment Setup](./setup.md)** - Complete setup guide for local development
- **[Development Commands](./commands.md)** - Quick reference for common commands
- **[Code Quality & Commit Workflow](./quality-workflow.md)** - Standards and processes

## Quick Links

### First Time Setup
1. Read [Environment Setup](./setup.md) for complete installation instructions
2. Bookmark [Development Commands](./commands.md) for quick command reference
3. Review [Code Quality Workflow](./quality-workflow.md) before making your first commit

### Daily Development
- **Starting API**: `npx vc dev` (from root)
- **Starting Mobile**: `cd apps/mobile && pnpm dev`
- **Running Tests**: `pnpm test:api` (API) or `pnpm test` (all)
- **Format/Lint**: `pnpm biome:check`

### Before Committing
1. Run `pnpm biome:check` to format and lint
2. Run `pnpm test:api` for API changes
3. Build shared packages if modified
4. Use conventional commit format

See [Code Quality Workflow](./quality-workflow.md) for complete pre-commit checklist.

## Development Workflow

### Feature Development
1. Check `.claude/plans/v1/` for feature specifications
2. Create task documentation in `.claude/tasks/`
3. Implement following architecture patterns (see `docs/architecture/patterns/`)
4. Run quality checks before committing
5. Update task documentation with completion status

### Bug Fixes
1. Create task file documenting the issue
2. Implement fix following existing patterns
3. Add/update tests
4. Run quality checks
5. Document solution in task file

## Project Structure

```
nv-internal/
├── apps/
│   ├── api/          # Hono REST API
│   └── mobile/       # Expo React Native app
├── packages/
│   ├── prisma-client/    # Shared Prisma client
│   └── validation/       # Shared Zod schemas
├── docs/
│   ├── architecture/patterns/  # Implementation patterns
│   ├── development/            # This guide
│   └── testing/                # Testing guides
└── .claude/
    ├── tasks/         # Implementation tracking
    ├── plans/v1/      # Feature specifications
    └── enhancements/  # Future improvements
```

## Additional Resources

- **Architecture Patterns**: `docs/architecture/patterns/README.md`
- **Testing Guide**: `docs/testing/mobile-mcp.md`
- **Task Documentation**: `.claude/tasks/` directory
- **V1 Plans**: `.claude/plans/v1/README.md`
