# iOS App Store Submission Checklist

**Last Updated:** 2025-11-06
**App:** Nam Việt Internal (vn.dienlanhnamviet.internal)
**Current Version:** 1.0.0

This comprehensive checklist covers everything needed to publish the NV Internal app to the Apple App Store.

---

## 🎯 Prerequisites

### 1. Apple Developer Program Membership
- [ ] **Enrolled in Apple Developer Program** ($99 USD/year)
  - Sign up at: https://developer.apple.com/programs/
  - Required for App Store distribution
- [ ] **Apple ID verified** (dustin.do95@gmail.com)
- [ ] **Apple Team ID available** (9F77J83SKT) ✅ Already configured

### 2. Development Tools
- [ ] **EAS CLI installed** (`npm install -g eas-cli`)
- [ ] **EAS account authenticated** (`eas login`)
- [ ] **Expo account connected** (owner: duongdev) ✅ Already configured

### 3. App Identifiers & Configuration
- [x] **Bundle Identifier set**: `vn.dienlanhnamviet.internal` ✅
- [x] **App Store Connect App ID**: 6754835683 ✅
- [x] **EAS Project ID**: efc85258-12ce-4f6a-826a-ab5765d18ebc ✅

---

## 📱 App Configuration & Assets

### 4. App Icon Requirements
- [ ] **App icon created** (1024x1024 pixels minimum)
  - File: `apps/mobile/assets/images/icon.png` ✅ Exists
  - Format: PNG
  - Must be exactly square (no rounded corners)
  - No transparent pixels
  - Fills entire square
  - Test on different wallpapers
  - Avoid text beside wordmark
- [ ] **Icon follows Apple Human Interface Guidelines**
  - Guide: https://developer.apple.com/design/human-interface-guidelines/app-icons

### 5. Splash Screen Requirements
- [ ] **Splash screen configured**
  - File: `apps/mobile/assets/images/splash.png` ✅ Exists
  - Recommended: 1024x1024 pixels
  - Format: PNG
  - Transparent background recommended
- [ ] **Splash screen tested on production build** (NOT Expo Go)

### 6. App Metadata (Required for App Store Connect)

#### Basic Information
- [ ] **App Name**: "Nam Việt Internal" ✅ (max 30 characters)
  - No pricing or promotional terms
  - Clear and descriptive
- [ ] **Subtitle** (optional, max 30 characters)
  - Appears below app name
  - Describes app's purpose
- [ ] **Promotional Text** (max 170 characters)
  - Can be updated without new version
  - Visible before "Read More" button

#### Description & Keywords
- [ ] **App Description** (max 4,000 characters)
  - Clearly explains features and functionality
  - Highlights main use cases
  - Describes target audience (air conditioning service company employees)
  - Key features to mention:
    - Task management
    - GPS check-in/check-out verification
    - Photo attachments for work documentation
    - Location tracking for field workers
- [ ] **Keywords** (max 100 characters, comma-separated)
  - Relevant search terms
  - No app name in keywords
  - No competitor names
  - Focus on: task management, field service, check-in, GPS tracking, work orders

#### Screenshots (MANDATORY - 2025 Requirements)
- [ ] **iPhone Screenshots** (6.9-inch display)
  - Dimensions: 1290 x 2796 pixels (portrait) OR 2796 x 1290 pixels (landscape)
  - Required: Minimum 1 screenshot, maximum 10
  - Format: JPEG or PNG (RGB color space)
  - Max file size: 10MB each
  - **First 2 screenshots critical** (shown in search results)
  - Must show actual app UI (no mockups, logos only, or placeholder content)

  **Recommended Screenshots:**
  1. Task list screen with active tasks
  2. Task detail with photos and location
  3. Check-in confirmation screen
  4. GPS location verification screen
  5. Photo attachment feature
  6. Employee performance reports (if available)

- [ ] **iPad Screenshots** (13-inch display)
  - Dimensions: 2064 x 2752 pixels OR 2048 x 2732 pixels (portrait)
  - OR: 2752 x 2064 pixels OR 2732 x 2048 pixels (landscape)
  - Required even if not explicitly targeting iPad
  - Apple automatically scales for smaller displays

**Screenshot Guidelines:**
- Show actual screens from your app's UI
- No lorem ipsum or placeholder text
- Ensure readable text and clear UI
- Test on both light and dark mode if supported
- Localize screenshots if supporting multiple languages

#### App Preview Videos (Optional)
- [ ] **App Preview Videos** (up to 3 videos)
  - Length: Maximum 30 seconds each
  - Shows app's core features in action
  - Must be actual screen recordings from the app
  - No promotional content or text overlays beyond what's in the app

### 7. Privacy & Legal Requirements

#### Privacy Policy (REQUIRED)
- [ ] **Privacy Policy URL created and hosted**
  - Must be publicly accessible
  - Explains data collection and usage
  - Required since October 3, 2018
  - Should cover:
    - Location data collection (GPS check-in/check-out)
    - Camera and photo library access
    - User information storage
    - How data is used and shared
    - Data retention policies

#### App Privacy Details (REQUIRED)
- [ ] **Privacy practices answered in App Store Connect**
  - Required since December 8, 2020
  - Creates "Privacy Nutrition Label" on App Store
  - **Data to disclose for NV Internal:**
    - ✅ **Location data** (precise location for check-in/check-out)
    - ✅ **Photos** (camera and photo library access)
    - ✅ **User information** (name, email via Clerk authentication)
    - ✅ **Crash data** (expo-updates library requirement)
    - **Usage data** (if using analytics)
  - Specify data collection purpose (app functionality, analytics, etc.)
  - Indicate if data is linked to user identity
  - Indicate if data is used for tracking

#### Permissions Justification (Info.plist)
- [x] **Location Permission Description** ✅ Configured
  - `NSLocationWhenInUseUsageDescription`: "Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc."
  - `NSLocationAlwaysAndWhenInUseUsageDescription`: Same as above
- [x] **Camera Permission Description** ✅ Configured
  - `NSCameraUsageDescription`: "Nam Việt Internal cần quyền truy cập máy ảnh để chụp ảnh công việc và đính kèm vào nhiệm vụ."
- [x] **Photo Library Permission Description** ✅ Configured
  - `NSPhotoLibraryUsageDescription`: "Nam Việt Internal cần quyền truy cập thư viện ảnh để đính kèm ảnh vào nhiệm vụ."
- [x] **Encryption Declaration** ✅ Configured
  - `ITSAppUsesNonExemptEncryption`: false

### 8. Age Rating
- [ ] **Age Rating questionnaire completed**
  - Required in App Store Connect
  - Answer questions about content (violence, profanity, etc.)
  - Based on app's content and features
  - Likely rating: 4+ (no objectionable content for work management app)

### 9. Availability & Pricing
- [ ] **Pricing and Availability configured**
  - Select territories (Vietnam, or worldwide)
  - Set price (Free for internal company app)
  - Release date (automatic or scheduled)

### 10. Localization (Optional but Recommended)
- [ ] **Vietnamese localization**
  - App metadata translated to Vietnamese
  - Screenshots with Vietnamese UI
  - Description and keywords in Vietnamese
- [ ] **English localization** (if supporting international users)

---

## 🔐 App Signing & Credentials

### 11. iOS App Credentials
- [ ] **Distribution Certificate generated**
  - EAS CLI can handle automatically
  - Valid for all your apps
  - One per Apple Developer account
- [ ] **Provisioning Profile created**
  - App-specific
  - Expires after 12 months
  - Linked to distribution certificate
- [ ] **Push Notification Keys (APN)** (if using push notifications)
  - Up to 2 per account
  - Don't expire

**Run to generate credentials:**
```bash
cd apps/mobile
eas credentials --platform ios
```

---

## 🏗️ Build & Testing

### 12. Production Build
- [ ] **Environment variables configured for production**
  - Check `eas.json` production profile ✅
  - Verify all API keys are production values
  - Google Maps API keys set correctly
  - Clerk production keys configured

- [ ] **Create production build**
  ```bash
  cd apps/mobile
  eas build --platform ios --profile production
  ```
  - Uses `eas.json` production profile ✅ Configured
  - Auto-increment enabled ✅
  - Distribution: store ✅
  - Build configuration: Release ✅

### 13. Pre-Submission Testing
- [ ] **Test on production build** (not Expo Go or development builds)
  - Install production IPA on physical device
  - Test all core features:
    - User authentication (Clerk)
    - Task list loading
    - GPS check-in/check-out
    - Camera and photo library access
    - Photo uploads
    - Location tracking accuracy
    - Offline behavior
- [ ] **Test on multiple device sizes**
  - iPhone SE (small screen)
  - Standard iPhone (6.1-inch)
  - iPhone Pro Max (largest iPhone)
  - iPad (required testing even if not targeting tablets)
- [ ] **TestFlight Beta Testing** (optional but recommended)
  - Distribute to internal testers
  - Collect feedback before public release
  - Test with real users (field workers)
  - Verify GPS accuracy at work locations

### 14. App Review Preparation
- [ ] **Review App Store Review Guidelines**
  - Guide: https://developer.apple.com/app-store/review/guidelines/
  - Ensure compliance with all sections
  - Key guidelines for NV Internal:
    - **1.4 Safety**: Location data must be used appropriately
    - **2.1 Performance**: App must be complete and functional
    - **2.3 Accurate Metadata**: Screenshots and description match app
    - **5.1 Privacy**: Proper disclosure of data collection

- [ ] **Prepare Demo Account for Reviewers** (if app requires login)
  - **CRITICAL**: Create test account for Apple reviewers
  - Provide username and password in App Store Connect
  - Account should have access to all features
  - Pre-populate with sample data if needed

- [ ] **App Review Information in App Store Connect**
  - Demo account credentials (if required)
  - Contact information (email, phone)
  - Notes for reviewer explaining:
    - App is for air conditioning service company employees
    - GPS features require physical location testing
    - Any specific test scenarios

---

## 📤 Submission Process

### 15. App Store Connect Setup
- [ ] **Create app record in App Store Connect**
  - Log in: https://appstoreconnect.apple.com/
  - Navigate to "My Apps" → "+" → "New App"
  - Platform: iOS
  - Name: Nam Việt Internal
  - Language: Vietnamese (Primary) and/or English
  - Bundle ID: vn.dienlanhnamviet.internal
  - SKU: (unique identifier, e.g., nv-internal-001)
  - User Access: Full Access

### 16. Upload Metadata to App Store Connect
- [ ] **Fill in all required fields**
  - App Information
  - Pricing and Availability
  - App Privacy
  - Age Rating
  - App Review Information
- [ ] **Upload screenshots for all required sizes**
- [ ] **Upload app preview videos** (if created)
- [ ] **Add app description and keywords**
- [ ] **Set app category** (Business or Productivity)
- [ ] **Add support URL** (company website or support email)
- [ ] **Add marketing URL** (optional)

### 17. Submit Build
- [ ] **Upload build to App Store Connect**

  **Option A: Automated via EAS (Recommended)**
  ```bash
  cd apps/mobile
  eas submit --platform ios --profile production
  ```
  - Uses configuration from `eas.json` submit.production.ios ✅
  - Apple ID: dustin.do95@gmail.com ✅
  - ASC App ID: 6754835683 ✅
  - Apple Team ID: 9F77J83SKT ✅

  **Option B: Manual via Transporter app**
  - Download Transporter from Mac App Store
  - Upload IPA file from EAS build

- [ ] **Select build in App Store Connect**
  - Navigate to app → TestFlight or App Store tab
  - Select uploaded build
  - Add "What's New in This Version" text
  - Answer export compliance questions

### 18. Submit for Review
- [ ] **Review all information one final time**
  - Screenshots accurate and high-quality
  - Description clear and error-free
  - Privacy details complete
  - Demo account working
- [ ] **Click "Submit for Review"**
- [ ] **Wait for Apple's review** (typically 24-48 hours)
  - Status: "Waiting for Review"
  - Status: "In Review"
  - Status: "Pending Developer Release" OR "Ready for Sale"

---

## 🚀 Post-Submission

### 19. Monitor Review Status
- [ ] **Check App Store Connect daily**
- [ ] **Respond to any rejection within 14 days**
  - Review rejection reasons carefully
  - Fix issues and resubmit
  - Common rejection reasons:
    - Inaccurate screenshots or description
    - Missing demo account or doesn't work
    - Privacy issues or missing disclosures
    - App crashes or doesn't function properly

### 20. Release Planning
- [ ] **Choose release option**
  - **Automatic**: App goes live immediately after approval
  - **Manual**: You control when app goes live after approval
- [ ] **Prepare marketing materials** (optional)
  - App Store marketing toolkit
  - Social media announcements
  - Internal company announcement

### 21. Post-Launch Monitoring
- [ ] **Monitor App Analytics in App Store Connect**
  - Downloads and installations
  - Crash reports
  - User reviews and ratings
- [ ] **Set up crash reporting** (if not already configured)
  - Sentry, BugSnag, or Firebase Crashlytics
- [ ] **Plan for future updates**
  - Bug fixes
  - Feature improvements
  - iOS SDK updates (SDK 26+ required by April 2026)

---

## 📋 Common App Store Rejection Reasons (Prevention Checklist)

- [ ] **Incomplete app or bugs**: Ensure all features work perfectly
- [ ] **Inaccurate metadata**: Screenshots and description match actual app
- [ ] **Missing demo account**: Provide working credentials if login required
- [ ] **Privacy violations**: All data collection properly disclosed
- [ ] **Poor performance**: Test on older devices, fix crashes
- [ ] **Design issues**: App must look good on iPad even if not targeted
- [ ] **Guideline violations**: Review all App Store Review Guidelines
- [ ] **Placeholder content**: No "lorem ipsum" or test data in screenshots
- [ ] **Misleading functionality**: App does what description says

---

## 🔄 Future Updates

For subsequent version releases:
1. Update version number in `app.config.ts`
2. Create new production build with EAS
3. Upload new build to App Store Connect
4. Update "What's New" text
5. Submit for review
6. Updates typically reviewed faster than initial submission

---

## 📚 Useful Resources

- **Apple Developer Portal**: https://developer.apple.com/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/
- **Expo Documentation**: https://docs.expo.dev/
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/ios/
- **App Store Connect Help**: https://help.apple.com/app-store-connect/

---

## ✅ Quick Start Submission Commands

```bash
# 1. Navigate to mobile app directory
cd apps/mobile

# 2. Ensure you're logged into EAS
eas login

# 3. Build production iOS app
eas build --platform ios --profile production

# 4. Submit to App Store Connect (after build completes)
eas submit --platform ios --profile production

# 5. Monitor submission status
eas build:list
```

---

## 📝 Notes

- **Current Status**: Configuration is complete, ready for build and submission
- **Review Time**: Typically 24-48 hours, can be longer for first submission
- **Approval Rate**: Following this checklist should result in approval
- **Cost**: $99/year for Apple Developer Program membership
- **Internal App**: Since this is for company employees, consider TestFlight for wider distribution before public App Store release

---

**Good luck with your App Store submission! 🎉**
