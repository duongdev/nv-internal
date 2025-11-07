# Architecture Patterns Changelog

This document tracks recently established patterns and significant updates to existing patterns. Patterns are organized by date (most recent first) with references to their detailed documentation and implementation tasks.

---

## 2025-11-07

### Feature Flags Pattern

**Pattern**: Feature Flags with PostHog
**Documentation**: [Feature Flags Guide](../../../.claude/docs/feature-flags-guide.md)
**Problem**: No mechanism for gradual feature rollouts, A/B testing, or instant kill switches
**Solution**: PostHog feature flags with custom hooks, type-safe constants, and graceful degradation

**Key Details**:
- Naming Convention: `task-list-[feature]-enabled-[role]` format for consistency
- Production Flags Implemented:
  - `task-list-filter-enabled-admin` - Admin task list filtering UI
  - `task-list-search-enabled-admin` - Admin task list search functionality
  - `task-list-filter-enabled-worker` - Worker task list filtering UI
  - `task-list-search-enabled-worker` - Worker task list search functionality
- Key Pattern: No loading states for instant graceful degradation (features absent if disabled)
- Flag Independence: All 16 combinations tested - filter and search work independently

**Impact**: Instant feature control without app deployments, role-based rollouts, A/B testing ready

**Implementation Tasks**:
- Initial: `.claude/tasks/20251107-043354-first-feature-flag-task-list-filter-admin.md`
- Additional: `.claude/tasks/20251107-050000-implement-additional-task-list-feature-flags.md`

**Commits**: `b0d2576` (first flag), `9323b53` (three additional flags)

---

### PostHog Provider Initialization Pattern

**Pattern**: [OTA Updates](ota-updates.md) (PostHog section)
**Problem**: App crashed immediately after splash screen in TestFlight builds
**Root Cause**: Incorrect PostHogProvider prop pattern incompatible with posthog-react-native v4.x

**Wrong Pattern**:
```typescript
// ❌ Don't do this - causes production crash
<PostHogProvider apiKey={key} options={options}>
```

**Correct Pattern**:
```typescript
// ✅ Do this - create client with useMemo
const client = React.useMemo(() => new PostHog(apiKey, options), [])
<PostHogProvider client={client} autocapture={{ ... }}>
```

**Key Learning**: Always use Pattern 3 (client prop with useMemo) for complex configurations

**Impact**: Fixed CRITICAL production crash affecting all TestFlight users

**Implementation Task**: `.claude/tasks/20251107-095033-fix-posthog-provider-crash.md`

**Reference**: Official PostHog React Native Expo example

---

## 2025-11-06

### Mobile Accessibility Pattern

**Pattern**: [Mobile Accessibility](mobile-accessibility.md)
**Problem**: 50% MobileMCP test failure rate, no screen reader support
**Solution**: Required 4 properties for all interactive elements

**Required Properties**:
1. `accessibilityLabel` - Vietnamese, descriptive
2. `accessibilityHint` - Vietnamese, action description
3. `accessibilityRole` - button, link, text, etc.
4. `testID` - Format: `{screen}-{action}-{type}`

**Key Details**:
- testID Convention: `{screen}-{action}-{type}` format for reliable testing
- Vietnamese Labels: All accessibility labels in Vietnamese with proper grammar
- Dynamic Labels: Update based on state (loading, count, context)

**Impact**: 95%+ click success rate, 100% screen reader compliance

**Files Modified**: 10 files, 97+ properties added, 32+ elements improved

**Implementation Task**: `.claude/tasks/20251106-190000-app-store-screenshot-capture-mobilemcp.md`

**Related Documentation**: `.claude/qa/screenshot-capture-playbook.md`

---

### OTA Updates Pattern

**Pattern**: [OTA Updates](ota-updates.md)
**Problem**: No version visibility or update mechanism for users
**Solution**: Hook-Only pattern without provider for single-component state

**Key Features**:
- Expo Go detection using `executionEnvironment` (not deprecated `appOwnership`)
- Automatic background checks for updates
- User-controlled reload for updates
- AsyncStorage for update state persistence

**Implementation Details**:
- Vietnamese UI: All update strings in Vietnamese for consistency
- Graceful degradation: Works in Expo Go (shows version, skips update checks)
- No global provider needed: Self-contained hook pattern

**Impact**: Users can see app version and install updates without app store

**Implementation Task**: `.claude/tasks/20251106-085928-app-version-tracking-ota-updates.md`

**Fixed Deprecation**: Changed `appOwnership` to `executionEnvironment` for Expo Go detection

---

## 2025-10-31

### Task Comments Implementation Patterns

**Pattern**: Activity-Based Features
**Problem**: Need to add comments to tasks without creating new tables
**Solution**: Use existing Activity model with TASK_COMMENTED action

**Key Patterns Established**:

1. **Activity-Based Features**: Use Activity model for any feature that logs events
   - Zero new tables needed - reuse existing Activity model
   - Automatic integration with activity feed
   - Built-in pagination and filtering support
   - Example: Task comments implemented with TASK_COMMENTED action

2. **FormData Handling in Hono**: Proper multipart/form-data parsing
   - Always use `formData()` method, not `parseBody()` for multipart endpoints
   - Example: `const { comment, files } = c.req.valid('form')`
   - Support both JSON and FormData in same endpoint by checking content type

3. **Dual-Mode API Calls**: Optimize for different data types
   - Use JSON for simple data (text-only comments)
   - Use FormData with native fetch for file uploads
   - Pattern: Check for files and switch modes dynamically

4. **Photo Picker UI Pattern**: Consistent mobile photo selection
   - Permission handling with settings redirect on denial
   - Camera single selection + Gallery multi-selection
   - Preview thumbnails with individual remove buttons
   - Horizontal ScrollView for photo list
   - Badge component for count indicator (e.g., "3/5")
   - Max limit enforcement with user-friendly warnings

5. **Static vs Dynamic Imports**: Keep it simple
   - Prefer static imports for service dependencies
   - Only use dynamic imports when truly needed (conditional loading)
   - Static imports are more reliable and better for TypeScript

**Implementation Task**: `.claude/tasks/20251030-130330-implement-task-comments.md`

---

## 2025-10-30

### Stable Tabs Migration

**Pattern**: [Tabs Navigation](tabs-navigation.md)
**Problem**: NativeTabs (unstable-native-tabs) caused unresponsive UI on initial module load
**Root Cause**: Component marked as unstable with race conditions in navigation state
**Solution**: Migrated to stable Tabs from expo-router with haptic feedback

**Critical Fixes**:
- Replaced `unstable-native-tabs` with stable `Tabs` component
- Avoided `screenOptions` at Stack level (causes invisible overlays that block touch)
- Added haptic feedback to tab presses for better UX

**Key Learning**: The "unstable" prefix means it - always prefer stable, battle-tested components for production

**Migration Task**: `.claude/tasks/20251030-041902-migrate-nativetabs-to-stable-tabs.md`

**Original Issue**: `.claude/tasks/20251030-025700-fix-worker-unresponsive-ui.md`

---

### SearchableText Pattern

**Pattern**: [SearchableText](searchable-text.md)
**Problem**: Complex 7-field OR queries with post-processing (140 lines of code), poor performance
**Solution**: Pre-computed searchable text fields for performance and simplicity

**Architecture**:
```typescript
// Build searchable text at write time
function buildSearchableText(record: SomeModel): string {
  const parts = [field1, field2, field3].filter(Boolean)
  return parts
    .map(part => normalizeForSearch(part.trim().replace(/\s+/g, ' ')))
    .join(' ')
}

// Simple query at read time
const results = await prisma.task.findMany({
  where: { searchableText: { contains: normalizedQuery, mode: 'insensitive' } }
})
```

**Benefits**:
- **70% code reduction**: 140 lines → 50 lines
- **2-3x faster queries**: Single indexed field vs multiple JOINs
- **Perfect pagination**: No post-processing needed
- **Type safety**: Full Prisma support maintained
- Vietnamese accent-insensitive search built-in

**Implementation Task**: `.claude/tasks/20251030-094500-implement-searchable-text-field.md`

---

### Admin/Worker Search & Filter Implementation

**Pattern**: Native Header Search + Comprehensive Filtering
**Problem**: No search or filter functionality in admin/worker task lists
**Solution**: Native platform search bars with comprehensive filter UI

**Key Patterns**:

1. **Native Header Search**: iOS/Android native search bars
   - Uses `headerSearchBarOptions` for platform-specific UI
   - Real-time search with debouncing
   - Seamless integration with infinite scroll

2. **Comprehensive Filtering**: Status, date, assignee, and sort
   - Color-coded status chips matching existing badges
   - Quick date presets with custom calendar picker
   - Vietnamese search for assignee selection
   - Active filter display with dismissible chips

3. **Bottom Sheet Patterns**: Fixed layout with sticky footer
   - Separate modals to avoid VirtualizedList nesting
   - Safe area padding with pb-safe utility
   - Proper gesture handling with specialized components

**Implementation Task**: `.claude/tasks/20251030-110000-complete-phase3-phase4-search-filter-ui.md`

---

### User Search & Bottom Sheet Patterns

**Established**: 2025-10-30
**Problem**: Vietnamese users couldn't search without diacritics, bottom sheet had gesture conflicts

**Patterns Established**:

1. **Vietnamese Accent-Insensitive Search**
   - Use `removeVietnameseAccents()` utility for search normalization
   - Apply to both search query and target text for matching
   - Critical for Vietnamese users who omit accents for typing speed
   - Implemented with Fuse.js for fuzzy matching and typo tolerance

2. **Bottom Sheet List Integration**
   - Always use `BottomSheetFlatList` from `@gorhom/bottom-sheet` (never standard `FlatList`)
   - Set appropriate `index` prop for initial height (e.g., `index={1}` for 90% screen)
   - Place action buttons in `ListFooterComponent` to scroll with content
   - Prevents gesture conflicts between sheet drag and list scroll

3. **Null-Safe String Operations**
   - Always use `(value || '').toLowerCase()` for potentially null strings
   - Prevents runtime crashes with missing data (e.g., phone numbers)
   - Apply consistently across all string transformations

4. **Email Display Pattern**
   - Use `numberOfLines={1}` with `ellipsizeMode="middle"` for emails
   - Shows beginning and end of address for better recognition
   - Prevents UI overflow in constrained spaces

**Pattern**: [Vietnamese Search](vietnamese-search.md)
**Implementation Task**: `.claude/tasks/20251030-045028-fix-user-search-and-bottom-sheet.md`

---

### Employee Summary Implementation

**Established**: 2025-10-30
**Problem**: Poor performance with N+1 queries, inefficient data fetching for reports

**Patterns Established**:

1. **Batch Query Pattern**: Replace N+1 queries with batch queries for aggregate reports
   - Query all data once, process in-memory for multiple users
   - Use PostgreSQL array operators (`hasSome`) for efficient filtering
   - Example: Employee summary reduced 100+ queries to 2-3

2. **FlatList Optimization**: High-performance mobile lists
   - Always use `FlatList` over `ScrollView` for large datasets
   - Implement `getItemLayout` for known item heights
   - Use virtualization props: `removeClippedSubviews`, `windowSize`, etc.
   - Target 60fps scrolling performance

3. **Defensive API Responses**: Always provide fallbacks
   - Never assume data exists - use optional chaining and nullish coalescing
   - Provide default values for missing user data (names, emails, etc.)
   - Example: `user.firstName || ""` instead of assuming firstName exists

4. **Tied Ranking Algorithm**: Equal values get equal ranks
   - When ranking by metrics (revenue, tasks), equal values should have the same rank
   - Sequence: 1, 1, 3 (not 1, 2, 3) for tied first place
   - Important for fair employee performance comparisons

5. **Client-Side Search**: Instant filtering without API calls
   - Filter results in-memory for immediate response
   - Use `useMemo` to optimize filtering performance
   - Provide search highlighting for better UX

**Implementation Task**: `.claude/tasks/20251029-145000-employee-report-monthly-summary-enhancement.md`

---

## Navigation Stability Patterns (2025-10-30)

Key learnings from navigation system debugging and migration:

### Avoid Unstable APIs in Production
- The "unstable" prefix means it - NativeTabs had race conditions and initialization issues
- Always prefer stable, battle-tested components for production apps
- Migration path: `unstable-native-tabs` → stable `Tabs` from expo-router

### Stack Navigator screenOptions Pitfall
- Using `screenOptions` on Stack creates invisible header overlays even with `headerShown: false`
- These overlays block touch events on child components (tabs, buttons, etc.)
- **Solution**: Always use individual `options` on each Stack.Screen

### Navigation State Timing
- Immediate redirects (`<Redirect />`) can cause navigation state race conditions
- Use delayed navigation with `setTimeout` and `router.replace()` for module transitions
- Small delays (100ms) allow navigation state to stabilize

### Haptic Feedback Enhancement
- Adding haptic feedback to tab presses significantly improves perceived responsiveness
- Implementation is simple with `expo-haptics` but has high UX impact
- Use `ImpactFeedbackStyle.Light` for subtle, pleasant feedback

### Debugging Navigation Issues
- Systematic elimination approach: Try one fix at a time and document results
- Check for invisible overlays first (most common cause of unresponsive UI)
- Test both iOS and Android - navigation behavior can differ
- Clean builds don't always help - often it's a code issue, not cache

---

## How to Use This Changelog

### For Finding Recent Patterns
1. Browse by date (most recent first)
2. Look for patterns relevant to your current work
3. Follow links to detailed pattern documentation
4. Review implementation tasks for examples

### When Adding New Patterns
1. Add to top of file (most recent date)
2. Include all required sections:
   - Pattern name and link to detailed docs
   - Problem solved
   - Solution approach
   - Key details
   - Impact
   - Implementation task references
   - Commits (if applicable)

### Template for New Entries

```markdown
### Pattern Name

**Pattern**: [Pattern Name](pattern-file.md)
**Problem**: Brief description of the problem
**Solution**: Brief description of the solution

**Key Details**:
- Important detail 1
- Important detail 2
- Important detail 3

**Impact**: What changed or improved

**Implementation Task**: `.claude/tasks/YYYYMMDD-HHMMSS-task-name.md`

**Commits**: `hash1` (description), `hash2` (description)
```

---

## Related Documentation

- **Pattern Files**: All patterns have detailed documentation in this directory
- **Implementation Tasks**: `.claude/tasks/` contains implementation details
- **Architecture Overview**: [patterns/README.md](README.md)
- **Recent Updates**: This file (CHANGELOG.md)
