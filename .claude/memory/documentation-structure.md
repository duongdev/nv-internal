# Documentation Structure Standards

**Created**: 2025-10-30
**Purpose**: Canonical guide for project documentation organization
**Status**: Active standard for all documentation

---

## Overview

The NV Internal project uses a structured documentation system designed to track implementation work, future enhancements, and architectural decisions. This guide defines the standards for creating, organizing, and maintaining documentation across the project.

### Core Principles

1. **Single Source of Truth**: One file tracks the entire lifecycle of a feature or task
2. **Descending Sort**: UTC timestamp format ensures newest files appear first
3. **Clear Separation**: Different directories for different purposes (tasks vs enhancements vs plans)
4. **Cross-Referencing**: Documents link to related files for context
5. **Historical Accuracy**: Original plans preserved, updates tracked separately

---

## Directory Structure

### `.claude/tasks/`

**Purpose**: Track active implementation work from planning through completion

**When to use**:
- Starting any new feature implementation
- Fixing bugs or issues
- Making architectural changes
- Performing refactoring work
- Documenting research or investigations

**Format**: `YYYYMMDD-HHMMSS-description.md` (UTC timestamp)

**Example filenames**:
- `20251029-105427-employee-reports-api-implementation.md`
- `20251024-072509-implement-payment-system-backend.md`
- `20251023-102958-fix-settings-scroll-boundary-bug.md`

**Structure**:
```markdown
# Task: [Clear Title]

**Created**: YYYY-MM-DD HH:MM:SS UTC
**Status**: ⏳ In Progress | ✅ Completed
**Updated**: [timestamp] - [what changed]
**Related Plan**: [link to v1 plan if applicable]
**Priority**: 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low

---

## Overview
[What problem this solves]

## Implementation Status
[Current state and progress]

## Problem Analysis
[Technical details of the issue]

## Implementation Plan
- [ ] Step 1
- [x] Step 2 (completed)
- [ ] Step 3

## Testing Scenarios
[Test cases and results]

## Notes
[Decisions made, context, learnings]
```

**Important**: A single task file tracks ALL phases - do NOT create separate files for planning vs implementation phases.

---

### `.claude/enhancements/`

**Purpose**: Document future features and improvements beyond V1 scope

**When to use**:
- Proposing features not in current roadmap
- Documenting optimization opportunities discovered during development
- Capturing user feedback for future consideration
- Planning technical debt reduction
- Recording nice-to-have improvements

**Format**: Same as tasks - `YYYYMMDD-HHMMSS-description.md`

**Example filenames**:
- `20251029-173000-employee-summary-report.md`
- `20251024-105530-location-prefetch-optimization.md`
- `20251024-120100-search-and-filter-system.md`

**Structure**:
```markdown
# Enhancement: [Title]

**Created**: YYYY-MM-DD HH:MM:SS UTC
**Status**: ⏳ Not Started | 📋 Planned | 🔄 In Progress | ✅ Completed | ❌ Rejected
**Priority**: Critical | High | Medium | Low
**Estimated Effort**: [time estimate]
**Related V1 Feature**: [link if this enhances a V1 feature]

---

## Overview
[What this enhancement provides and why it's valuable]

## Problem Analysis
[Current limitations or pain points]

## Proposed Solution
[Technical approach and architecture]

## Implementation Plan
[High-level steps and phases]

## Benefits
- User benefits
- Technical benefits
- Business value

## Considerations
[Trade-offs, risks, dependencies]
```

**Key distinction**: Enhancements are NOT updates to completed V1 features - they are separate improvements tracked independently.

---

### `.claude/plans/v1/`

**Purpose**: Original V1 feature specifications and requirements

**When to use**:
- Referencing original requirements
- Updating completion status only
- Understanding feature scope

**What NOT to do**:
- Do not add enhancement ideas to completed plan files
- Do not modify technical specifications after implementation
- Do not use for documenting post-V1 improvements

**Files**:
- `README.md` - Master plan with progress tracking
- `01-payment-system.md` - Payment tracking specifications
- `02-checkin-checkout.md` - GPS check-in/out specifications
- `03-monthly-reports.md` - Employee reports specifications
- `04-task-crud.md` - Task editing specifications
- `05-employee-management.md` - Employee CRUD specifications

**Updates allowed**:
- Status changes (⏳ → ✅)
- Completion dates
- Links to implementation task files
- Clarifications of ambiguous requirements

---

### `docs/architecture/patterns/`

**Purpose**: Living documentation of implementation patterns and best practices

**When to use**:
- Documenting reusable patterns discovered during implementation
- Establishing coding standards
- Recording architectural decisions
- Sharing best practices across the team

**Format**: `pattern-name.md` (descriptive names, no timestamps)

**Example files**:
- `route-organization.md`
- `gps-verification.md`
- `activity-event.md`
- `error-handling.md`
- `payment-transactions.md`

**Structure**:
```markdown
# Pattern: [Name]

## Problem
[What problem this pattern solves]

## Solution
[How to implement this pattern]

## Example
[Code example]

## When to Use
[Specific scenarios]

## Anti-patterns
[What NOT to do]
```

---

### `.claude/research/`

**Purpose**: Document research findings and technical investigations

**When to use**:
- Evaluating third-party services
- Comparing technical solutions
- Recording performance analyses
- Documenting proof-of-concepts

**Format**: `YYYYMMDD-HHMMSS-topic.md` or `QUICK-REFERENCE-topic.md`

**Example files**:
- `20251024-220000-production-bug-tracking-solutions.md`
- `QUICK-REFERENCE-bug-tracking.md`
- `PERFORMANCE-ANALYSIS-bug-tracking.md`

---

### `.claude/agents/`

**Purpose**: Specialized agent documentation and configuration

**Updated**: 2025-11-07 (Reorganization)

**When to use**:
- Documenting specialized agent capabilities
- Providing project-specific context to agents
- Recording agent usage patterns and workflows

**Files** (as of 2025-11-07):
- `backend-engineer.md` - Backend development expert
- `frontend-engineer.md` - Mobile/UI development expert
- `code-quality-enforcer.md` - Quality validation expert
- `qa-ui.md` - Mobile testing expert
- `task-doc-tracker.md` - Documentation tracking expert

**Structure**:
Each agent file includes:
- Agent capabilities and expertise
- Project-specific context (tech stack, patterns, standards)
- Common workflows and best practices
- Related documentation links
- When to invoke the agent

**Cross-reference**: See `.claude/docs/agent-workflows.md` for detailed workflow coordination patterns.

---

### `.claude/memory/`

**Purpose**: Standardized patterns and conventions for consistency

**When to use**:
- Documenting project-wide standards (like this file)
- Recording important learnings that apply globally
- Establishing conventions that should be followed

**Files**:
- `documentation-structure.md` (this file)
- `README.md` - Index of memory files

---

## File Naming Convention

### Timestamp Format

**Format**: `YYYYMMDD-HHMMSS-description.md`

- **YYYYMMDD**: Date in UTC (e.g., 20251030)
- **HHMMSS**: Time in UTC (e.g., 143022 for 14:30:22)
- **description**: Kebab-case description (e.g., fix-auth-bug)

**Why UTC?**: Ensures consistent sorting regardless of developer timezone

**Examples**:
- ✅ `20251030-143022-implement-search-feature.md`
- ✅ `20251029-090000-fix-payment-validation.md`
- ❌ `implement-search-feature.md` (missing timestamp)
- ❌ `2025-10-30-search.md` (wrong date format)

### Special Filenames

Some files don't use timestamps:

- `README.md` - Directory indexes
- `ROLLBACK-PLAYBOOK.md` - Emergency procedures
- `REFACTORING-EXECUTIVE-SUMMARY.md` - Summary documents
- Pattern files in `docs/` - Use descriptive names

---

## Cross-Referencing Guidelines

### How to Link Between Documents

**From task to V1 plan**:
```markdown
**Related Plan**: `.claude/plans/v1/01-payment-system.md` (Phase 1 - Payment System)
```

**From enhancement to V1 feature**:
```markdown
**Related V1 Feature**: `.claude/plans/v1/03-monthly-reports.md` - This enhances the basic reporting with summary views
```

**From task to architecture pattern**:
```markdown
**Implementation Pattern**: See `docs/architecture/patterns/activity-event.md` for the event logging pattern used
```

**From any document to task**:
```markdown
**Implementation**: See `.claude/tasks/20251029-105427-employee-reports-api-implementation.md` for details
```

### Cross-Reference Best Practices

1. **Use relative paths** from project root
2. **Include brief context** after the link
3. **Link to specific sections** when relevant: `file.md#section-name`
4. **Verify links work** before committing

---

## Common Mistakes to Avoid

### ❌ Anti-Pattern 1: Multiple Files Per Task Phase

**Wrong**:
```
20251029-090000-payment-planning.md
20251029-140000-payment-implementation.md
20251029-180000-payment-testing.md
```

**Correct**:
```
20251029-090000-payment-system-implementation.md (tracks all phases)
```

**Why**: Single file maintains complete context and history

### ❌ Anti-Pattern 2: Updating V1 Plans with Enhancements

**Wrong**:
Adding "Future Enhancement: Add PDF export" to completed `03-monthly-reports.md`

**Correct**:
Create `.claude/enhancements/20251030-100000-report-pdf-export.md`

**Why**: V1 plans are historical specifications, enhancements are separate

### ❌ Anti-Pattern 3: Generic Filenames

**Wrong**:
```
fix-bug.md
update.md
new-feature.md
```

**Correct**:
```
20251030-143022-fix-auth-token-expiry.md
20251030-150000-update-payment-validation.md
20251030-160000-implement-bulk-task-creation.md
```

**Why**: Descriptive names help identify content without opening files

### ❌ Anti-Pattern 4: Inconsistent Status Updates

**Wrong**:
Leaving status as "⏳ In Progress" after implementation is complete

**Correct**:
Update to "✅ Completed" and add completion timestamp

**Why**: Accurate status helps track project progress

### ❌ Anti-Pattern 5: Missing Cross-References

**Wrong**:
Task file with no links to related plans or patterns

**Correct**:
Include all relevant links in header section

**Why**: Cross-references provide context and prevent duplicate work

---

## Examples from the Codebase

### Example 1: Complete Task Lifecycle

**File**: `.claude/tasks/20251029-105427-employee-reports-api-implementation.md`

This file demonstrates:
- Single file tracking planning → implementation → testing → completion
- Clear status updates with timestamps
- Links to V1 plan and enhancement
- Comprehensive test results
- Implementation decisions documented
- Lessons learned section

### Example 2: Enhancement Documentation

**File**: `.claude/enhancements/20251029-173000-employee-summary-report.md`

This file shows:
- Clear separation from V1 requirements
- Link to related V1 feature it enhances
- Detailed technical proposal
- Benefits clearly articulated
- Not modifying the original V1 plan

### Example 3: V1 Plan with Status Updates

**File**: `.claude/plans/v1/README.md`

This file illustrates:
- Original specifications preserved
- Status updates clearly marked
- Links to implementation task files
- Progress tracking without altering requirements

---

## Workflow Examples

### Starting a New Feature

1. **Review V1 plan** if implementing planned feature
2. **Create task file** with timestamp: `20251030-150000-implement-feature.md`
3. **Document plan** in Problem Analysis and Implementation Plan sections
4. **Update status** to "⏳ In Progress" when starting
5. **Track progress** with checkbox updates
6. **Document results** in Testing Scenarios
7. **Update status** to "✅ Completed" when done
8. **Update V1 plan** status if applicable

### Proposing an Enhancement

1. **Verify not in V1 scope** by checking `.claude/plans/v1/`
2. **Create enhancement file**: `20251030-160000-enhancement-name.md`
3. **Document thoroughly** with problem, solution, benefits
4. **Link to related features** if enhancing existing functionality
5. **Update** `.claude/enhancements/README.md` with new entry
6. **Prioritize** in enhancement priorities file

### Documenting a Pattern

1. **Identify reusable pattern** during implementation
2. **Create pattern file** in `docs/architecture/patterns/`
3. **Include code examples** showing correct usage
4. **Document anti-patterns** to prevent mistakes
5. **Link from task file** where pattern was discovered
6. **Update CLAUDE.md** to reference new pattern

---

## Maintenance Guidelines

### Regular Reviews

**Weekly**:
- Update task file statuses
- Close completed tasks
- Archive old research files

**Monthly**:
- Review enhancement priorities
- Update V1 plan progress
- Clean up orphaned cross-references

**Quarterly**:
- Archive completed task files to `.claude/archive/`
- Review and update this standards document
- Consolidate learnings into CLAUDE.md

### Quality Checks

Before committing documentation:

- [ ] Filename follows timestamp format (UTC)
- [ ] Status reflects actual state
- [ ] Cross-references are valid
- [ ] Required sections are present
- [ ] Examples include actual code/output
- [ ] Decisions are explained with rationale

---

## Quick Reference

| Directory | Purpose | Timestamp? | Status Updates? |
|-----------|---------|------------|-----------------|
| `.claude/tasks/` | Active work | Yes | Yes, frequently |
| `.claude/enhancements/` | Future features | Yes | Yes, when implemented |
| `.claude/plans/v1/` | Original specs | No | Status only |
| `docs/architecture/patterns/` | Best practices | No | Content updates |
| `.claude/research/` | Investigations | Usually | No |
| `.claude/agents/` | Agent configs | No | Content updates |
| `.claude/memory/` | Standards | No | Content updates |

---

## Related Documents

- **Master Documentation**: `/CLAUDE.md`
- **V1 Master Plan**: `.claude/plans/v1/README.md`
- **Enhancement Priorities**: `.claude/enhancements/20251024-120300-enhancement-priorities.md`
- **Architecture Patterns**: `docs/architecture/patterns/`

---

**Document Version**: 1.0
**Next Review**: 2025-01-30
**Maintainer**: Task Documentation Tracker Agent
---

## New Documentation Structure (2025-11-07)

### CLAUDE.md Reorganization

The main CLAUDE.md file was reorganized from 969 lines to 290 lines (70% reduction) by extracting content to specialized files:

**New Files Created**:
- `.claude/agents/*.md` - Individual agent documentation (5 files)
- `.claude/docs/agent-workflows.md` - Detailed workflow coordination patterns
- `docs/architecture/patterns/CHANGELOG.md` - Recently established patterns timeline
- `docs/architecture/database-patterns.md` - Consolidated database patterns
- `docs/development/environment-setup.md` - Environment variable management

**CLAUDE.md Now Serves As**:
- Quick reference and navigation hub
- Links to detailed documentation
- Critical patterns summary only
- Agent quick reference table

**Benefits**:
- Faster to navigate and understand
- Easier to maintain and update
- Clear separation of concerns
- Better organization for growth

### `.claude/docs/`

**Purpose**: Project-wide documentation that doesn't fit in other directories

**Files** (as of 2025-11-07):
- `agent-workflows.md` - Detailed agent coordination patterns
- `feature-flags-guide.md` - PostHog feature flag patterns
- `error-tracking-guide.md` - Error tracking implementation

**When to use**:
- Guides that span multiple concerns
- Project-wide practices
- Integration patterns
- Tool-specific guidance

### `docs/architecture/`

**Purpose**: Technical architecture documentation

**Structure**:
- `patterns/` - Implementation patterns with metadata
- `patterns/CHANGELOG.md` - Recently established patterns
- `patterns/README.md` - Pattern navigation and selection guide
- `database-patterns.md` - Database design and optimization

**Pattern File Format** (updated 2025-11-07):
Each pattern file now includes metadata header:
```markdown
# Pattern Name

**Established**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD
**Reference**: `.claude/tasks/YYYYMMDD-HHMMSS-task-name.md`

[Pattern content...]
```

**CHANGELOG Format**:
Organized by date (descending), each entry includes:
- Pattern name and link
- Problem solved
- Solution approach
- Key details
- Impact
- Implementation task references

### `docs/development/`

**Purpose**: Developer guides and setup documentation

**Files** (as of 2025-11-07):
- `setup.md` - Complete environment setup
- `environment-setup.md` - Environment variable management
- `commands.md` - Command reference
- `quality-workflow.md` - Quality standards
- `README.md` - Development guide navigation

**When to add new files**:
- Setup guides for new tools
- Workflow documentation
- Developer onboarding content

---

## Documentation Maintenance

### Updating CHANGELOG.md

When establishing a new pattern:

1. Add entry to `docs/architecture/patterns/CHANGELOG.md`
2. Update pattern file with metadata header
3. Link implementation task
4. Update `docs/architecture/patterns/README.md` "Recent Additions" section if needed

### Updating Agent Documentation

When agent context changes:

1. Update relevant file in `.claude/agents/`
2. Update `.claude/docs/agent-workflows.md` if workflows change
3. Keep CLAUDE.md agent table up to date

### Keeping CLAUDE.md Concise

**Do NOT add to CLAUDE.md**:
- Detailed implementation patterns (→ `docs/architecture/patterns/`)
- Long workflow descriptions (→ `.claude/docs/agent-workflows.md`)
- Database details (→ `docs/architecture/database-patterns.md`)
- Environment details (→ `docs/development/environment-setup.md`)
- Recently established patterns (→ `docs/architecture/patterns/CHANGELOG.md`)

**DO add to CLAUDE.md**:
- Critical must-know patterns (with link to details)
- New specialized agents (in quick reference table)
- New major documentation sections (in navigation)

**Target**: Keep CLAUDE.md under 400 lines

---

## Version History

- **v1.0** (2025-10-30): Initial documentation structure established
- **v2.0** (2025-11-07): Major reorganization - extracted content from CLAUDE.md, created specialized documentation files, established agent documentation structure, added pattern CHANGELOG

---

## Related Documentation

- Main project guide: `CLAUDE.md`
- Agent documentation: `.claude/agents/*.md`
- Agent workflows: `.claude/docs/agent-workflows.md`
- Pattern catalog: `docs/architecture/patterns/README.md`
- Recent patterns: `docs/architecture/patterns/CHANGELOG.md`
