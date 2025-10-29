# Test Plan: Task Details and Photo Attachments

**Feature**: Task Details View and Photo Management
**Version**: 1.0.0
**Created**: 2025-10-30
**Last Updated**: 2025-10-30
**Status**: ⏳ Draft

## 📋 Feature Overview

### Description
Comprehensive task details display with photo attachment capabilities, including upload, view, and delete functionality with proper permission handling.

### Business Requirements
- Display complete task information
- Support multiple photo attachments per task
- Allow photo capture and gallery selection
- Display photos in a viewable gallery
- Track who uploaded photos and when
- Support photo deletion (with permissions)

### Technical Implementation
- **Frontend**: Image picker, FlatList gallery, image viewer
- **Backend**: File upload endpoints, S3/storage integration
- **Database**: Attachment model with metadata

### Related Documentation
- Implementation: `.claude/tasks/20251022-224500-fix-attachment-counting-and-ui.md`
- API Documentation: `docs/api/attachments.md`

## 🎯 Test Objectives

### Primary Goals
1. Verify task details display accurately
2. Ensure photo upload works reliably
3. Validate photo viewing functionality
4. Confirm deletion permissions work
5. Test large image handling

### Out of Scope
- Video attachments
- File types other than images
- Image editing capabilities

## ✅ Success Criteria

### Functional Criteria
- [ ] Task details show all fields
- [ ] Photo upload from camera works
- [ ] Photo upload from gallery works
- [ ] Multiple photos can be attached
- [ ] Photos display in gallery view
- [ ] Full-screen photo viewing works
- [ ] Photo deletion works (with permission)
- [ ] Upload progress indicators show

### Non-Functional Criteria
- [ ] Photos upload within 10 seconds
- [ ] Gallery scrolls smoothly
- [ ] Large images handled gracefully
- [ ] Offline photos cached
- [ ] Memory usage controlled

## 📋 Prerequisites

### Test Environment
- **Device Requirements**: iOS 14+ / Android 10+
- **Network**: Variable speed for upload testing
- **Permissions**: Camera, photo library access

### Test Data
- **User Accounts**: Employee with task access
- **Required Data**:
  - Tasks with existing photos
  - Tasks without photos
  - Large image files (>5MB)
  - Various image formats (JPG, PNG)

### Setup Steps
1. Login as test employee
2. Grant camera and photo permissions
3. Navigate to task list
4. Select test task

## 🧪 Test Scenarios

### Happy Path Scenarios

#### Scenario 1: View Task Details
**Priority**: High
**Test Data**: Task with complete information

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Tap on task card | Details screen opens | | ⏳ |
| 2 | Verify header info | Title, status, priority shown | | ⏳ |
| 3 | Check customer info | Name, address, phone visible | | ⏳ |
| 4 | Verify assignees | All assignees listed | | ⏳ |
| 5 | Check dates | Created, scheduled dates shown | | ⏳ |

#### Scenario 2: Upload Photo from Camera
**Priority**: High
**Test Data**: Task without photos

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Tap add photo button | Options menu appears | | ⏳ |
| 2 | Select "Take Photo" | Camera opens | | ⏳ |
| 3 | Capture photo | Preview shows | | ⏳ |
| 4 | Confirm upload | Progress indicator | | ⏳ |
| 5 | Wait for completion | Photo appears in gallery | | ⏳ |
| 6 | Verify metadata | Timestamp and uploader shown | | ⏳ |

#### Scenario 3: Upload from Gallery
**Priority**: High
**Test Data**: Multiple test images

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Tap add photo button | Options menu appears | | ⏳ |
| 2 | Select "Choose from Gallery" | Photo picker opens | | ⏳ |
| 3 | Select multiple photos | Selection confirmed | | ⏳ |
| 4 | Tap upload | All photos upload | | ⏳ |
| 5 | Verify gallery | All photos display | | ⏳ |

### Edge Cases

#### Scenario 4: Large Image Upload
**Priority**: Medium
**Test Data**: Image >5MB

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Select large image | Image selected | | ⏳ |
| 2 | Start upload | Progress shows percentage | | ⏳ |
| 3 | Monitor progress | Incremental updates | | ⏳ |
| 4 | Verify compression | Image optimized if needed | | ⏳ |
| 5 | Check quality | Acceptable quality maintained | | ⏳ |

#### Scenario 5: Photo Deletion
**Priority**: Medium
**Test Data**: Task with photos

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Long press photo | Context menu appears | | ⏳ |
| 2 | Select delete | Confirmation dialog | | ⏳ |
| 3 | Confirm deletion | Photo removed | | ⏳ |
| 4 | Check permissions | Only own photos deletable | | ⏳ |

### Error Scenarios

#### Scenario 6: Network Failure During Upload
**Priority**: High
**Test Data**: Photo to upload

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Start photo upload | Upload begins | | ⏳ |
| 2 | Disable network | Upload fails | | ⏳ |
| 3 | Check error message | Clear error shown | | ⏳ |
| 4 | Enable network | Retry option available | | ⏳ |
| 5 | Retry upload | Upload completes | | ⏳ |

#### Scenario 7: Permission Denied
**Priority**: Medium
**Test Data**: Camera/gallery access

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Revoke permissions | Settings updated | | ⏳ |
| 2 | Try to add photo | Permission request | | ⏳ |
| 3 | Deny permission | Helpful message shown | | ⏳ |
| 4 | Settings link | Opens app settings | | ⏳ |

### Performance Scenarios

#### Scenario 8: Gallery with Many Photos
**Priority**: Medium
**Test Data**: Task with 50+ photos

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Open task with many photos | Gallery loads | | ⏳ |
| 2 | Scroll through gallery | Smooth scrolling | | ⏳ |
| 3 | Check lazy loading | Images load as needed | | ⏳ |
| 4 | Monitor memory | Stable memory usage | | ⏳ |

## 🔄 Regression Tests

### Critical Paths to Verify
- [ ] Task status changes still work
- [ ] Check-in/out not affected
- [ ] Other task data not corrupted
- [ ] Photo count displays correctly

## 📊 Test Execution

### Test Coverage

| Area | Scenarios | Passed | Failed | Blocked | Coverage |
|------|-----------|---------|---------|----------|-----------|
| View Details | 1 | | | | 0% |
| Photo Upload | 2 | | | | 0% |
| Photo Management | 2 | | | | 0% |
| Error Handling | 2 | | | | 0% |
| Performance | 1 | | | | 0% |
| **Total** | **8** | **0** | **0** | **0** | **0%** |

## 🐛 Defects Found

### Bug Summary
(To be filled during testing)

## 📈 Test Metrics

### Performance Benchmarks
- **Photo Upload**: < 10s for 3MB image
- **Gallery Load**: < 2s for 20 photos
- **Full Screen View**: < 500ms
- **Scroll FPS**: 60fps target

## 🎬 Test Evidence

### Screenshots
(To be captured during testing)

## ✍️ Sign-off

### Test Completion Criteria
- [ ] All upload methods tested
- [ ] Permission flows verified
- [ ] Performance acceptable
- [ ] Error handling validated

## 📝 Notes and Observations

### Improvements Suggested
- Batch upload UI improvements
- Photo compression options
- Thumbnail generation optimization

### Follow-up Items
- [ ] Test with various image formats
- [ ] Verify EXIF data handling
- [ ] Check accessibility for image viewer