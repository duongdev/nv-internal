# Vietnamese Search and Scroll Fixes

**Date**: 2025-10-30
**Time**: 04:36:44 UTC
**Status**: ✅ Completed

## Problem Statement

The mobile app had two critical UI issues affecting user search functionality:

### Issue 1: Task Employee Selector - Scroll Issue
The employee selector bottom sheet in task forms couldn't scroll through the user list properly. Users were unable to view all available employees when the list exceeded the viewport height.

**Root Cause**: The `FlatList` component had `contentContainerClassName="flex-1"` which prevented proper scrolling behavior in the bottom sheet context.

### Issue 2: Vietnamese Search - Non-Accent Support Missing
User/employee search functionality didn't support accent-insensitive Vietnamese search across multiple locations:
- User list screen (`AdminUserList`)
- Task assignee selector (`UserSelectBottomSheetModal`)
- Employee reports screen

**Example**: Searching for "Duong" would not find "Dương Đỗ" because the search was accent-sensitive.

**Impact**: Vietnamese users had to type exact accents to find people, significantly degrading UX for Vietnamese language users.

## Solution Overview

### 1. Created Vietnamese Accent Removal Utilities

Added two utility functions to `/apps/mobile/lib/utils.ts`:

```typescript
/**
 * Remove Vietnamese accents and diacritics from a string
 * Used for accent-insensitive search functionality
 */
export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .replace(/đ/g, 'd') // Replace lowercase đ
    .replace(/Đ/g, 'D') // Replace uppercase Đ
}

/**
 * Perform accent-insensitive search on a Vietnamese string
 * Normalizes both the search query and target string before comparison
 */
export function vietnameseSearch(text: string, query: string): boolean {
  const normalizedText = removeVietnameseAccents(text.toLowerCase())
  const normalizedQuery = removeVietnameseAccents(query.toLowerCase())
  return normalizedText.includes(normalizedQuery)
}
```

### 2. Fixed Scrolling in UserSelectBottomSheetModal

**File**: `/apps/mobile/components/user-select-bottom-sheet-modal.tsx`

**Changes**:
- Removed `contentContainerClassName="flex-1"` from FlatList (line 74)
- This allows the FlatList to properly scroll within the BottomSheetView container

### 3. Replaced Fuse.js with Accent-Insensitive Search

All three search implementations were updated to use the new accent-insensitive approach:

#### UserSelectBottomSheetModal
**File**: `/apps/mobile/components/user-select-bottom-sheet-modal.tsx`

**Before** (using Fuse.js):
```typescript
const fuse = new Fuse(
  data.map((user) => ({
    ...user,
    phoneNumber: getUserPhoneNumber(user),
  })),
  {
    keys: ['firstName', 'lastName', 'phoneNumber', 'username'],
    threshold: 0.3,
  },
)
return fuse.search(searchText).map((result) => result.item)
```

**After** (accent-insensitive):
```typescript
const normalizedQuery = removeVietnameseAccents(searchText.toLowerCase())

return data.filter((user) => {
  const fullName = removeVietnameseAccents(getUserFullName(user).toLowerCase())
  const phoneNumber = removeVietnameseAccents(getUserPhoneNumber(user).toLowerCase())
  const username = removeVietnameseAccents((user.username || '').toLowerCase())

  return (
    fullName.includes(normalizedQuery) ||
    phoneNumber.includes(normalizedQuery) ||
    username.includes(normalizedQuery)
  )
})
```

#### AdminUserList
**File**: `/apps/mobile/components/admin-user-list.tsx`

Same transformation as UserSelectBottomSheetModal - replaced Fuse.js with accent-insensitive filtering.

#### Employee Reports
**File**: `/apps/mobile/app/admin/reports/index.tsx`

**Before** (case-sensitive):
```typescript
const query = searchQuery.toLowerCase().trim()
return employeesWithRanks.filter((emp) => {
  const fullName = getUserFullName(emp).toLowerCase()
  const email = emp.email?.toLowerCase() || ''
  return fullName.includes(query) || email.includes(query)
})
```

**After** (accent-insensitive):
```typescript
const normalizedQuery = removeVietnameseAccents(searchQuery.toLowerCase().trim())
return employeesWithRanks.filter((emp) => {
  const fullName = removeVietnameseAccents(getUserFullName(emp).toLowerCase())
  const email = removeVietnameseAccents((emp.email || '').toLowerCase())
  return fullName.includes(normalizedQuery) || email.includes(normalizedQuery)
})
```

## Technical Implementation Details

### Accent Normalization Approach

The `removeVietnameseAccents` function uses Unicode normalization:

1. **NFD Normalization**: Converts characters to decomposed form (e.g., "é" → "e" + combining accent)
2. **Remove Diacritics**: Strips combining diacritical marks (U+0300 to U+036F range)
3. **Handle Vietnamese đ/Đ**: Special case for Vietnamese-specific letters not covered by NFD

### Why Not Fuse.js?

**Removed Dependency**: Fuse.js was being used for fuzzy search, but:
- Doesn't support Vietnamese accent normalization out of the box
- Adds unnecessary bundle size for simple substring search
- The threshold setting (0.3) was actually making search less predictable

**New Approach Benefits**:
- Lighter weight (no external dependency for search)
- More predictable (exact substring matching)
- Better Vietnamese support
- Faster performance (no fuzzy matching overhead)

## Files Modified

1. **`/apps/mobile/lib/utils.ts`**
   - Added `removeVietnameseAccents()` utility function
   - Added `vietnameseSearch()` helper function

2. **`/apps/mobile/components/user-select-bottom-sheet-modal.tsx`**
   - Removed Fuse.js import
   - Fixed scrolling by removing `contentContainerClassName="flex-1"`
   - Implemented accent-insensitive search
   - Added `getUserFullName` import

3. **`/apps/mobile/components/admin-user-list.tsx`**
   - Removed Fuse.js import
   - Implemented accent-insensitive search
   - Added `removeVietnameseAccents` import

4. **`/apps/mobile/app/admin/reports/index.tsx`**
   - Implemented accent-insensitive search
   - Added `removeVietnameseAccents` import

## Testing Checklist

### Manual Testing Required

- [ ] **User Selection Bottom Sheet**:
  - Open task details as admin
  - Click "Assign" button to open user selector
  - Verify scrolling works smoothly with long user lists
  - Search for "duong" and verify it finds "Dương Đỗ"
  - Search for "nguyen" and verify it finds all "Nguyễn" users
  - Search by phone number (with/without diacritics)

- [ ] **Admin User List**:
  - Navigate to Users tab in admin module
  - Search for Vietnamese names without accents
  - Verify all matching users appear
  - Test search by username and phone number

- [ ] **Employee Reports**:
  - Navigate to Reports in admin module
  - Use the search box to find employees
  - Test accent-insensitive search (e.g., "Duong" finds "Dương")
  - Verify search by email also works

### Edge Cases to Test

- [ ] Empty search query (should show all users)
- [ ] Search with special characters
- [ ] Search with numbers (phone numbers)
- [ ] Very long user lists (100+ users) - verify performance
- [ ] Search with mixed accent/non-accent input

## Code Quality

All changes have been:
- ✅ Type-checked with TypeScript (`npx tsc --noEmit`)
- ✅ Formatted and linted with Biome (`pnpm exec biome check --write`)
- ✅ Follow existing codebase patterns
- ✅ Include proper JSDoc comments

## Performance Impact

**Positive**:
- Removed Fuse.js dependency (reduced bundle size)
- Simple string operations are faster than fuzzy matching
- Client-side filtering with `useMemo` ensures optimal performance

**Neutral**:
- Accent normalization adds minimal overhead (Unicode operations are fast)
- All filtering happens in useMemo, so no performance regression

## UX Improvements

1. **Better Vietnamese Support**: Users can now search without worrying about accent marks
2. **Smoother Scrolling**: Fixed scroll issue in bottom sheet user selector
3. **More Predictable Search**: Substring matching is more intuitive than fuzzy matching
4. **Consistent Behavior**: All three search locations now behave identically

## Future Enhancements

Potential improvements for later (not in scope):

1. **Highlight Search Matches**: Visually highlight the matching text in results
2. **Search History**: Remember recent searches
3. **Advanced Filters**: Filter by role, active/banned status, etc.
4. **Keyboard Shortcuts**: Add keyboard navigation for search results

## Related Documentation

- **Project Guideline**: Vietnamese language support is important per CLAUDE.md
- **Component Pattern**: Bottom sheet usage follows existing patterns
- **Search Pattern**: Established new pattern for Vietnamese accent-insensitive search

## Learnings

### Pattern Established: Vietnamese Accent-Insensitive Search

**When to use**: Any search/filter functionality for Vietnamese names, addresses, or text content.

**Implementation**:
```typescript
import { removeVietnameseAccents } from '@/lib/utils'

const filteredResults = useMemo(() => {
  if (!searchQuery.trim()) return allData

  const normalizedQuery = removeVietnameseAccents(searchQuery.toLowerCase())
  return allData.filter((item) => {
    const searchableText = removeVietnameseAccents(
      item.searchableField.toLowerCase()
    )
    return searchableText.includes(normalizedQuery)
  })
}, [allData, searchQuery])
```

### FlatList in Bottom Sheets

**Avoid**: Using `contentContainerClassName="flex-1"` on FlatList inside BottomSheetView
**Reason**: Prevents proper scrolling behavior
**Correct**: Let FlatList manage its own height with `className="flex-1"`

## Conclusion

This implementation successfully addresses both critical UI issues:
1. ✅ Fixed scrolling in user selector bottom sheet
2. ✅ Implemented Vietnamese accent-insensitive search across all user search locations

The solution is lightweight, performant, and establishes a reusable pattern for Vietnamese text search throughout the application.
