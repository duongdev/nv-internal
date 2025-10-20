### Purpose
Guided commit flow for this monorepo that enforces formatting/linting (Biome), runs API tests, and uses Conventional Commits.

### Before you commit
- Ensure changes are staged and pass format/lint and tests.
- Follow the Conventional Commit message format with an appropriate scope.

### 1) Format and lint with Biome (auto-fix where safe)
```bash
pnpm exec biome check --write .
```

### 2) Run unit tests for API
```bash
pnpm --filter @nv-internal/api test
```

- Optional (quick watch locally): `pnpm --filter @nv-internal/api test:watch`
- Optional coverage: `pnpm --filter @nv-internal/api test:coverage`

### 3) Build shared packages (optional pre-commit sanity)
Use when you changed shared packages or Prisma/validation types.
```bash
pnpm --filter @nv-internal/prisma-client build && pnpm --filter @nv-internal/validation build
```

### 4) Stage files
```bash
git add -A
```

### 5) Commit with Conventional Commits
Format: `<type>(<scope>): <description>`

- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Common scopes: `api`, `mobile`, `prisma`, `validation`, `ci`, `docs`

Examples:
```bash
git commit -m "feat(api): add check-in photo attachment endpoint"
git commit -m "fix(mobile): prevent crash on task details for missing location"
git commit -m "refactor(prisma): extract prefixed id helper to shared client"
git commit -m "test(api): cover task service status transitions"
```

### 6) Push
```bash
git push
```

### Notes
- Keep files small and readable; prefer clear names and strict typing.
- Maintain Vietnamese support where applicable.
- When touching Tailwind classes (mobile), Biome will sort classes; don’t override.
- For DB schema changes, include Prisma migration files and ensure `prisma generate` runs (handled in API postinstall and build scripts).
- If changes span different areas, consider splitting into multiple focused commits (use `git add -p` to stage by hunk) to ease review, cherry-picking, and reverts.
