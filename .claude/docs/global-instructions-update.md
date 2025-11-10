# Global CLAUDE.md Instructions Update

**For updating ~/.claude/CLAUDE.md (global instructions)**

---

## Changes Required

The global agent auto-invocation instructions need updates to reflect the Linear-based PM workflow used in projects with PM commands.

---

## Section to Update: Agent Invocation Decision Tree

### Current (Outdated)

```markdown
### When planning?
→ Invoke: `backend-architect`, `frontend-developer`, `security-auditor`, `tdd-orchestrator`
```

### Proposed (Updated)

```markdown
### When planning?

**If project has `/pm:*` commands (check with `/pm:utils:help`)**:
→ Guide user to use PM commands first:
  - Complex features: `/pm:spec:create` → `/pm:spec:write` → `/pm:spec:review`
  - Quick tasks: `/pm:planning:create` or `/pm:planning:quick-plan`
→ Then invoke agents during implementation phase

**If project uses local markdown task tracking**:
→ Invoke: `backend-architect`, `frontend-developer`, `security-auditor`, `tdd-orchestrator`
```

---

## Section to Update: Pre-Commit Quality Gates

### Current (Outdated)

```markdown
**TRIGGER:** Before EVERY commit (manual or via `/commit` command)

**MANDATORY QUALITY CHECK SEQUENCE:**

### Phase 0: IDE Diagnostics (ALWAYS FIRST)
...

### Phase 1: Code Quality (Parallel)
**Only after IDE diagnostics are clean**, invoke in parallel:
- `code-review-ai:code-reviewer` - Code quality, security, performance
- `full-stack-orchestration:test-automator` - Verify all tests pass
- `unit-testing:debugger` - Check for any runtime issues
```

### Proposed (Updated)

```markdown
**TRIGGER:** Before EVERY commit (manual or via `/commit` command)

**MANDATORY QUALITY CHECK SEQUENCE:**

### Phase 0: IDE Diagnostics (ALWAYS FIRST)
...

### Phase 1: Code Quality (Parallel)
**Only after IDE diagnostics are clean**:

**If project has `/pm:*` commands**:
1. Run `/pm:verification:check <linear-issue-id>` (includes IDE, linting, tests)
2. If failures, run `/pm:verification:fix <linear-issue-id>`
3. When clean, invoke `code-review-ai:code-reviewer` for manual review

**If project uses local markdown**:
Invoke in parallel:
- `code-review-ai:code-reviewer` - Code quality, security, performance
- `full-stack-orchestration:test-automator` - Verify all tests pass
- `unit-testing:debugger` - Check for any runtime issues
```

---

## New Section to Add: Linear PM Workflow (Optional)

If the user works with multiple projects that use Linear PM commands, add this section:

```markdown
## 🎯 Linear PM Workflow Integration

Some projects may use Linear for project management with comprehensive PM command workflows.

### Detecting PM Commands

Check if a project has PM commands:
```bash
/pm:utils:help
```

If available, the project uses Linear-based PM workflow.

### PM Workflow Stages

When working with Linear PM projects:

1. **Planning Stage**
   - Complex features → `/pm:spec:create epic|feature`
   - Quick tasks → `/pm:planning:create` or `/pm:planning:quick-plan`
   - Spec writing → `/pm:spec:write <doc-id> <section>`
   - Spec review → `/pm:spec:review <doc-id>`

2. **Implementation Stage**
   - Start → `/pm:implementation:start <issue-id>`
   - Next action → `/pm:implementation:next <issue-id>`
   - Update subtask → `/pm:implementation:update <id> <idx> <status> "<msg>"`
   - Sync spec → `/pm:spec:sync <issue-id>`

3. **Verification Stage**
   - Quality checks → `/pm:verification:check <issue-id>`
   - Final verification → `/pm:verification:verify <issue-id>`
   - Fix failures → `/pm:verification:fix <issue-id>`

4. **Completion Stage**
   - Finalize → `/pm:complete:finalize <issue-id>`

### Agent Invocation with Linear

**Planning**: Guide user to PM commands instead of invoking planning agents directly

**Implementation**: Invoke `backend-engineer`/`frontend-engineer` after Linear issue is created

**Pre-Commit**: Use `/pm:verification:check` before invoking `code-quality-enforcer`

**Documentation**: Invoke `task-doc-tracker` to ensure Linear is updated and learnings extracted to CLAUDE.md

### Legacy vs Linear Projects

**Linear PM Projects**:
- Have `/pm:*` commands available
- Use Linear for task tracking
- May have `.claude/tasks/` as read-only reference
- CLAUDE.md references PM workflow

**Legacy Markdown Projects**:
- No `/pm:*` commands
- Use `.claude/tasks/` for tracking
- Follow traditional markdown-based workflows
- Standard agent invocation applies
```

---

## Section to Update: /commit Command Implementation

### Current (Outdated)

```markdown
3. CHECK IDE DIAGNOSTICS (Phase 0 - MANDATORY):
   - Read IDE diagnostics for all staged files
   - If errors/warnings found → STOP, report to user, provide fixes
   - Only continue when IDE shows zero issues

4. INVOKE QUALITY GATE AGENTS (parallel):
   - Task(code-reviewer): "Review all staged changes for quality, security, performance"
   - Task(test-automator): "Run all tests and verify passing status"
```

### Proposed (Updated)

```markdown
3. CHECK IDE DIAGNOSTICS (Phase 0 - MANDATORY):
   - Read IDE diagnostics for all staged files
   - If errors/warnings found → STOP, report to user, provide fixes
   - Only continue when IDE shows zero issues

4. QUALITY CHECKS:

   **If project has Linear PM** (check for `/pm:*` commands):
   a. Determine Linear issue ID (ask user or detect from branch)
   b. Run `/pm:verification:check <issue-id>`
   c. If failures → Run `/pm:verification:fix <issue-id>` and retry
   d. When clean → Invoke `code-review-ai:code-reviewer` for final review

   **If project uses markdown task tracking**:
   a. Invoke quality gate agents in parallel:
      - Task(code-reviewer): "Review all staged changes"
      - Task(test-automator): "Run all tests and verify passing status"
```

---

## When to Apply These Changes

### Projects Using Linear PM

Projects with these indicators:
- Has `.claude/commands/pm:*/` directory
- Has `/pm:utils:help` command available
- CLAUDE.md references Linear workflow
- Has Linear MCP server configured

Examples:
- `nv-internal` (confirmed)
- Any project with PM command structure

### Projects Using Legacy Markdown

Projects with these indicators:
- Has `.claude/tasks/` with active task files
- CLAUDE.md references task file creation
- No `/pm:*` commands available

For these projects, keep existing agent invocation patterns.

---

## Implementation Checklist

When updating global CLAUDE.md:

- [ ] Update "Agent Invocation Decision Tree" section
- [ ] Update "Pre-Commit Quality Gates" section
- [ ] Update "/commit Command Implementation" section
- [ ] Optionally add "Linear PM Workflow Integration" section
- [ ] Test with Linear PM project (nv-internal)
- [ ] Test with legacy markdown project (if available)
- [ ] Verify agent behaviors match expectations

---

## Testing the Changes

### Test 1: Planning Phase

**With Linear PM project**:
```
User: "I want to add a new payment feature"
Expected: Claude guides to /pm:spec:create or /pm:planning:create
```

**With legacy markdown project**:
```
User: "I want to add a new payment feature"
Expected: Claude invokes planning agents (backend-architect, etc.)
```

### Test 2: Pre-Commit

**With Linear PM project**:
```
User: "/commit"
Expected: Claude asks for Linear issue ID, runs /pm:verification:check
```

**With legacy markdown project**:
```
User: "/commit"
Expected: Claude invokes code-reviewer and test-automator directly
```

### Test 3: Documentation

**With Linear PM project**:
```
User: "I've completed the auth feature"
Expected: task-doc-tracker checks Linear, updates issue, extracts to CLAUDE.md
```

**With legacy markdown project**:
```
User: "I've completed the auth feature"
Expected: task-doc-tracker creates/updates markdown task file
```

---

## Backward Compatibility

The updated instructions maintain backward compatibility:

✅ **Projects without PM commands**: Continue using existing agent-based workflows
✅ **Projects with PM commands**: Use Linear-first approach, then agents
✅ **Mixed usage**: Detected automatically via `/pm:utils:help` availability

No breaking changes to existing projects or workflows.

---

## Notes

- This update assumes the user's global CLAUDE.md is at `~/.claude/CLAUDE.md`
- The user should manually apply these changes to their global instructions
- Changes are additive and maintain backward compatibility
- The `task-doc-tracker` agent already updated to handle Linear projects

---

**Created**: 2025-11-10
**For**: Global CLAUDE.md instructions update
**Related**: Linear migration in nv-internal project
