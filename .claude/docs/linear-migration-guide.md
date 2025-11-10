# Linear Migration Guide

**Migration from Local Markdown to Linear Project Management**

---

## Overview

As of 2025-11-10, NV Internal project management has migrated from local markdown files (`.claude/tasks/`, `.claude/plans/v1/`) to **Linear** with comprehensive PM command workflows.

## What Changed

### Before (Legacy)
- ✅ Task tracking: `.claude/tasks/YYYYMMDD-HHMMSS-description.md`
- ✅ V1 plans: `.claude/plans/v1/*.md`
- ✅ Enhancement ideas: `.claude/enhancements/*.md`
- ❌ Manual file creation and updates
- ❌ No integration with external PM tools
- ❌ No automated workflow support

### After (Current)
- ✅ Task tracking: **Linear issues** with full workflow automation
- ✅ Planning: **Linear spec documents** with AI-assisted writing
- ✅ Integration: Jira, Confluence, Slack, BitBucket via PM commands
- ✅ Automated workflows: Planning → Implementation → Verification → Completion
- ✅ AI-powered insights and agent coordination

---

## Legacy Files Status

### Read-Only Reference

All legacy markdown files are now **read-only** and kept for **historical reference**:

| Directory | Status | Purpose |
|-----------|--------|---------|
| `.claude/tasks/` | Read-only | Historical task documentation, reference for past decisions |
| `.claude/plans/v1/` | Read-only | Historical V1 planning, reference for feature context |
| `.claude/enhancements/` | Read-only | Historical enhancement ideas, migrate actively needed ones to Linear |

**IMPORTANT**:
- ❌ **NEVER create new files** in these directories
- ❌ **NEVER update existing files** in these directories
- ✅ **DO reference** them for historical context
- ✅ **DO migrate** important content to Linear if actively needed

---

## Migration Process

### Option 1: Automated Migration (Recommended)

Use the `/pm:spec:migrate` command to import existing markdown specs to Linear:

```bash
# Migrate all specs
/pm:spec:migrate /Users/duongdev/personal/nv-internal

# Migrate specific category
/pm:spec:migrate /Users/duongdev/personal/nv-internal plans
/pm:spec:migrate /Users/duongdev/personal/nv-internal enhancements
/pm:spec:migrate /Users/duongdev/personal/nv-internal tasks
```

**What it does**:
1. Scans markdown files in specified category
2. Creates Linear documents/issues based on content
3. Preserves structure and links
4. Adds labels for categorization
5. Links related issues/specs

### Option 2: Manual Migration

For selective migration or custom organization:

1. **Review legacy file** to extract key information
2. **Decide on Linear structure**:
   - Complex feature → Epic with spec doc (`/pm:spec:create epic`)
   - Feature component → Feature with spec doc (`/pm:spec:create feature`)
   - Task/bug → Task issue (`/pm:planning:create`)
3. **Create Linear entity** via appropriate command
4. **Copy relevant content** to Linear description/comments
5. **Add reference** to legacy file in Linear comments
6. **Mark legacy file** with note at top: `> **MIGRATED**: See Linear issue WORK-XXX`

---

## New Workflow Guide

### For Quick Tasks / Bug Fixes

**Old approach**:
```bash
# Create .claude/tasks/YYYYMMDD-HHMMSS-fix-auth-bug.md
# Manually document problem, implementation, testing
# Manually update status
```

**New approach**:
```bash
# Create Linear issue with planning
/pm:planning:create "Fix authentication token expiry bug" nv-internal

# OR for quick internal tasks
/pm:planning:quick-plan "Fix auth bug" nv-internal

# Implementation tracked via Linear comments and subtasks
# Status updated automatically through workflow
```

### For Complex Features

**Old approach**:
```bash
# Create .claude/plans/v1/XX-feature-name.md
# Manually write requirements, architecture, API design
# Manually create task files for each component
# Manually track progress
```

**New approach**:
```bash
# Create Epic with spec document
/pm:spec:create epic "Payment System"

# AI-assisted spec writing
/pm:spec:write <doc-id> all  # or specific sections

# Validate spec quality
/pm:spec:review <doc-id>

# Auto-generate tasks from spec
/pm:spec:break-down <epic-id>

# Implementation workflow with agents
/pm:implementation:start <task-id>
```

---

## PM Commands Quick Reference

### Planning
| Command | Use Case | Example |
|---------|----------|---------|
| `/pm:spec:create` | Create Epic/Feature with spec | `/pm:spec:create epic "User Auth System"` |
| `/pm:planning:create` | Quick task creation | `/pm:planning:create "Add JWT auth" nv-internal` |
| `/pm:planning:quick-plan` | Internal tasks (no Jira) | `/pm:planning:quick-plan "Fix bug" nv-internal` |
| `/pm:spec:write` | AI-assisted spec writing | `/pm:spec:write DOC-123 requirements` |
| `/pm:spec:review` | Validate spec quality | `/pm:spec:review DOC-123` |
| `/pm:spec:break-down` | Generate tasks from spec | `/pm:spec:break-down WORK-100` |
| `/pm:spec:migrate` | Import markdown specs | `/pm:spec:migrate ~/nv-internal plans` |

### Implementation
| Command | Use Case | Example |
|---------|----------|---------|
| `/pm:implementation:start` | Start with agents | `/pm:implementation:start WORK-123` |
| `/pm:implementation:next` | Find next action | `/pm:implementation:next WORK-123` |
| `/pm:implementation:update` | Update subtask | `/pm:implementation:update WORK-123 0 completed "Done"` |
| `/pm:spec:sync` | Check spec drift | `/pm:spec:sync WORK-123` |

### Verification
| Command | Use Case | Example |
|---------|----------|---------|
| `/pm:verification:check` | Quality checks | `/pm:verification:check WORK-123` |
| `/pm:verification:verify` | Final verification | `/pm:verification:verify WORK-123` |
| `/pm:verification:fix` | Fix failures | `/pm:verification:fix WORK-123` |

### Completion
| Command | Use Case | Example |
|---------|----------|---------|
| `/pm:complete:finalize` | Create PR, notify | `/pm:complete:finalize WORK-123` |

### Utilities
| Command | Use Case | Example |
|---------|----------|---------|
| `/pm:utils:help` | Context-aware help | `/pm:utils:help [WORK-123]` |
| `/pm:utils:status` | Show status | `/pm:utils:status WORK-123` |
| `/pm:utils:context` | Load task context | `/pm:utils:context WORK-123` |
| `/pm:utils:report` | Project report | `/pm:utils:report nv-internal` |
| `/pm:utils:insights` | AI analysis | `/pm:utils:insights WORK-123` |

---

## Workflow Examples

### Example 1: Bug Fix (Task-First)

```bash
# 1. Create task
/pm:planning:quick-plan "Fix login token expiry" nv-internal

# 2. Start implementation (returns WORK-123)
/pm:implementation:start WORK-123

# 3. Implement fix (Claude guides through)
# - Fix identified via agent
# - Tests written
# - Code updated

# 4. Verify quality
/pm:verification:check WORK-123
/pm:verification:verify WORK-123

# 5. Complete
/pm:complete:finalize WORK-123
# → Creates PR
# → Updates Jira if linked
# → Notifies team
```

### Example 2: Complex Feature (Spec-First)

```bash
# 1. Create Epic with spec
/pm:spec:create epic "Monthly Reports System"

# 2. Write spec sections (returns DOC-456)
/pm:spec:write DOC-456 requirements
/pm:spec:write DOC-456 architecture
/pm:spec:write DOC-456 api-design

# 3. Review spec
/pm:spec:review DOC-456
# → Returns quality grade (A-F)
# → Suggests improvements

# 4. Break down into features
/pm:spec:break-down WORK-200  # Epic ID
# → Creates Feature-1: Report Generation
# → Creates Feature-2: Export Options
# → Creates Feature-3: UI Dashboard

# 5. Implement each feature
/pm:implementation:start WORK-201  # Feature-1
# ... implement ...
/pm:verification:check WORK-201
/pm:complete:finalize WORK-201

# 6. Sync spec after implementation
/pm:spec:sync DOC-456
# → Documents deviations
# → Updates spec with reality
```

### Example 3: Migrating Legacy Plan

```bash
# 1. Review legacy plan
cat .claude/plans/v1/01-payment-system.md

# 2. Migrate to Linear
/pm:spec:migrate /Users/duongdev/personal/nv-internal plans

# 3. Claude creates:
# → Epic in Linear with spec doc
# → Preserves structure and content
# → Returns new Epic ID (WORK-300)

# 4. Continue in Linear
/pm:spec:review <new-doc-id>  # Validate migration
/pm:spec:write <new-doc-id> all  # Enhance if needed
/pm:spec:break-down WORK-300  # Generate tasks

# 5. Mark legacy file as migrated
echo "> **MIGRATED**: See Linear Epic WORK-300" | \
  cat - .claude/plans/v1/01-payment-system.md > temp && \
  mv temp .claude/plans/v1/01-payment-system.md
```

---

## CLAUDE.md Updates

The `CLAUDE.md` remains the **central knowledge repository** for:

### What Stays in CLAUDE.md

✅ **Architecture patterns** discovered during implementation
✅ **Best practices** and coding standards
✅ **Common pitfalls** and anti-patterns
✅ **Development commands** and workflows
✅ **Critical project context** (tech stack, patterns, file locations)
✅ **Quick reference** for agents and PM commands

### What Goes in Linear

✅ **Task tracking** and issue management
✅ **Feature planning** and spec documents
✅ **Implementation progress** and subtasks
✅ **Testing results** and verification
✅ **Team communication** and decisions
✅ **Project timeline** and milestones

### Knowledge Extraction Workflow

```
Implementation Complete (Linear WORK-123)
  ↓
Extract Learnings:
  - New architecture pattern
  - Performance optimization technique
  - Common pitfall discovered
  ↓
Update CLAUDE.md:
  - Add to "Key Architecture Patterns"
  - Add to "Performance" section
  - Reference Linear issue for details
  ↓
Link from Linear:
  - Add comment in WORK-123
  - "See CLAUDE.md section X for pattern details"
```

---

## task-doc-tracker Agent Updates

The `task-doc-tracker` agent has been updated to work with Linear:

### New Responsibilities

1. **Linear Issue Tracking**: Monitor work in Linear, not markdown files
2. **PM Command Guidance**: Guide users to appropriate `/pm:*` commands
3. **Spec Documentation**: Ensure complex features have spec docs
4. **Status Synchronization**: Keep Linear status accurate
5. **Knowledge Extraction**: Extract learnings to CLAUDE.md (references Linear issues)

### Legacy File Handling

- **Read-only**: Never creates new markdown task files
- **Reference**: Can reference legacy files for historical context
- **Migration**: Guides users to `/pm:spec:migrate` for active content

### Example Agent Interactions

**Before (Old)**:
```
User: "I've finished the payment feature"
Agent: "Creating task file .claude/tasks/20251110-payment-feature.md..."
```

**After (New)**:
```
User: "I've finished the payment feature"
Agent: "Let me check Linear... Found issue WORK-123. Running /pm:verification:check to validate quality..."
```

---

## Common Migration Scenarios

### Scenario 1: Active V1 Plan Needs Updates

**Problem**: V1 plan in `.claude/plans/v1/` needs updates for current implementation

**Solution**:
```bash
# 1. Migrate to Linear
/pm:spec:migrate /Users/duongdev/personal/nv-internal plans

# 2. Update in Linear
/pm:spec:write <new-doc-id> <section>

# 3. Never touch original markdown file
```

### Scenario 2: Old Task File Has Useful Context

**Problem**: Need to reference old task implementation details

**Solution**:
```bash
# 1. Read the legacy file (it's still there!)
cat .claude/tasks/20251023-150000-implement-oauth.md

# 2. Extract relevant info to current Linear issue
/pm:utils:context WORK-456  # Load current task
# Add comment to WORK-456 referencing old approach

# 3. If pattern is important, add to CLAUDE.md
# Reference both old task file AND new Linear issue
```

### Scenario 3: Enhancement Idea from Legacy Files

**Problem**: Good enhancement idea in `.claude/enhancements/`

**Solution**:
```bash
# 1. Read enhancement idea
cat .claude/enhancements/offline-sync.md

# 2. Create as Feature in Linear
/pm:spec:create feature "Offline Sync for Mobile App"

# 3. Write spec based on enhancement idea
/pm:spec:write <doc-id> all

# 4. Mark enhancement file as migrated
```

---

## FAQ

### Q: Can I still read legacy task files?

**A:** Yes! They're kept as read-only reference. Feel free to read them for historical context, past decisions, or implementation details.

### Q: What if I need to update a legacy plan?

**A:** Don't update the markdown file. Instead, migrate it to Linear via `/pm:spec:migrate` and update the Linear spec document.

### Q: Should I delete legacy files?

**A:** No. Keep them for reference. They contain valuable historical context and past implementation decisions.

### Q: What about ongoing work tracked in markdown files?

**A:** Complete them as-is if nearly done, or create Linear issues and reference the markdown files in Linear comments for context.

### Q: How do I reference legacy files in Linear?

**A:** Add a comment to the Linear issue:
```markdown
**Context from legacy planning**: See `.claude/plans/v1/01-payment-system.md` for original planning notes.
```

### Q: What happens to CLAUDE.md?

**A:** It stays! CLAUDE.md remains the central knowledge repository. It now references Linear for task tracking and includes PM command workflows.

### Q: Can I create new markdown task files?

**A:** No. Always use Linear via `/pm:*` commands. The `task-doc-tracker` agent will prevent new markdown file creation.

---

## Need Help?

### Get Context-Aware Help

```bash
# General help
/pm:utils:help

# Help for specific issue
/pm:utils:help WORK-123
```

### Common Resources

- **PM Command Reference**: Run `/pm:utils:help`
- **Agent Documentation**: See `.claude/agents/task-doc-tracker.md`
- **Project Documentation**: See `CLAUDE.md`
- **Legacy Files**: Browse `.claude/tasks/`, `.claude/plans/v1/` (read-only)

---

**Last Updated**: 2025-11-10
**Migration Status**: ✅ Complete
**Agent Updated**: task-doc-tracker (version 2.0)
