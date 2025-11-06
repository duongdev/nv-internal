# Nam Việt Internal - App Store Connect Current Status

**Date:** 2025-11-06
**App ID:** 6754835683
**Bundle Identifier:** vn.dienlanhnamviet.internal
**Version:** 1.0
**Status:** Prepare for Submission
**Build Status:** ✅ Production build uploaded (confirmed by user)

---

## ✅ What's Already Configured

### Apple Developer Account
- ✅ **Apple Developer Program**: Active (Individual)
- ✅ **Team ID**: 9F77J83SKT
- ✅ **Renewal Date**: November 4, 2026
- ✅ **Email**: dustin.do95@gmail.com
- ✅ **Phone**: 84-979477635
- ✅ **Address**: 698 Truong Chinh, Tan Binh, Ho Chi Minh, 700000, Vietnam

### App Store Connect - Basic Setup
- ✅ **App Created**: Yes (Nam Việt Internal)
- ✅ **Bundle ID Registered**: vn.dienlanhnamviet.internal
- ✅ **Version**: 1.0
- ✅ **Primary Language**: Vietnamese

### App Metadata (Partially Complete)
- ✅ **Description** (Vietnamese):
  ```
  Nam Việt Internal là ứng dụng quản lý công việc nội bộ dành cho nhân viên
  Điện Lạnh Nam Việt. Tính năng chính:
  • Quản lý nhiệm vụ và phân công công việc
  • Check-in/Check-out với xác minh GPS
  • Đính kèm ảnh và video vào công việc
  • Theo dõi tiến độ và báo cáo
  • Thanh toán và hóa đơn

  Ứng dụng dành riêng cho nhân viên của Điện Lạnh Nam Việt.
  ```
  Characters used: 342 / 4,000

- ✅ **Keywords** (Vietnamese):
  ```
  quản lý công việc, điện lạnh, nam việt, nhiệm vụ, check-in
  ```
  Characters used: 58 / 100

- ✅ **Support URL**: https://dienlanhnamviet.vn
- ✅ **Copyright**: CÔNG TY TNHH THƯƠNG MẠI VÀ ĐIỆN LẠNH NAM VIỆT

### App Configuration Files
- ✅ **app.config.ts**: Properly configured with all permissions
- ✅ **eas.json**: Production profile ready
- ✅ **iOS Permissions**: All required permissions with Vietnamese descriptions
  - Location access (when in use)
  - Location access (always)
  - Camera access
  - Photo library access
  - Encryption declaration: false

### Release Settings
- ✅ **Release Type**: Automatically release this version (after approval)

---

## ❌ What's Missing / Incomplete

### 1. CRITICAL: Screenshots (REQUIRED)
- ❌ **iPhone 6.5" Display Screenshots**: 0 uploaded
  - Required dimensions: 1242 × 2688px (portrait) or 2688 × 1242px (landscape)
  - OR: 1284 × 2778px or 2778 × 1284px
  - Need: Minimum 1, maximum 10
  - **First 3 screenshots are critical** (shown in search results)

- ❌ **iPad Screenshots**: Not checked yet (but likely also missing)
  - Required even though app supports iPad

**Screenshot Status**: 🔴 BLOCKING - Cannot submit without screenshots

### 2. CRITICAL: Build Upload
- ✅ **Production Build Uploaded**: User confirmed build is already submitted to App Store Connect
- ⏳ **TestFlight**: Build processing/available for testing

### 3. CRITICAL: App Privacy Details (REQUIRED)
- ❌ **Privacy Policy URL**: Not set (shows "–")
- ❌ **Privacy Questionnaire**: Not started
  - Button shows "Get Started" (not completed)
  - Must disclose:
    - ✅ Location data collection (precise location)
    - ✅ Camera and photo library access
    - ✅ User information (Clerk authentication)
    - ✅ Crash data (expo-updates)

**Privacy Status**: 🔴 BLOCKING - Cannot submit without privacy disclosures

### 4. CRITICAL: App Review Information
- ❌ **Sign-in credentials**: Not filled (Username and Password fields empty)
  - "Sign-in required" is checked ✅
  - Must provide demo account for Apple reviewers

- ❌ **Contact Information**: Not filled
  - First name
  - Last name
  - Phone number
  - Email

- ❌ **Notes**: Empty (optional but recommended)
  - Should explain app purpose and testing instructions

**App Review Info Status**: 🔴 BLOCKING - Required for submission

### 5. Optional but Recommended

- ❌ **Promotional Text**: Empty
  - Can be updated without new version
  - 170 characters available
  - Appears before "Read More"

- ❌ **Marketing URL**: Empty (optional)

- ❌ **App Preview Videos**: None uploaded
  - Up to 3 videos, max 30 seconds each
  - Optional but improves conversion

- ❌ **Pricing and Availability**: Not checked
  - Territories selection
  - Pricing (likely Free for internal app)

- ❌ **Age Rating**: Not checked
  - Need to complete questionnaire

- ❌ **App Accessibility**: Not checked
  - Optional Accessibility Nutrition Label

---

## 🚨 Blocking Issues Summary

Before you can submit, you MUST complete:

1. **Upload Screenshots** (iPhone 6.5" display minimum)
2. **Complete App Privacy Questionnaire**
3. **Add Privacy Policy URL**
4. ~~**Upload Production Build**~~ ✅ Already completed
5. **Fill App Review Information**:
   - Demo account credentials (username/password)
   - Contact information (name, phone, email)
6. **Set Pricing and Availability**
7. **Complete Age Rating questionnaire**

---

## 📋 Immediate Next Steps

### Step 1: Create Screenshots (PRIORITY 1)
**Devices needed:**
- iPhone 6.5" display: 1242 × 2688 pixels (portrait)

**Screenshots to capture** (recommended order):
1. **Task List Screen** - Show active tasks with Vietnamese UI
2. **Task Detail with GPS** - Show check-in location and photo attachments
3. **Check-in Confirmation** - Show GPS verification screen
4. **Photo Attachment Feature** - Show adding photos to tasks
5. **Employee Reports** - Show performance/completion reports (if available)

**Tools:**
- Use actual app on real device or simulator
- Ensure latest version with production data
- Clean UI (no lorem ipsum or test data)
- Both light and dark mode if supported

### Step 2: Create Privacy Policy (PRIORITY 1)
**Must include:**
- What data is collected:
  - Precise location (GPS check-in/check-out)
  - Photos (work documentation)
  - User information (name, email, employee ID)
  - Crash reports
- How data is used:
  - Work location verification
  - Task documentation
  - Employee management
- How data is stored and protected
- Data retention policy
- Contact information for privacy concerns

**Where to host:**
- Company website: https://dienlanhnamviet.vn/privacy-policy
- OR create separate privacy page

### Step 3: ~~Upload Production Build~~ ✅ COMPLETED
Production build has been successfully uploaded to App Store Connect.

### Step 4: Complete App Privacy Questionnaire (PRIORITY 1)
**In App Store Connect:**
1. Go to App Privacy section
2. Click "Get Started"
3. Answer questions about:
   - Data collection practices
   - Data types collected
   - How data is linked to users
   - Data usage purposes

**Data to declare:**
- ✅ **Location**: Precise location for app functionality
- ✅ **Photos**: Camera and photo library for work documentation
- ✅ **Contact Info**: Name and email (via Clerk)
- ✅ **Identifiers**: User ID for account management
- ✅ **Diagnostics**: Crash data (expo-updates requirement)

### Step 5: Fill App Review Information (PRIORITY 1)
**Demo Account:**
- Create a test account with sample data
- Username and password for Apple reviewers
- Ensure account has access to all features
- Pre-populate with realistic data

**Contact Information:**
- First Name: Dương
- Last Name: Đỗ
- Phone: +84-979477635
- Email: dustin.do95@gmail.com

**Notes for Reviewer:**
```
This is an internal task management app for Điện Lạnh Nam Việt
air conditioning service company employees.

Key Features:
- Task management with GPS check-in/check-out verification
- Photo attachments for work documentation
- Location tracking requires physical location testing
- All UI is in Vietnamese

Demo Account Details:
- The demo account has pre-populated sample tasks
- GPS features work best at actual work locations
- Camera/photo features can be tested with any image

For questions, contact: dustin.do95@gmail.com
```

### Step 6: Set Pricing and Availability
**Recommended settings:**
- **Price**: Free (internal company app)
- **Territories**: Vietnam (or worldwide if needed)
- **Availability Date**: Automatic (releases when approved)

### Step 7: Complete Age Rating Questionnaire
**Expected rating**: 4+ (no objectionable content)

**Questions will cover:**
- Violence
- Sexual content
- Profanity
- Gambling
- Medical information
- etc.

For a work management app, answers should all be "None" or minimal.

---

## 🎯 Estimated Timeline

| Task | Time Required | Priority |
|------|---------------|----------|
| Take screenshots | 1-2 hours | 🔴 Critical |
| Create privacy policy | 2-3 hours | 🔴 Critical |
| Complete privacy questionnaire | 30 minutes | 🔴 Critical |
| Upload production build | 30 min + 15-30 min build time | 🔴 Critical |
| Fill app review info | 15 minutes | 🔴 Critical |
| Set pricing/availability | 10 minutes | 🔴 Critical |
| Complete age rating | 10 minutes | 🔴 Critical |
| **Total** | **~6-8 hours** | |

**After submission:**
- Initial review: 24-48 hours (typically)
- If approved: App goes live automatically
- If rejected: Address feedback and resubmit

---

## 📞 Quick Commands

### Build and Submit
```bash
# From project root
cd apps/mobile

# Login to EAS (if not already)
eas login

# Build production iOS
eas build --platform ios --profile production

# After build completes, submit
eas submit --platform ios --profile production

# Check build status
eas build:list
```

### Generate Credentials (if needed)
```bash
cd apps/mobile
eas credentials --platform ios
```

---

## 🔗 Important Links

- **App Store Connect**: https://appstoreconnect.apple.com/apps/6754835683
- **App Privacy Section**: https://appstoreconnect.apple.com/apps/6754835683/distribution/privacy
- **App Version 1.0**: https://appstoreconnect.apple.com/apps/6754835683/distribution/ios/version/inflight
- **TestFlight**: https://appstoreconnect.apple.com/teams/6d14b01a-6353-49a9-b9c6-26a057fab119/apps/6754835683/testflight

---

## ✅ Submission Readiness Checklist

Use this checklist before clicking "Submit for Review":

- [ ] Screenshots uploaded (iPhone 6.5" minimum)
- [ ] iPad screenshots uploaded (if app supports iPad)
- [ ] Privacy Policy URL added
- [ ] App Privacy questionnaire completed
- [ ] Production build uploaded and selected
- [ ] Demo account created and credentials filled
- [ ] Contact information filled
- [ ] Notes for reviewer added
- [ ] Pricing set (Free recommended)
- [ ] Territories selected (Vietnam minimum)
- [ ] Age rating completed
- [ ] Description reviewed for accuracy
- [ ] Keywords optimized
- [ ] Support URL working
- [ ] Copyright information correct
- [ ] All permissions have Vietnamese descriptions
- [ ] Test the demo account works
- [ ] Review entire submission one final time

---

## 🎉 What Happens After Submission

1. **Status: "Waiting for Review"**
   - Your app is in the queue
   - Typically 24-48 hours

2. **Status: "In Review"**
   - Apple is actively reviewing
   - Usually takes a few hours

3. **Approved → "Pending Developer Release" or "Ready for Sale"**
   - Since you selected "Automatically release", it goes live immediately
   - You'll receive email notification

4. **Rejected → "Rejected"**
   - Review rejection reasons carefully
   - Fix issues
   - Resubmit within 14 days
   - Common rejection reasons:
     - Missing demo account or doesn't work
     - Inaccurate screenshots
     - Privacy issues
     - App crashes

---

## 📝 Notes

- Your configuration files (app.config.ts, eas.json) are perfectly set up ✅
- All iOS permissions have proper Vietnamese descriptions ✅
- EAS submit configuration is ready to use ✅
- Focus on screenshots, privacy policy, and build upload first
- Everything else is relatively quick to complete

Good luck with your submission! 🚀
