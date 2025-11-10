# Task: App Store Submission Preparation

**Created**: 2025-11-06 09:45:00 UTC
**Status**: ⏳ In Progress
**Priority**: 🔴 Critical
**Category**: Deployment / App Store
**Related Tasks**:
- `.claude/tasks/20251104-035119-implement-eas-build-submit-workflow.md` (EAS Build Workflow)
- `.claude/tasks/20251106-085928-app-version-tracking-ota-updates.md` (OTA Updates)

---

## Overview

Preparing Nam Việt Internal iOS app for App Store submission. The app is already created in App Store Connect (ID: 6754835683) and the production build has been uploaded. This task tracks completion of remaining requirements for submission.

## Current Status

### ✅ Completed Items
- App created in App Store Connect
- Production build uploaded to TestFlight
- Basic metadata filled (description, keywords, support URL)
- iOS permissions configured with Vietnamese descriptions
- Bundle ID registered: `vn.dienlanhnamviet.internal`
- EAS configuration ready (`eas.json`)

### ❌ Blocking Issues for Submission
1. **Screenshots**: No iPhone screenshots uploaded (0 uploaded)
2. ~~**Privacy Policy URL**: Not set~~ ✅ Implemented at `/privacy-policy` (PSN-15, PR #10)
3. **Privacy Questionnaire**: Not started
4. **App Review Information**: Demo credentials empty
5. **Pricing & Availability**: Not configured
6. **Age Rating**: Not completed

## Implementation Plan

### Phase 1: Documentation Preparation ⏳ In Progress
- [x] Review existing documentation
- [x] Update current status with build confirmation
- [x] Create this task file to track submission
- [ ] Create Privacy Policy template
- [ ] Create App Review Notes template
- [ ] Create Demo Account preparation guide
- [ ] Create Screenshot requirements guide

### Phase 2: Content Creation
- [x] Draft Privacy Policy in Vietnamese/English ✅ (PSN-15)
- [x] Host Privacy Policy on API endpoint ✅ (`/privacy-policy`, PSN-15, PR #10)
- [ ] Take iPhone 6.5" screenshots (minimum 3, max 10)
- [ ] Take iPad screenshots (if supporting iPad)
- [ ] Create demo account with sample data
- [ ] Write App Review notes explaining app purpose

### Phase 3: App Store Connect Configuration
- [ ] Upload screenshots to App Store Connect
- [ ] Add Privacy Policy URL
- [ ] Complete Privacy Questionnaire
- [ ] Fill demo account credentials
- [ ] Add contact information
- [ ] Set pricing (Free) and territories (Vietnam)
- [ ] Complete Age Rating questionnaire

### Phase 4: Final Review & Submission
- [ ] Test demo account thoroughly
- [ ] Review all metadata for accuracy
- [ ] Verify screenshots show actual app UI
- [ ] Ensure Vietnamese descriptions are correct
- [ ] Submit for review

## Key Information

### App Details
- **App Name**: Nam Việt Internal
- **Bundle ID**: vn.dienlanhnamviet.internal
- **App Store ID**: 6754835683
- **Version**: 1.0
- **Company**: CÔNG TY TNHH THƯƠNG MẠI VÀ ĐIỆN LẠNH NAM VIỆT
- **Website**: https://dienlanhnamviet.vn
- **Target Audience**: Air conditioning service company employees

### Key Features to Highlight
1. Task management and assignment
2. GPS-verified check-in/check-out
3. Photo attachments for work documentation
4. Location tracking for field workers
5. Employee performance reports
6. Payment tracking and invoices

### Data Collection (for Privacy Policy)
- **Precise Location**: GPS for check-in/check-out verification
- **Photos**: Camera and photo library for task documentation
- **User Information**: Name, email via Clerk authentication
- **Crash Data**: Expo Updates telemetry
- **Usage Data**: App analytics (if enabled)

## Screenshot Requirements

### iPhone 6.5" Display (REQUIRED)
- **Dimensions**: 1242 × 2688px (portrait) or 2688 × 1242px (landscape)
- **Alternative**: 1284 × 2778px or 2778 × 1284px
- **Minimum**: 1 screenshot
- **Maximum**: 10 screenshots
- **Format**: JPEG or PNG (RGB, max 10MB each)

### Recommended Screenshots (Priority Order)
1. **Task List Screen** - Show active tasks with Vietnamese UI
2. **Task Detail with Photos** - Display GPS location and attachments
3. **Check-in Confirmation** - GPS verification success screen
4. **Photo Attachment** - Adding photos to tasks
5. **Employee Reports** - Performance/summary reports
6. **Payment Screen** - Payment tracking feature

### Screenshot Best Practices
- Use real data (not lorem ipsum)
- Show Vietnamese UI language
- Ensure text is readable
- Test on both light/dark mode
- First 2-3 screenshots are most important
- No mockups or placeholder content

## Privacy Policy Template Outline

### Required Sections
1. **Information We Collect**
   - Location data (precise GPS)
   - Photos and media
   - Account information (name, email)
   - Device information
   - Usage analytics

2. **How We Use Information**
   - Work location verification
   - Task documentation
   - Employee management
   - App improvement

3. **Data Storage & Security**
   - Where data is stored
   - Security measures
   - Retention periods

4. **User Rights**
   - Access to data
   - Deletion requests
   - Opt-out options

5. **Contact Information**
   - Privacy concerns email
   - Company address

## App Review Notes Template

```
App Purpose:
Nam Việt Internal is an internal task management application for employees of
Điện Lạnh Nam Việt, an air conditioning service company in Vietnam.

Key Features:
1. Task Management - Employees view and manage assigned service tasks
2. GPS Check-in/Check-out - Verify employee presence at work locations
3. Photo Documentation - Attach photos to document completed work
4. Location Tracking - Track field workers for efficient task assignment
5. Reports - View performance and completion reports

Testing Instructions:
1. Use provided demo account to log in
2. View task list showing sample service tasks
3. Open task detail to see location and photo features
4. Test check-in feature (GPS verification with 100m threshold)
5. Test photo attachment feature
6. View employee reports section

Important Notes:
- App is for internal company use only
- All UI is in Vietnamese
- GPS features work best at actual locations
- Demo account has pre-populated sample data

For questions: dustin.do95@gmail.com
```

## Demo Account Requirements

### Account Setup
- Create dedicated test account for Apple reviewers
- Use email format: `apple-review@dienlanhnamviet.vn`
- Set simple password: `AppleReview2025!`
- Assign "Worker" role for full feature access

### Sample Data to Include
- 5-10 active tasks in various statuses
- 2-3 completed tasks with photos
- Check-in/check-out history
- Sample customer locations
- Payment records (if applicable)

### Testing Scenarios to Enable
1. View task list and details
2. Perform check-in at any location
3. Add photo attachments
4. View reports and summaries
5. Access all navigation tabs

## Timeline

| Task | Estimated Time | Status |
|------|---------------|--------|
| Documentation prep | 2 hours | ⏳ In Progress |
| Privacy Policy draft & hosting | 3 hours | ⏳ Pending |
| Screenshots capture | 2 hours | ⏳ Pending |
| Demo account setup | 1 hour | ⏳ Pending |
| App Store Connect config | 1 hour | ⏳ Pending |
| Final review | 30 minutes | ⏳ Pending |
| **Total** | **~9.5 hours** | |

**Target Submission Date**: November 7, 2025

## Success Criteria

- [ ] All blocking issues resolved
- [ ] Screenshots uploaded and approved
- [ ] Privacy Policy live and accessible
- [ ] Demo account working perfectly
- [ ] All metadata accurate and complete
- [ ] App submitted for review
- [ ] Review status: "Waiting for Review"

## Risk Mitigation

### Common Rejection Reasons & Prevention
1. **Missing demo account**: Thoroughly test credentials before submission
2. **Inaccurate screenshots**: Use actual app UI, no mockups
3. **Privacy issues**: Complete questionnaire accurately
4. **Broken features**: Test production build thoroughly
5. **Incomplete metadata**: Review all fields multiple times

### Backup Plans
- Have alternative screenshots ready
- Prepare detailed review notes
- Keep direct contact with Apple Developer Support
- Document all features with video if needed
- Have team ready to fix issues quickly

## Documentation Created

### Primary Documents
- `.claude/docs/app-store-submission-checklist.md` - Complete reference guide
- `.claude/docs/app-store-current-status.md` - Current status and blockers
- `.claude/tasks/20251106-094500-app-store-submission-preparation.md` - This task file

### Templates to Create
- `.claude/docs/app-store-privacy-policy-template.md`
- `.claude/docs/app-store-review-notes-template.md`
- `.claude/docs/app-store-demo-account-guide.md`
- `.claude/docs/app-store-screenshot-guide.md`

## Notes

- Production build already uploaded (confirmed by user)
- App Store Connect app already created
- Focus on screenshots and privacy policy first (biggest blockers)
- Vietnamese language support is primary requirement
- Internal company app, not for public distribution initially

## Next Steps

1. **Immediate**: Create privacy policy template
2. **Today**: Take screenshots on iPhone simulator/device
3. **Today**: Draft and host privacy policy
4. **Tomorrow**: Complete all App Store Connect fields
5. **Tomorrow**: Submit for review

---

**Status Updates**:
- 2025-11-06 09:45:00 UTC - Task created, documentation review complete
- 2025-11-06 09:50:00 UTC - Updated status docs with build confirmation