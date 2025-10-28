# CLAUDE.md Reorganization Plan

## Overview

The CLAUDE.md file has grown to 1307 lines and become difficult to navigate and maintain. This task documents a comprehensive plan to reorganize it into a more maintainable structure while preserving all valuable information.

## Implementation Status

⏳ In Progress - Plan created, awaiting implementation

## Problem Analysis

### Current Issues
1. **File Size**: 1307 lines makes navigation difficult
2. **Mixed Concerns**: Contains both high-level guidance and detailed implementation patterns
3. **Information Density**: Very detailed code examples and patterns mixed with project overview
4. **Redundancy**: Some information repeated in different contexts
5. **Maintenance Burden**: Single large file is hard to update and keep current

### Content Analysis

Current CLAUDE.md structure (with line counts):
- Project Overview & Architecture (15 lines)
- Agent Usage Documentation (206 lines) - **Critical, keep in main**
- Development Commands (71 lines) - **Extract to separate file**
- Code Quality & Commits (41 lines) - **Extract to separate file**
- Architecture Patterns (600+ lines) - **Extract to multiple pattern files**
- Mobile App Structure (25 lines) - **Keep in main as overview**
- Database Schema (5 lines) - **Keep in main as overview**
- Authentication Performance (59 lines) - **Extract to patterns**
- Development Guidelines (23 lines) - **Keep in main**
- Task Documentation (51 lines) - **Keep in main**
- V1 Feature Planning (30 lines) - **Keep in main**
- Enhancement Documentation (46 lines) - **Keep in main**
- Future Optimizations (23 lines) - **Keep in main**
- Backend Refactoring (74 lines) - **Extract to separate doc**
- File Locations & Setup (29 lines) - **Keep in main**

## Proposed New Structure

### Directory Structure
```
nv-internal/
├── CLAUDE.md (500-600 lines - main guidance)
├── docs/
│   ├── README.md (index of all documentation)
│   ├── development/
│   │   ├── commands.md (all development commands)
│   │   ├── code-quality.md (linting, testing, commits)
│   │   └── environment-setup.md (setup instructions)
│   ├── architecture/
│   │   ├── patterns/
│   │   │   ├── README.md (pattern index)
│   │   │   ├── api-patterns.md (routes, services, auth)
│   │   │   ├── data-patterns.md (transactions, validation)
│   │   │   ├── mobile-patterns.md (RN, testing, state)
│   │   │   └── performance-patterns.md (optimization techniques)
│   │   ├── refactoring/
│   │   │   └── backend-solid-principles.md
│   │   └── decisions/
│   │       └── authentication-optimization.md
│   └── testing/
│       ├── mobile-mcp-guide.md (from apps/mobile/)
│       └── api-testing.md
```

### Content Mapping

#### CLAUDE.md (Core - ~550 lines)
Keep only essential guidance:
- Project Overview (15 lines)
- **Agent Usage (FULL 206 lines)** - This is critical for Claude Code
- Mobile App Structure overview (25 lines)
- Database Schema overview (5 lines)
- Development Guidelines (23 lines)
- Task Documentation guide (51 lines)
- V1 Feature Planning guide (30 lines)
- Enhancement Documentation guide (46 lines)
- Future Optimizations summary (23 lines)
- Important File Locations (29 lines)
- Project Scale Context (5 lines)
- Links to extracted documentation (~50 lines)

**Total: ~508 lines**

#### docs/development/commands.md (~100 lines)
Extract:
- Common Development Commands (71 lines)
- Environment Setup (7 lines)
- Additional useful commands

#### docs/development/code-quality.md (~80 lines)
Extract:
- Pre-commit Requirements
- Conventional Commits format
- Pull Request guidelines
- Testing requirements
- Biome configuration

#### docs/architecture/patterns/api-patterns.md (~250 lines)
Extract:
- Route Organization Pattern
- Service Layer Error Handling Pattern
- Authentication Middleware Pattern
- Logger Pattern
- Reusable Utilities Pattern
- Activity-Based Event Pattern

#### docs/architecture/patterns/data-patterns.md (~200 lines)
Extract:
- Payment System Transaction Pattern
- FormData Validation Pattern
- GPS Verification Pattern
- Database Schema patterns
- Transaction best practices

#### docs/architecture/patterns/mobile-patterns.md (~150 lines)
Extract:
- Hono RPC File Upload Limitation Pattern
- Cache Invalidation Pattern
- Mobile-MCP Testing Pattern
- Mobile styling with NativeWind
- State management patterns

#### docs/architecture/patterns/performance-patterns.md (~100 lines)
Extract:
- Authentication Performance Optimization (JWT claims)
- Lazy Logger Pattern
- Storage Provider optimization
- File upload optimization plans

#### docs/architecture/refactoring/backend-solid-principles.md (~100 lines)
Move existing refactoring documentation with summary

## Implementation Plan

### Phase 1: Create Directory Structure
- [x] Design directory structure
- [ ] Create `docs/` directory and subdirectories
- [ ] Create README files for each section

### Phase 2: Extract Pattern Documentation
- [ ] Create api-patterns.md with API-related patterns
- [ ] Create data-patterns.md with data handling patterns
- [ ] Create mobile-patterns.md with mobile-specific patterns
- [ ] Create performance-patterns.md with optimization patterns

### Phase 3: Extract Development Documentation
- [ ] Create commands.md with all development commands
- [ ] Create code-quality.md with quality guidelines
- [ ] Create environment-setup.md with setup instructions

### Phase 4: Extract Architecture Documentation
- [ ] Move refactoring plans to dedicated file
- [ ] Create authentication optimization decision doc
- [ ] Create pattern index README

### Phase 5: Update CLAUDE.md
- [ ] Remove extracted content
- [ ] Add navigation section with links to docs
- [ ] Ensure agent documentation remains prominent
- [ ] Add "Quick Links" section for common tasks

### Phase 6: Create Navigation Aids
- [ ] Create docs/README.md as documentation index
- [ ] Add cross-references between related patterns
- [ ] Create pattern decision tree for common scenarios

### Phase 7: Testing & Validation
- [ ] Verify all links work correctly
- [ ] Test with Claude Code to ensure it can navigate
- [ ] Check that no information was lost
- [ ] Ensure search/grep still finds relevant content

## Benefits of Reorganization

1. **Improved Maintainability**
   - Smaller, focused files are easier to update
   - Related patterns grouped together
   - Clear separation of concerns

2. **Better Navigation**
   - CLAUDE.md becomes a concise entry point
   - Pattern files can be referenced directly
   - Documentation index provides overview

3. **Reduced Cognitive Load**
   - Core guidance separated from implementation details
   - Agent usage remains prominent in main file
   - Patterns can be learned incrementally

4. **Enhanced Discoverability**
   - Descriptive filenames make content obvious
   - Pattern index helps find relevant solutions
   - Cross-references connect related concepts

5. **Easier Updates**
   - New patterns added to appropriate file
   - Version-specific docs can be managed separately
   - Outdated patterns easier to identify and update

## Migration Strategy

### Step-by-step migration process:
1. Create new directory structure first
2. Copy (not move) content to new locations
3. Test navigation and references
4. Update CLAUDE.md with links
5. Remove duplicated content from CLAUDE.md
6. Add redirect notes for commonly accessed sections

### Maintaining Backward Compatibility:
- Keep section headers in CLAUDE.md with "See docs/..." references
- Maintain same heading structure in extracted files
- Preserve all code examples and explanations
- Add breadcrumb navigation in extracted docs

## Success Metrics

- CLAUDE.md reduced from 1307 to ~550 lines (58% reduction)
- All patterns preserved in logical groupings
- Zero information loss during migration
- Improved navigation with < 3 clicks to any pattern
- Agent documentation remains immediately visible

## Risk Mitigation

1. **Risk**: Claude Code might not find extracted patterns
   - **Mitigation**: Keep clear references in CLAUDE.md, use descriptive filenames

2. **Risk**: Developers might not find documentation
   - **Mitigation**: Create comprehensive index, maintain search keywords

3. **Risk**: Updates might fragment across files
   - **Mitigation**: Clear ownership of each doc file, regular reviews

4. **Risk**: Links might break during refactoring
   - **Mitigation**: Use relative paths, test all links post-migration

## Testing Scenarios

### Navigation Tests
1. Can Claude Code find agent usage instructions? ✅ (remains in main)
2. Can developers find API patterns? (via docs/architecture/patterns/)
3. Are development commands accessible? (via docs/development/)
4. Is setup documentation findable? (via docs/development/)

### Content Integrity Tests
1. All code examples preserved
2. All anti-patterns documented
3. Cross-references maintained
4. No broken links

### Usability Tests
1. Time to find common patterns reduced
2. New developer onboarding simplified
3. Pattern updates easier to track

## Notes

### Design Decisions
- **Keep agent docs in main**: This is the most critical section for Claude Code
- **Group patterns by domain**: API, Data, Mobile, Performance for logical organization
- **Preserve all content**: No information should be lost, only reorganized
- **Maintain examples**: All code examples and anti-patterns must be preserved

### Implementation Priority
1. **High Priority**: Extract architecture patterns (biggest win for size reduction)
2. **Medium Priority**: Extract development commands and quality guides
3. **Low Priority**: Create comprehensive indexes and navigation aids

### Future Considerations
- Consider auto-generating pattern index from markdown headers
- Add pattern versioning for breaking changes
- Create pattern templates for consistency
- Consider separate docs for each app (API, Mobile)

## Estimated Timeline

- **Planning**: ✅ Completed (this document)
- **Implementation**: 2-3 hours
  - Directory creation: 15 minutes
  - Content extraction: 1.5 hours
  - CLAUDE.md update: 30 minutes
  - Testing & validation: 30 minutes
- **Review & refinement**: 1 hour

Total estimated effort: 3-4 hours

## Next Steps

1. Get approval for reorganization plan
2. Create directory structure
3. Begin content extraction (patterns first)
4. Update CLAUDE.md with navigation
5. Test with Claude Code
6. Document any issues or improvements

---

*Created: 2025-10-28 21:00:00 UTC*
*Status: Plan complete, awaiting implementation approval*