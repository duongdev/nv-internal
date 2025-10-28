# Code Quality and Commit Workflow

Guidelines for maintaining code quality and creating proper commits.

## Pre-commit Requirements

1. **Format and lint**: `pnpm exec biome check --write .`
2. **Run API tests**: `pnpm --filter @nv-internal/api test`
3. **Build packages** (optional, when changing shared code): `pnpm --filter @nv-internal/prisma-client build && pnpm --filter @nv-internal/validation build`

## Conventional Commits

Format: `<type>(<scope>): <description>`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Common scopes**: `api`, `mobile`, `prisma`, `validation`, `ci`, `docs`

### Examples

- `feat(api): add check-in photo attachment endpoint`
- `fix(mobile): prevent crash on task details for missing location`
- `refactor(prisma): extract prefixed id helper to shared client`

## Pull Requests

**Merge Strategy**: PRs will be **squashed and merged** into the main branch.

**PR Title**: Use semantic commit format for PR titles since they become the final commit message after squashing.

Format: `<type>(<scope>): <description>`

### Examples

- `feat(mobile): add compact attachment list to activity feed`
- `fix(api): resolve database connection timeout issue`
- `refactor(mobile): improve attachment viewer performance`

**PR Description**: Include:

- Summary of changes
- Test plan
- Breaking changes (if any)
- Screenshots/demo (for UI changes)
