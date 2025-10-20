### Contributing Guidelines

Welcome! This document explains how to commit code to this monorepo consistently.

### Commit Workflow (TL;DR)
1) Format & lint
```bash
pnpm exec biome check --write .
```
2) Test API
```bash
pnpm --filter @nv-internal/api test
```
3) (Optional) Build shared packages if changed
```bash
pnpm --filter @nv-internal/prisma-client build && pnpm --filter @nv-internal/validation build
```
4) Stage and commit with Conventional Commits
```bash
git add -A
git commit -m "<type>(<scope>): <description>"
```
5) Push
```bash
git push
```

Use `.cursor/commands/commit-changes.md` for a ready-to-run command recipe.

### Conventional Commit Rules
- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Common scopes: `api`, `mobile`, `prisma`, `validation`, `ci`, `docs`
- Examples:
```bash
git commit -m "feat(api): add check-in photo attachment endpoint"
git commit -m "fix(mobile): prevent crash on task details for missing location"
git commit -m "refactor(prisma): extract prefixed id helper to shared client"
git commit -m "test(api): cover task service status transitions"
```

### Splitting Commits
When a change spans different areas, split into multiple focused commits for easier review, cherry-picking, and reverts. Use `git add -p` to stage by hunk.

### Quality Bar
- Keep files small and readable; use strict TypeScript.
- Follow Biome formatting and sorted Tailwind classes (NativeWind).
- Maintain Vietnamese language support where applicable.
- For DB schema changes, include Prisma migrations; `prisma generate` runs via API scripts.

### Branching & Reviews
- Use feature branches; open PRs for review.
- Ensure CI passes; address review feedback promptly.
