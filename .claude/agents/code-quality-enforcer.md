# Code Quality Enforcer Agent

**Agent**: `code-quality-enforcer`

**USE THIS AGENT AFTER IMPLEMENTATION OR BEFORE COMMITS**

## Overview

The code-quality-enforcer agent ensures all code changes meet project quality standards before commits or pull requests. It runs comprehensive checks including TypeScript compilation, formatting, linting, and tests.

## Capabilities

- Validating code changes before commits
- Running pre-commit checks (format, lint, tests)
- TypeScript compilation checking and fixing
- Ensuring adherence to project standards
- Running targeted tests on changed files
- Building shared packages if modified

## When to Invoke (ALWAYS after changes)

Invoke this agent:

- ✅ After completing implementation work
- ✅ Before creating commits or pull requests
- ✅ When preparing code for review
- ✅ After fixing bugs or making changes
- ✅ When TypeScript errors need resolution

## Quality Checks Performed

### 1. TypeScript Compilation

**Command**: `npx tsc --noEmit`

**Purpose**: Verify type safety across the entire codebase

**Fix All Errors Before Proceeding**: TypeScript errors MUST be resolved. The agent will:
- Identify all type errors
- Suggest fixes for common patterns
- Update type definitions if needed
- Verify fixes resolve the errors

### 2. Format and Lint

**Command**: `pnpm exec biome check --write .`

**Purpose**: Ensure code formatting and linting standards

**Automatic Fixes**: Biome will automatically fix:
- Code formatting issues
- Import sorting
- Basic linting issues

**Manual Review Required For**:
- Complex linting warnings
- Potential bugs flagged by linter
- Code style violations that need refactoring

### 3. Targeted Testing

**For API Changes**:
```bash
pnpm --filter @nv-internal/api test
```

Run specific tests if possible:
```bash
pnpm --filter @nv-internal/api test -- <test-file-pattern>
```

**For Mobile Changes**:
- Test relevant screens/components only
- Run Mobile-MCP tests if applicable
- Verify on both iOS and Android if UI changes

**Important**: Only test changed files/modules unless full codebase testing is explicitly requested

### 4. Build Shared Packages

**If Prisma Client Modified**:
```bash
pnpm --filter @nv-internal/prisma-client build
```

**If Validation Schemas Modified**:
```bash
pnpm --filter @nv-internal/validation build
```

**Why**: Shared packages must be rebuilt for other packages to use the latest changes

## Quality Workflow

### Standard Workflow

```
1. Run TypeScript Check
   ├─ Errors? → Fix types → Rerun
   └─ Pass → Continue

2. Run Biome Format/Lint
   ├─ Issues? → Auto-fix → Review
   └─ Pass → Continue

3. Run Targeted Tests
   ├─ Failures? → Fix code → Rerun
   └─ Pass → Continue

4. Build Shared Packages (if needed)
   ├─ Errors? → Fix build → Rerun
   └─ Pass → Continue

5. ✅ Ready for Commit
```

### Fast Track Workflow (Minor Changes)

For small changes (typos, comments, minor refactors):

```
1. Run Biome only
2. Quick TypeScript check if types changed
3. Skip tests if no logic changes
4. Ready for commit
```

### Full Validation Workflow (Major Changes)

For significant changes (new features, refactoring):

```
1. Full TypeScript compilation
2. Full Biome check
3. Run ALL relevant tests
4. Build all affected packages
5. Run integration tests if available
6. Ready for commit (or PR)
```

## Common Issues and Fixes

### TypeScript Errors

**Issue**: Missing type definitions
**Fix**: Add proper type imports or define types

**Issue**: Type mismatch in function calls
**Fix**: Update function signature or caller code

**Issue**: Nullable values not handled
**Fix**: Add null checks or optional chaining

### Biome Issues

**Issue**: Import order violations
**Fix**: Automatically fixed by Biome

**Issue**: Unused variables
**Fix**: Remove or prefix with underscore if intentional

**Issue**: Console statements in production code
**Fix**: Remove or replace with proper logging

### Test Failures

**Issue**: Mock not properly reset
**Fix**: Use `resetPrismaMock()` in beforeEach

**Issue**: Async test timeout
**Fix**: Increase timeout or await all promises

**Issue**: Test data conflicts
**Fix**: Use unique test data per test

### Build Errors

**Issue**: Prisma schema changes not reflected
**Fix**: Run `npx prisma generate` before building

**Issue**: Circular dependencies
**Fix**: Refactor imports to break cycles

**Issue**: Missing dependencies
**Fix**: Add to package.json and reinstall

## Project-Specific Standards

### API Code Quality

- **Service Layer**: All business logic in `*.service.ts` files
- **Route Handlers**: Thin handlers, delegate to services
- **Validation**: Use Zod schemas from `@nv-internal/validation`
- **Error Handling**: Use HTTPException from Hono
- **Testing**: Mock-based, no real database access

### Mobile Code Quality

- **Accessibility**: All interactive elements need 4 props (label, hint, role, testID)
- **Navigation**: Never use `screenOptions` on Stack with Tabs
- **Styling**: Use `cn` utility for className composition
- **State**: TanStack Query for server state, hooks for UI state
- **Performance**: FlatList for long lists, memoization for expensive operations

### General Standards

- **Commit Format**: `type(scope): description` (conventional commits)
- **File Size**: Keep files small and focused (<500 lines)
- **Comments**: JSDoc for public functions, inline for complex logic
- **Language**: Vietnamese for user-facing strings, English for code

## Pre-Commit Checklist

Before running this agent, verify:

- [ ] All changes are staged (`git add`)
- [ ] You've reviewed the changes (`git diff --cached`)
- [ ] You understand what changed and why
- [ ] You've tested manually if UI changes
- [ ] You've updated documentation if API changes

After agent completes:

- [ ] All TypeScript errors fixed
- [ ] All Biome issues resolved
- [ ] All tests passing
- [ ] Shared packages rebuilt if needed
- [ ] Ready to create commit

## Integration with Other Agents

### Typical Flow

```
1. backend-engineer or frontend-engineer
   └─ Implements feature

2. code-quality-enforcer
   └─ Validates implementation
   └─ Reports issues

3. backend-engineer or frontend-engineer (if issues found)
   └─ Fixes issues

4. code-quality-enforcer
   └─ Validates fixes
   └─ Approves for commit

5. task-doc-tracker
   └─ Updates documentation
```

### When to Skip This Agent

**Never skip for**:
- New features
- Bug fixes
- Refactoring
- API changes
- Database changes

**Can skip for**:
- Documentation-only changes
- Comment-only changes (but still run Biome)
- `.md` file updates (but verify links work)

## Quick Command Reference

```bash
# TypeScript check
npx tsc --noEmit

# Format and lint
pnpm exec biome check --write .

# Test API
pnpm --filter @nv-internal/api test

# Test specific file
pnpm --filter @nv-internal/api test -- payment.test.ts

# Build Prisma client
pnpm --filter @nv-internal/prisma-client build

# Build validation schemas
pnpm --filter @nv-internal/validation build

# Full quality check (all at once)
npx tsc --noEmit && pnpm exec biome check --write . && pnpm --filter @nv-internal/api test
```

## Related Agents

- **backend-engineer** - Fixes backend issues found
- **frontend-engineer** - Fixes frontend issues found
- **task-doc-tracker** - Updates documentation after quality pass

## Success Criteria

This agent's job is complete when:

- ✅ TypeScript compiles without errors
- ✅ Biome reports no issues
- ✅ All relevant tests pass
- ✅ Shared packages built successfully
- ✅ Code follows project standards
- ✅ Ready for commit or pull request

If any check fails, the agent should:
1. Report the specific failures
2. Suggest fixes based on common patterns
3. Wait for fixes to be applied
4. Re-run checks to verify
