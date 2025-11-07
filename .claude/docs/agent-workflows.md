# Agent Workflow Patterns

Complete guide to using specialized agents for development tasks in the NV Internal project.

## Overview

This document provides detailed workflow examples for coordinating multiple agents throughout the development lifecycle. Each workflow demonstrates how to invoke agents in sequence or parallel to achieve optimal results.

---

## Feature Implementation Workflow

### Complete Feature Development Flow

```
1. Documentation Setup
   └─ Launch: task-doc-tracker

2. Implementation
   ├─ Backend: Launch backend-engineer
   └─ Frontend: Launch frontend-engineer

3. Code Quality
   └─ Launch: code-quality-enforcer

4. Mobile Testing (if applicable)
   └─ Launch: qa-ui

5. Documentation Update
   └─ Launch: task-doc-tracker
```

### Detailed Steps

#### 1. Documentation Setup

**Agent**: `task-doc-tracker`

**Purpose**: Create task file and track implementation plan

**Actions**:
- Create task file in `.claude/tasks/` with timestamp format
- Document requirements and acceptance criteria
- Link to relevant v1 feature plans if applicable
- Set up implementation checklist

**Output**: Task file created with initial plan

---

#### 2A. Backend Feature Implementation

**Agent**: `backend-engineer`

**Purpose**: Implement API endpoints, database changes, business logic

**Provide to Agent**:
- Feature requirements from task file
- API contract (request/response schemas)
- Database schema changes needed
- Related patterns to follow

**Agent Will**:
- Design Zod validation schemas
- Implement service layer functions
- Create route handlers with auth middleware
- Write comprehensive tests
- Update database schema if needed

**Output**:
- Working API endpoint
- Tests passing
- Documentation updated

---

#### 2B. Frontend Feature Implementation

**Agent**: `frontend-engineer`

**Purpose**: Implement mobile UI, navigation, state management

**Provide to Agent**:
- UI/UX requirements
- API endpoints to integrate with
- Navigation flow
- Accessibility requirements

**Agent Will**:
- Create React Native components
- Implement TanStack Query hooks
- Add proper accessibility properties
- Apply NativeWind styling
- Handle loading and error states

**Output**:
- Working mobile UI
- Proper accessibility
- API integration complete

---

#### 3. Code Quality Validation

**Agent**: `code-quality-enforcer`

**Purpose**: Validate all changes meet quality standards

**Agent Will**:
- Run TypeScript compilation check
- Run Biome format and lint
- Execute relevant tests
- Build shared packages if modified
- Report any issues found

**Output**:
- All quality checks passed
- Ready for commit

---

#### 4. Mobile Testing (If Applicable)

**Agent**: `qa-ui`

**Purpose**: Comprehensive mobile UI testing

**Provide to Agent**:
- Test plan or scenarios
- Expected behaviors
- Edge cases to test

**Agent Will**:
- Execute test scenarios with Mobile-MCP
- Verify accessibility compliance
- Test performance
- Document any bugs found

**Output**:
- Test results documented
- Bugs reported or feature approved

---

#### 5. Documentation Update

**Agent**: `task-doc-tracker`

**Purpose**: Finalize documentation and extract learnings

**Agent Will**:
- Mark task as completed
- Update v1 plan status if applicable
- Extract patterns to documentation
- Update CHANGELOG if new pattern established

**Output**:
- Task marked complete
- Knowledge preserved

---

## Backend Development Workflow

### New API Endpoint

**Recommended Agent Order**: backend-engineer → code-quality-enforcer

```typescript
// Step 1: Design Phase (with backend-engineer)
- Review requirements
- Design API contract
  - Request schema
  - Response schema
  - Error responses
- Plan database operations
- Identify security requirements

// Step 2: Implementation Phase (with backend-engineer)
- Create Zod schemas in @nv-internal/validation
- Implement service layer in *.service.ts
- Create route handler
- Add authentication middleware
- Log state changes to Activity if needed
- Write unit tests

// Step 3: Validation Phase (with code-quality-enforcer)
- TypeScript compilation check
- Biome format/lint
- Run API tests
- Build validation package if modified

// Step 4: Ready for commit
```

### Database Schema Change

**Recommended Agent Order**: backend-engineer → code-quality-enforcer

```typescript
// Step 1: Schema Design (with backend-engineer)
- Design new models or fields
- Follow prefixed ID patterns (cust*, geo*, act_*, pay_*)
- Plan indexes for performance
- Consider Activity logging needs

// Step 2: Migration (with backend-engineer)
- Update schema.prisma
- Create migration: npx prisma migrate dev
- Update Zod schemas
- Rebuild Prisma client package

// Step 3: Code Updates (with backend-engineer)
- Update service layer functions
- Update type definitions
- Write tests for new schema

// Step 4: Validation (with code-quality-enforcer)
- TypeScript check
- Biome check
- Run all API tests
- Build packages

// Step 5: Ready for commit
```

### Bug Fix (Backend)

**Recommended Agent Order**: backend-engineer → code-quality-enforcer

```typescript
// Step 1: Investigate (with backend-engineer)
- Reproduce the bug
- Identify root cause
- Review related code
- Check tests

// Step 2: Fix (with backend-engineer)
- Implement fix
- Update or add tests
- Verify fix resolves issue

// Step 3: Validate (with code-quality-enforcer)
- All quality checks
- Ensure tests pass

// Step 4: Ready for commit
```

---

## Frontend Development Workflow

### New Mobile Screen

**Recommended Agent Order**: frontend-engineer → code-quality-enforcer → qa-ui

```typescript
// Step 1: Design Phase (with frontend-engineer)
- Review UI/UX requirements
- Identify components needed
- Plan navigation integration
- Define data fetching needs

// Step 2: Implementation Phase (with frontend-engineer)
- Create route file in app/
- Build components with accessibility props
- Implement TanStack Query hooks
- Style with NativeWind
- Add haptic feedback for interactions

// Step 3: Validation Phase (with code-quality-enforcer)
- TypeScript check
- Biome check
- Manual testing on iOS/Android

// Step 4: Testing Phase (with qa-ui)
- Execute test scenarios
- Verify accessibility
- Test edge cases
- Check performance

// Step 5: Ready for commit
```

### API Integration

**Recommended Agent Order**: frontend-engineer → code-quality-enforcer

```typescript
// Step 1: Integration Planning (with frontend-engineer)
- Review API endpoint documentation
- Understand request/response types
- Plan error handling

// Step 2: Implementation (with frontend-engineer)
- Use callHonoApi for type-safe calls
- Create TanStack Query hook
- Handle loading/error/success states
- Implement cache invalidation
- Add optimistic updates if needed

// Step 3: UI Update (with frontend-engineer)
- Display loading indicators
- Show error messages (Vietnamese)
- Handle empty states
- Add pull-to-refresh if applicable

// Step 4: Validation (with code-quality-enforcer)
- TypeScript check
- Biome check
- Test integration

// Step 5: Ready for commit
```

### Bug Fix (Frontend)

**Recommended Agent Order**: frontend-engineer → code-quality-enforcer → qa-ui (for verification)

```typescript
// Step 1: Investigate (with frontend-engineer)
- Reproduce on device/simulator
- Check console logs
- Review related components
- Identify root cause

// Step 2: Fix (with frontend-engineer)
- Implement fix
- Test manually on iOS and Android
- Verify fix doesn't break other features

// Step 3: Validate (with code-quality-enforcer)
- All quality checks

// Step 4: Verify (with qa-ui)
- Re-run test scenarios
- Confirm bug is fixed
- Check for regressions

// Step 5: Ready for commit
```

---

## Testing Workflow

### New Feature Testing

**Recommended Agent Order**: qa-ui

```typescript
// Step 1: Test Planning (with qa-ui)
- Review feature requirements
- Create test plan in .claude/qa/test-plans/
- Identify critical paths
- Define success criteria

// Step 2: Scenario Creation (with qa-ui)
- Write detailed test scenarios
- Document preconditions
- Define expected results
- Include Mobile-MCP commands

// Step 3: Test Execution (with qa-ui)
- Execute scenarios with Mobile-MCP
- Capture screenshots
- Document actual results
- Note any deviations

// Step 4: Bug Reporting (with qa-ui if bugs found)
- Document bugs with reproduction steps
- Include screenshots/evidence
- Assign severity
- Create bug report in .claude/qa/test-results/

// Step 5: Fix and Verify Cycle
- If bugs found:
  - Invoke backend-engineer or frontend-engineer to fix
  - Invoke code-quality-enforcer to validate fix
  - Invoke qa-ui to verify bug is fixed
  - Repeat until all bugs resolved
```

### Regression Testing

**Recommended Agent Order**: qa-ui

```typescript
// Step 1: Identify Affected Areas (with qa-ui)
- Review changes made
- Identify related features
- Select test scenarios to re-run

// Step 2: Execute Tests (with qa-ui)
- Run selected test scenarios
- Verify no regressions
- Document results

// Step 3: Report (with qa-ui)
- Update test results
- Report any new bugs
- Mark regression tests complete
```

---

## Parallel Agent Invocation

When multiple agents can work independently, invoke them in parallel for efficiency.

### Example: Feature Review

**Invoke in Parallel**:
```typescript
// Single message with multiple Task calls:
- Task(code-quality-enforcer): "Run all quality checks"
- Task(qa-ui): "Execute test scenarios"

// Both run simultaneously
// Wait for both to complete before proceeding
```

### Example: Multi-Tier Changes

**Invoke in Parallel**:
```typescript
// After implementation is complete:
- Task(code-quality-enforcer): "Validate backend changes"
- Task(qa-ui): "Test mobile UI changes"
- Task(task-doc-tracker): "Update documentation"

// All three run simultaneously
```

---

## Sequential Agent Invocation

When agents depend on previous results, invoke them sequentially.

### Example: Fix → Validate → Deploy

**Invoke Sequentially**:
```typescript
// Step 1: Fix implementation
Task(backend-engineer): "Fix authentication bug"

// Wait for completion, then Step 2: Validate
Task(code-quality-enforcer): "Validate fix"

// Wait for completion, then Step 3: Test
Task(qa-ui): "Verify bug is fixed"

// Each step depends on previous completion
```

---

## Common Workflow Patterns

### Pattern 1: Full Stack Feature

```
task-doc-tracker (plan)
  ↓
backend-engineer (API) + frontend-engineer (UI) [parallel]
  ↓
code-quality-enforcer (validate)
  ↓
qa-ui (test)
  ↓
task-doc-tracker (complete)
```

### Pattern 2: Bug Fix

```
backend-engineer or frontend-engineer (investigate + fix)
  ↓
code-quality-enforcer (validate)
  ↓
qa-ui (verify fix) [optional]
  ↓
task-doc-tracker (document)
```

### Pattern 3: Refactoring

```
task-doc-tracker (plan refactoring)
  ↓
backend-engineer or frontend-engineer (refactor)
  ↓
code-quality-enforcer (validate)
  ↓
qa-ui (regression test) [optional but recommended]
  ↓
task-doc-tracker (document improvements)
```

### Pattern 4: Database Migration

```
backend-engineer (design schema)
  ↓
backend-engineer (create migration + update code)
  ↓
code-quality-enforcer (validate)
  ↓
backend-engineer (verify migration works)
  ↓
task-doc-tracker (document)
```

---

## Agent Coordination Best Practices

### 1. Always Start with Documentation

**Why**: Captures requirements, creates audit trail, provides context

**Agent**: task-doc-tracker

**When**: Before starting any significant work

### 2. Use Parallel Invocation When Possible

**Why**: Faster completion, efficient use of time

**Example**: Running quality checks while testing mobile UI

### 3. Validate After Every Implementation

**Why**: Catch issues early, maintain quality standards

**Agent**: code-quality-enforcer

**When**: After every implementation or fix

### 4. Test Mobile Features Comprehensively

**Why**: Prevent production bugs, ensure accessibility

**Agent**: qa-ui

**When**: New mobile features, bug fixes, refactoring

### 5. Always Close the Loop with Documentation

**Why**: Preserve knowledge, track progress, extract learnings

**Agent**: task-doc-tracker

**When**: After completing work, even if partially done

---

## Agent Communication

### What to Provide to Agents

#### To backend-engineer:
- Feature requirements
- API contracts
- Database schema needs
- Related patterns to follow
- Security requirements

#### To frontend-engineer:
- UI/UX requirements
- API endpoints to integrate
- Navigation flows
- Accessibility requirements
- Design mockups (if available)

#### To code-quality-enforcer:
- Just invoke - agent knows what to check
- Optionally: specific files to focus on

#### To qa-ui:
- Test plan or scenarios
- Expected behaviors
- Edge cases to test
- Performance targets

#### To task-doc-tracker:
- Task status updates
- Learnings to document
- Patterns to extract
- V1 plan updates

---

## Troubleshooting Workflows

### When Tests Fail

```
code-quality-enforcer (identifies failures)
  ↓
backend-engineer or frontend-engineer (fix issues)
  ↓
code-quality-enforcer (re-validate)
  ↓
Repeat until passing
```

### When Bugs Found in Testing

```
qa-ui (finds and reports bugs)
  ↓
backend-engineer or frontend-engineer (fixes bugs)
  ↓
code-quality-enforcer (validates fixes)
  ↓
qa-ui (verifies bugs fixed)
  ↓
Repeat for each bug
```

### When Architecture Needs Review

```
backend-engineer or frontend-engineer (expresses concern)
  ↓
Review with team or architect
  ↓
task-doc-tracker (document decision)
  ↓
Continue with implementation
```

---

## Related Documentation

- [Backend Engineer Agent](.claude/agents/backend-engineer.md)
- [Frontend Engineer Agent](.claude/agents/frontend-engineer.md)
- [Code Quality Enforcer Agent](.claude/agents/code-quality-enforcer.md)
- [QA UI Agent](.claude/agents/qa-ui.md)
- [Task Doc Tracker Agent](.claude/agents/task-doc-tracker.md)
- [Architecture Patterns](../docs/architecture/patterns/README.md)
- [Testing Guide](../docs/testing/README.md)
