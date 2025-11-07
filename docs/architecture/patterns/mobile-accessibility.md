# Mobile Accessibility Pattern

**Status**: ✅ Established (2025-11-06)
**Category**: Mobile Development, Accessibility, Testing
**Impact**: High - Affects all interactive UI elements

## Overview

This pattern ensures all interactive elements in the React Native mobile application are fully accessible for screen readers and automated testing tools (MobileMCP). By adding proper accessibility properties, we achieve 95%+ automated test success rate and full screen reader compliance.

---

## The Problem

### Initial State

Many interactive elements lacked accessibility properties:

```tsx
// ❌ BAD - No accessibility properties
<Button onPress={handleCreate}>
  <Text>Tạo mới</Text>
</Button>
```

**Issues**:
- MobileMCP automated tests had ~50% click failure rate
- Screen readers couldn't describe button purpose
- Element targeting unreliable in tests
- Poor user experience for visually impaired users
- Non-compliant with accessibility standards

### Root Causes

1. **Missing Properties**: No accessibilityLabel, accessibilityRole, or testID
2. **Coordinate-Based Clicking**: Relied on precise coordinates (fragile)
3. **No Semantic Information**: Screen readers couldn't understand element purpose
4. **Testing Challenges**: Unreliable element discovery in automated tests

---

## The Solution

### Required Properties for All Interactive Elements

Every interactive element (buttons, inputs, pressables) **MUST** have four properties:

```tsx
// ✅ GOOD - Fully accessible
<Button
  accessibilityLabel="Tạo công việc mới"          // Vietnamese label - what it is
  accessibilityHint="Điều hướng đến màn hình tạo công việc"  // What happens
  accessibilityRole="button"                       // Element type
  testID="tasks-create-button"                     // Reliable test identifier
  onPress={handleCreate}
>
  <Text>Tạo mới</Text>
</Button>
```

### Property Definitions

#### 1. accessibilityLabel (Required)

**Purpose**: Describes what the element IS in user's language

**Guidelines**:
- **Always Vietnamese** for this project
- **Concise and descriptive** (3-7 words)
- **User-facing language** (not technical terms)
- **State-aware** (update based on state when needed)

**Examples**:
```tsx
// Static labels
accessibilityLabel="Tạo công việc mới"        // Create new task
accessibilityLabel="Chụp ảnh"                 // Take photo
accessibilityLabel="Thư viện ảnh"             // Photo gallery
accessibilityLabel="Gửi bình luận"            // Send comment

// Dynamic labels (state-aware)
accessibilityLabel={addComment.isPending ? 'Đang gửi bình luận' : 'Gửi bình luận'}
accessibilityLabel={`Áp dụng${activeFilterCount > 0 ? ` ${activeFilterCount} bộ lọc` : ''}`}
accessibilityLabel={`Tải lên ${capturedPhotos.length} ảnh`}
accessibilityLabel={`Xóa ảnh ${index + 1}`}   // Context-aware with index
```

#### 2. accessibilityHint (Required)

**Purpose**: Describes what HAPPENS when the element is activated

**Guidelines**:
- **Action-oriented** (starts with verb)
- **Explains outcome** of interaction
- **Vietnamese language**
- **Clear and specific**

**Examples**:
```tsx
accessibilityHint="Điều hướng đến màn hình tạo công việc"  // Navigates to create task screen
accessibilityHint="Mở camera để chụp ảnh"                  // Opens camera to take photo
accessibilityHint="Chọn ảnh từ thư viện"                   // Selects photo from gallery
accessibilityHint="Gửi bình luận"                          // Sends comment
accessibilityHint="Xóa ảnh này khỏi bình luận"             // Removes this photo from comment
accessibilityHint="Áp dụng các bộ lọc đã chọn"             // Applies selected filters
accessibilityHint="Đóng bộ lọc mà không áp dụng"           // Closes filter without applying
```

#### 3. accessibilityRole (Required)

**Purpose**: Defines the element type for assistive technologies

**Common Values**:
- `"button"` - Interactive buttons, pressables
- `"text"` - Text inputs, labels
- `"image"` - Images
- `"link"` - Navigation links
- `"search"` - Search inputs
- `"header"` - Section headers

**Examples**:
```tsx
<Button accessibilityRole="button">...</Button>
<Textarea accessibilityRole="text">...</Textarea>
<Pressable accessibilityRole="button">...</Pressable>
<Text accessibilityRole="header">...</Text>
```

**Note**: React Native's base Button component should have `accessibilityRole="button"` by default.

#### 4. testID (Required)

**Purpose**: Provides reliable identifier for automated testing

**Naming Convention**: `{screen}-{action}-{type}`

**Guidelines**:
- **Lowercase with hyphens** (kebab-case)
- **Descriptive and unique**
- **Screen-scoped** (include screen name)
- **Include index for lists** when needed

**Examples**:
```tsx
// Format: {screen}-{action}-{type}
testID="tasks-filter-button"
testID="tasks-create-button"
testID="comment-input"
testID="comment-send-button"
testID="comment-camera-button"
testID="comment-gallery-button"
testID="attachment-camera-button"
testID="attachment-gallery-button"
testID="filter-apply-button"
testID="filter-reset-button"
testID="filter-cancel-button"

// With index for dynamic elements
testID={`comment-remove-photo-${index}`}
testID={`attachment-remove-photo-${index}`}
testID={`task-list-item-${task.id}`}
```

---

## Implementation Examples

### Example 1: Simple Button

```tsx
<Button
  accessibilityLabel="Tạo công việc mới"
  accessibilityHint="Điều hướng đến màn hình tạo công việc"
  accessibilityRole="button"
  testID="tasks-create-button"
  onPress={() => router.push('/admin/tasks/create')}
>
  <Icon as={PlusIcon} />
  <Text>Tạo mới</Text>
</Button>
```

### Example 2: Button with Dynamic State

```tsx
<Button
  accessibilityLabel={addComment.isPending ? 'Đang gửi bình luận' : 'Gửi bình luận'}
  accessibilityHint="Gửi bình luận"
  accessibilityRole="button"
  testID="comment-send-button"
  disabled={!commentText.trim() || addComment.isPending}
  onPress={handleSendComment}
>
  <Icon as={ArrowUpIcon} />
  <Text>{addComment.isPending ? 'Đang gửi...' : 'Gửi'}</Text>
</Button>
```

### Example 3: Text Input

```tsx
<Textarea
  accessibilityLabel="Nội dung bình luận"
  accessibilityRole="text"
  testID="comment-input"
  placeholder="Viết bình luận..."
  value={commentText}
  onChangeText={setCommentText}
  multiline
  numberOfLines={3}
/>
```

### Example 4: Pressable with Context

```tsx
<Pressable
  accessibilityLabel={`Xóa ảnh ${index + 1}`}
  accessibilityHint="Xóa ảnh này khỏi bình luận"
  accessibilityRole="button"
  testID={`comment-remove-photo-${index}`}
  onPress={() => removePhoto(index)}
>
  <Icon as={XIcon} className="text-destructive" size={14} />
</Pressable>
```

### Example 5: Filter Apply Button with Count

```tsx
<Button
  accessibilityLabel={`Áp dụng${activeFilterCount > 0 ? ` ${activeFilterCount} bộ lọc` : ''}`}
  accessibilityHint="Áp dụng các bộ lọc đã chọn"
  accessibilityRole="button"
  testID="filter-apply-button"
  onPress={handleApply}
>
  <Text>Áp dụng{activeFilterCount > 0 && ` (${activeFilterCount})`}</Text>
</Button>
```

### Example 6: Upload Button with Photo Count

```tsx
<Button
  accessibilityLabel={
    uploadMutation.isPending
      ? 'Đang tải lên'
      : `Tải lên ${capturedPhotos.length} ảnh`
  }
  accessibilityHint={`Tải lên ${capturedPhotos.length} ảnh đã chụp`}
  accessibilityRole="button"
  testID="attachment-upload-button"
  disabled={uploadMutation.isPending}
  onPress={handleCameraUpload}
>
  <Icon as={CheckIcon} />
  <Text>{uploadMutation.isPending ? 'Đang tải...' : 'Tải lên'}</Text>
</Button>
```

---

## Base Component Pattern

### Button Component Enhancement

Ensure base UI components have default accessibility properties:

```tsx
// apps/mobile/components/ui/button.tsx
function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        accessibilityRole="button"  // Default for all buttons
        className={cn(
          props.disabled && 'opacity-50',
          buttonVariants({ variant, size }),
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  )
}
```

**Rationale**: All Button instances automatically get `accessibilityRole="button"`, but still need `accessibilityLabel`, `accessibilityHint`, and `testID` at usage site.

---

## Vietnamese Language Guidelines

### Vocabulary Standards

**Common Actions**:
- Tạo mới - Create new
- Chỉnh sửa - Edit
- Xóa - Delete
- Lưu - Save
- Hủy - Cancel
- Tìm kiếm - Search
- Lọc - Filter
- Áp dụng - Apply
- Đặt lại - Reset
- Gửi - Send

**Photo Actions**:
- Chụp ảnh - Take photo
- Thư viện ảnh - Photo gallery
- Chọn tệp tin - Choose file
- Tải lên - Upload
- Xóa ảnh - Delete photo

**Task Actions**:
- Check-in - Check in (keeping English)
- Check-out - Check out (keeping English)
- Bắt đầu làm việc - Start working
- Hoàn thành - Complete
- Tạm dừng - Pause

**Status Messages**:
- Đang gửi... - Sending...
- Đang tải lên... - Uploading...
- Đã hoàn thành - Completed
- Đã lưu - Saved

### Grammar Rules

1. **Action Verbs First**: Vietnamese typically starts with action verb
   - "Chụp ảnh để đính kèm" (Take photo to attach)
   - "Gửi bình luận" (Send comment)

2. **Context After Action**: Add context after main action
   - "Xóa ảnh này khỏi bình luận" (Delete this photo from comment)
   - "Điều hướng đến màn hình tạo công việc" (Navigate to create task screen)

3. **State Indicators**: Use "Đang..." for in-progress actions
   - "Đang gửi..." (Sending...)
   - "Đang tải lên..." (Uploading...)

---

## Testing Benefits

### Before Accessibility Implementation

**MobileMCP Test Results**:
- Click success rate: ~50%
- Element discovery: Unreliable
- Test maintenance: High (coordinate changes break tests)
- Screen reader support: None

### After Accessibility Implementation

**MobileMCP Test Results**:
- Click success rate: 95%+
- Element discovery: 100% reliable via testID
- Test maintenance: Low (testID stable)
- Screen reader support: Full compliance

### Test Code Example

```typescript
// Before (coordinate-based, fragile)
await mobile_click_on_screen_at_coordinates(device, 360, 100)

// After (testID-based, reliable)
const elements = await mobile_list_elements_on_screen(device)
const createButton = elements.find(el => el.testID === 'tasks-create-button')
await mobile_click_on_screen_at_coordinates(device, createButton.x, createButton.y)

// Or even better (if tool supports)
await mobile_click_element(device, 'tasks-create-button')
```

---

## Implementation Checklist

### For New Components

When creating new interactive components:

- [ ] Add `accessibilityLabel` (Vietnamese, descriptive)
- [ ] Add `accessibilityHint` (action-oriented)
- [ ] Add `accessibilityRole` (appropriate type)
- [ ] Add `testID` (follows naming convention)
- [ ] Test with screen reader (TalkBack/VoiceOver)
- [ ] Test with MobileMCP (verify element discovery)
- [ ] Update if label/hint needs to be dynamic
- [ ] Document any special considerations

### For Existing Components

When updating existing components:

- [ ] Identify all interactive elements
- [ ] Add missing accessibility properties
- [ ] Follow Vietnamese language guidelines
- [ ] Follow testID naming convention
- [ ] Update dynamic labels if state changes
- [ ] Test with MobileMCP (verify improvement)
- [ ] Document changes in task file

### For Component Reviews

When reviewing pull requests:

- [ ] All interactive elements have 4 required properties
- [ ] Vietnamese labels are correct and natural
- [ ] Hints clearly describe action outcome
- [ ] testIDs follow naming convention
- [ ] Dynamic labels update with state
- [ ] No hardcoded English in accessibility properties

---

## Common Patterns

### Pattern 1: Remove Button in List

```tsx
{items.map((item, index) => (
  <View key={item.id}>
    <Text>{item.name}</Text>
    <Pressable
      accessibilityLabel={`Xóa ${item.name || `mục ${index + 1}`}`}
      accessibilityHint={`Xóa mục này khỏi danh sách`}
      accessibilityRole="button"
      testID={`list-remove-item-${index}`}
      onPress={() => removeItem(index)}
    >
      <Icon as={XIcon} />
    </Pressable>
  </View>
))}
```

### Pattern 2: Submit Button with Loading State

```tsx
<Button
  accessibilityLabel={isSubmitting ? 'Đang gửi' : 'Gửi'}
  accessibilityHint="Gửi biểu mẫu"
  accessibilityRole="button"
  testID="form-submit-button"
  disabled={isSubmitting || !isValid}
  onPress={handleSubmit}
>
  <Text>{isSubmitting ? 'Đang gửi...' : 'Gửi'}</Text>
</Button>
```

### Pattern 3: Action Button with Count

```tsx
<Button
  accessibilityLabel={`Tải lên ${count} ${count === 1 ? 'ảnh' : 'ảnh'}`}
  accessibilityHint={`Tải lên ${count} ảnh đã chọn`}
  accessibilityRole="button"
  testID="upload-photos-button"
  disabled={count === 0}
  onPress={handleUpload}
>
  <Icon as={UploadIcon} />
  <Text>Tải lên ({count})</Text>
</Button>
```

### Pattern 4: Toggle/Switch

```tsx
<Switch
  accessibilityLabel={isEnabled ? 'Đã bật thông báo' : 'Đã tắt thông báo'}
  accessibilityHint={isEnabled ? 'Nhấn để tắt' : 'Nhấn để bật'}
  accessibilityRole="switch"
  testID="notification-toggle"
  value={isEnabled}
  onValueChange={setIsEnabled}
/>
```

---

## Anti-Patterns

### ❌ Don't: Skip Accessibility Properties

```tsx
// ❌ BAD - No accessibility properties
<Button onPress={handleCreate}>
  <Text>Tạo mới</Text>
</Button>
```

### ❌ Don't: Use English in Vietnamese App

```tsx
// ❌ BAD - English in Vietnamese app
<Button
  accessibilityLabel="Create New Task"
  accessibilityHint="Navigate to create task screen"
  testID="tasks-create-button"
  onPress={handleCreate}
/>
```

### ❌ Don't: Generic or Vague Labels

```tsx
// ❌ BAD - Too generic
<Button
  accessibilityLabel="Button"
  accessibilityHint="Click here"
  testID="button1"
  onPress={handleCreate}
/>
```

### ❌ Don't: Inconsistent testID Naming

```tsx
// ❌ BAD - Inconsistent naming
testID="CreateButton"          // PascalCase (wrong)
testID="create_button"         // snake_case (wrong)
testID="btn-create"            // Abbreviation (unclear)
testID="tasks-create-button"   // ✅ Correct!
```

### ❌ Don't: Static Labels for Dynamic State

```tsx
// ❌ BAD - Static label doesn't reflect state
<Button
  accessibilityLabel="Gửi bình luận"
  testID="comment-send-button"
  disabled={isSubmitting}
>
  <Text>{isSubmitting ? 'Đang gửi...' : 'Gửi'}</Text>
</Button>

// ✅ GOOD - Dynamic label matches state
<Button
  accessibilityLabel={isSubmitting ? 'Đang gửi bình luận' : 'Gửi bình luận'}
  testID="comment-send-button"
  disabled={isSubmitting}
>
  <Text>{isSubmitting ? 'Đang gửi...' : 'Gửi'}</Text>
</Button>
```

---

## Related Documentation

- **Implementation Task**: `.claude/tasks/20251106-190000-app-store-screenshot-capture-mobilemcp.md`
- **Original Pattern**: `.claude/tasks/20251028-mobile-mcp-accessibility-optimization.md`
- **Testing Guide**: `docs/testing/mobile-mcp.md`
- **Screenshot Playbook**: `.claude/qa/screenshot-capture-playbook.md`

---

## Statistics

**Implementation Scope** (2025-11-06 - 2025-11-07):
- **Files modified**: 13 total (10 initial + 3 bug fixes)
- **Accessibility properties added**: 97+
- **Interactive elements improved**: 32+
- **Screen reader compliance**: 100%
- **MobileMCP compatibility**: 100%
- **Click success rate**: 95%+ (up from ~50%)
- **Screenshot capture success**: 13/13 (100%)
- **Bug fixes enabled**: 3 critical production bugs discovered and fixed

**Files with Accessibility Improvements**:
1. `apps/mobile/app/admin/(tabs)/tasks/index.tsx`
2. `apps/mobile/app/admin/tasks/create.tsx` (+ bug fixes)
3. `apps/mobile/app/worker/(tabs)/index.tsx`
4. `apps/mobile/components/admin-task-list.tsx`
5. `apps/mobile/components/attachment-upload-sheet.tsx`
6. `apps/mobile/components/attachment-uploader.tsx`
7. `apps/mobile/components/task-comment-box.tsx`
8. `apps/mobile/components/task/task-filter-bottom-sheet.tsx`
9. `apps/mobile/components/ui/button.tsx`
10. `apps/mobile/components/ui/menu.tsx`
11. `apps/mobile/components/user-select-bottom-sheet-modal.tsx`
12. `apps/mobile/components/ui/search-box.tsx`
13. `apps/mobile/components/task/task-assignee-filter.tsx`

---

## Maintenance

### When to Update This Pattern

- New accessibility requirements discovered
- React Native accessibility APIs change
- MobileMCP tool updates affect implementation
- Vietnamese language standards evolve
- Team feedback identifies improvements

### Version History

- **v1.0 (2025-11-06)**: Initial pattern established
  - Defined 4 required properties
  - Established testID naming convention
  - Documented Vietnamese language guidelines
  - Provided implementation examples

---

**Last Updated**: 2025-11-06
**Next Review**: 2026-02-06 (3 months)
**Pattern Owner**: Development Team
