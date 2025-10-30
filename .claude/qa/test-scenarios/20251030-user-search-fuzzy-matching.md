# Test Scenario: User Search with Fuzzy Matching (Fuse.js)

**Date**: 2025-10-30
**Feature**: Enhanced user search with Fuse.js for better fuzzy matching
**Priority**: High
**Type**: Enhancement + Bug Fix

## Overview

This test scenario covers the implementation of Fuse.js for fuzzy search across all user search locations in the mobile app, along with critical bug fixes for null phone numbers and email overflow.

## Changes Made

### 1. New Reusable Hook: `useUserSearch`

**File**: `/apps/mobile/hooks/use-user-search.ts`

**Purpose**: Provides fuzzy search functionality using Fuse.js with accent-insensitive Vietnamese matching

**Features**:
- Searches across: full name, username, phone number, email
- Accent-insensitive (e.g., "duong" finds "Dương Đỗ")
- Partial matching (e.g., "091" finds "0912345678")
- Configurable threshold (default: 0.3 for balanced fuzzy matching)
- Memoized for performance

### 2. Updated Components

#### Admin User List (`/apps/mobile/components/admin-user-list.tsx`)
- ✅ Replaced manual filter with `useUserSearch` hook
- ✅ Fixed email overflow in user detail bottom sheet
- ✅ Added `flex-1` to container for proper text wrapping
- ✅ Added `numberOfLines={1}` and `ellipsizeMode="middle"` for email display

#### User Select Bottom Sheet (`/apps/mobile/components/user-select-bottom-sheet-modal.tsx`)
- ✅ Replaced manual filter with `useUserSearch` hook
- ✅ Removed unused imports

#### Reports Screen (`/apps/mobile/app/admin/reports/index.tsx`)
- ✅ Implemented Fuse.js search (inline implementation)
- ✅ Extended search to include phone and username (previously only name and email)

### 3. Bug Fixes

#### Issue 1: Null Phone Number Crash
**Location**: All search components
**Error**: `[TypeError: Cannot read property 'toLowerCase' of null]`
**Fix**: The `useUserSearch` hook handles null phone numbers with `getUserPhoneNumber(user) || ''`
**Status**: ✅ Fixed

#### Issue 2: Email Overflow in User Detail Sheet
**Location**: `/apps/mobile/components/admin-user-list.tsx` (AdminUserUserActionSheet)
**Problem**: Long emails overflow the view
**Fix**:
- Added `flex-1 gap-1` to parent container
- Separated username and email into individual Text components
- Added `numberOfLines={1}` with `ellipsizeMode="middle"` for email
**Status**: ✅ Fixed

## Test Cases

### Test Case 1: Basic Accent-Insensitive Search

**Preconditions**: User list contains "Dương Đỗ" with username "duongdev"

**Steps**:
1. Navigate to Admin Users screen
2. Type "duong" in search box (lowercase, no accents)
3. Verify "Dương Đỗ" appears in results

**Expected Results**:
- ✅ "Dương Đỗ" is found despite accent differences
- ✅ Search is case-insensitive

**Test Locations**:
- `/admin/users` (Admin User List)
- User select bottom sheet (when creating/editing tasks)
- `/admin/reports` (Employee Reports)

### Test Case 2: Partial Phone Number Search

**Preconditions**: User with phone "0912345678"

**Steps**:
1. Navigate to any search location
2. Type "091" in search box
3. Verify user with phone starting with "091" appears

**Expected Results**:
- ✅ Users with matching phone prefixes are found
- ✅ Phone numbers are searchable without formatting

### Test Case 3: Username Search

**Preconditions**: User with username "duongdev"

**Steps**:
1. Navigate to any search location
2. Type "duong" in search box
3. Verify user with username "duongdev" appears

**Expected Results**:
- ✅ Username search works
- ✅ Partial username matching works

### Test Case 4: Email Search

**Preconditions**: User with email "duong@example.com"

**Steps**:
1. Navigate to any search location
2. Type "duong@" in search box
3. Verify user with matching email appears

**Expected Results**:
- ✅ Email search works
- ✅ Partial email matching works

### Test Case 5: Fuzzy Matching

**Preconditions**: User "Nguyễn Văn A"

**Steps**:
1. Type "nguyen van" (with space, no accents)
2. Type "nguyenvan" (without space)
3. Type "nguyen a" (skipping middle name)

**Expected Results**:
- ✅ All variations find the user
- ✅ Fuzzy matching handles small typos and variations

### Test Case 6: No Results

**Steps**:
1. Type "xyz123abc" (non-existent search)
2. Verify empty state is shown

**Expected Results**:
- ✅ Empty state displays appropriate message
- ✅ No crashes or errors

### Test Case 7: Null Phone Number Handling

**Preconditions**: User with no phone number set

**Steps**:
1. Navigate to user list
2. Search for user by name
3. View user in results
4. Long-press to open user detail sheet

**Expected Results**:
- ✅ No crash when searching
- ✅ User appears in results
- ✅ Phone display shows "Chưa có số điện thoại" (fallback)
- ✅ Call/Zalo buttons are disabled

### Test Case 8: Long Email Display

**Preconditions**: User with very long email (e.g., "very.long.email.address.for.testing@subdomain.example.com")

**Steps**:
1. Navigate to Admin Users screen
2. Long-press on user with long email
3. Observe user detail bottom sheet

**Expected Results**:
- ✅ Email is truncated with ellipsis in the middle
- ✅ Email doesn't overflow the container
- ✅ Layout remains clean and readable
- ✅ Avatar and user info are properly aligned

### Test Case 9: Search Performance

**Preconditions**: User list with 50+ users

**Steps**:
1. Type characters in search box one by one
2. Observe search responsiveness

**Expected Results**:
- ✅ Search results update smoothly
- ✅ No lag or jank
- ✅ Debouncing works properly (uses SearchBox's built-in debounce)

### Test Case 10: Clear Search

**Steps**:
1. Type search query
2. Clear search box
3. Verify all users reappear

**Expected Results**:
- ✅ Full user list is restored
- ✅ No errors in console

## Implementation Details

### Fuse.js Configuration

```typescript
{
  keys: ['searchName', 'searchUsername', 'searchPhone', 'searchEmail'],
  threshold: 0.3,        // Balance between strict and fuzzy
  includeScore: true,    // Include relevance scores
  shouldSort: true,      // Sort by relevance
  ignoreLocation: true,  // Search anywhere in string
}
```

### Threshold Explanation

- `0.0` = Exact match only
- `0.3` = Balanced (current setting) - allows typos and variations
- `1.0` = Match anything

### Vietnamese Accent Normalization

The `removeVietnameseAccents` utility normalizes Vietnamese text:
- Converts "Dương" → "Duong"
- Converts "Nguyễn" → "Nguyen"
- Uses NFD normalization + regex to remove diacritics

## Edge Cases to Test

1. **Empty search query**: Should return all users
2. **Special characters**: "@", ".", "-" in emails/usernames
3. **Very short queries**: 1-2 characters
4. **Vietnamese mixed with English**: "nguyen john"
5. **Numbers in names**: "Nguyễn Văn A1"
6. **Multiple spaces**: "nguyen   van   a"
7. **Leading/trailing spaces**: " duong "

## Performance Considerations

1. **Memoization**: All search logic is memoized with `useMemo`
2. **Debouncing**: SearchBox component handles debouncing (default: 300ms)
3. **Normalization**: Search fields are pre-normalized, not computed on every search
4. **FlatList**: Uses optimized rendering for large lists

## Known Limitations

1. **No typo tolerance**: "duogn" won't find "duong" (threshold 0.3 is not high enough)
   - Can be adjusted by increasing threshold
2. **Phone formatting**: Search works with raw numbers, not formatted strings
3. **Email case**: Emails are normalized to lowercase for searching

## Rollback Plan

If issues are found:
1. Revert to manual filtering (previous implementation)
2. Files to revert:
   - `apps/mobile/hooks/use-user-search.ts` (delete)
   - `apps/mobile/components/admin-user-list.tsx`
   - `apps/mobile/components/user-select-bottom-sheet-modal.tsx`
   - `apps/mobile/app/admin/reports/index.tsx`

## Related Documentation

- **Fuse.js Docs**: https://fusejs.io/
- **Vietnamese Search Pattern**: `/apps/mobile/lib/utils.ts` (`removeVietnameseAccents`)
- **User Helper Functions**: `/apps/mobile/utils/user-helper.ts`

## Success Criteria

- ✅ All search locations use Fuse.js
- ✅ No crashes with null phone numbers
- ✅ Long emails display properly
- ✅ Search is accent-insensitive
- ✅ Partial matching works
- ✅ Performance is smooth (no lag)
- ✅ TypeScript compilation succeeds
- ✅ Biome linting passes
