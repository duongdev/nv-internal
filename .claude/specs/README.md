# Specs Directory - DEPRECATED

**Status**: ⚠️ DEPRECATED - This directory is no longer used for new documentation

---

## Migration Notice

As of **2025-11-10**, all spec and task documentation has migrated to **Linear**.

### What Happened

- ✅ **Before**: Specs stored as markdown files in `.claude/specs/`
- ✅ **Now**: Specs stored as **Linear Documents** with full PM workflow support
- ✅ **Migration Guide**: See [.claude/docs/linear-migration-guide.md](../docs/linear-migration-guide.md)

### This Directory Status

- **Read-Only**: Files here are kept for historical reference only
- **No New Files**: Never create new files in this directory
- **Migration**: Use `/pm:spec:migrate` to import specs to Linear if actively needed

### New Workflow

**For new specs**:
```bash
# Create Epic/Feature with spec document
/pm:spec:create epic "Feature Name"
/pm:spec:create feature "Sub-Feature Name"

# Write spec sections
/pm:spec:write <doc-id> requirements
/pm:spec:write <doc-id> architecture
/pm:spec:write <doc-id> all  # Write all sections
```

**To migrate existing specs**:
```bash
# Automated migration
/pm:spec:migrate /Users/duongdev/personal/nv-internal

# Or specific directory
/pm:spec:migrate /Users/duongdev/personal/nv-internal specs
```

---

## Where to Find Current Documentation

- **Active Specs**: Linear Documents (use `/pm:spec:*` commands)
- **Task Tracking**: Linear Issues (use `/pm:planning:*` and `/pm:implementation:*` commands)
- **Architecture Patterns**: [../docs/architecture/patterns/](../docs/architecture/patterns/)
- **Development Guides**: [../docs/development/](../docs/development/)
- **PM Workflow**: Run `/pm:utils:help` for command reference

---

## Need Help?

- **Migration Guide**: [.claude/docs/linear-migration-guide.md](../docs/linear-migration-guide.md)
- **PM Commands**: Run `/pm:utils:help`
- **Project Guide**: See [CLAUDE.md](../../CLAUDE.md)

---

**Last Updated**: 2025-11-10
**Migration Status**: Complete
