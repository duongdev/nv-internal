# Production Deployment Plan - Nam Việt Internal

**Created**: 2025-11-01
**Status**: Planning
**App Name**: Nam Việt Internal
**Bundle ID**: `vn.dienlanhnamviet.internal`
**Version Strategy**: Semantic versioning + auto-increment build (e.g., v1.0.0 (256))

---

## 📋 Deployment Progress Tracker

Use this checklist to track your progress through the deployment process. Check off items as you complete them.

### 🔐 Phase 1-2: Account Setup (Week 1, Day 1-2)

#### Apple Developer Account

- [ ] Visit https://developer.apple.com/programs/enroll/
- [ ] Sign in or create Apple ID
- [ ] Choose account type (Individual/Organization)
- [ ] If Organization: Request D-U-N-S Number (1-2 weeks)
- [ ] Pay $99/year fee
- [ ] Wait for account approval (24-48 hours)
- [ ] Access App Store Connect: https://appstoreconnect.apple.com/
- [ ] Get Team ID from Membership section
- [ ] Save Team ID securely (DO NOT commit to repo)

#### Google Play Console Account

- [ ] Visit https://play.google.com/console/signup
- [ ] Sign in with Google Account
- [ ] Accept Developer Distribution Agreement
- [ ] Pay $25 one-time fee
- [ ] Complete identity verification (ID + address proof)
- [ ] Wait for account approval (24 hours)
- [ ] Set up organization details in Play Console
- [ ] Create internal testing track

### ⚙️ Phase 3: EAS CLI Setup (Week 1, Day 3)

- [ ] Install EAS CLI globally: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login` (duongdev)
- [ ] Verify login: `eas whoami`
- [ ] Navigate to mobile app: `cd apps/mobile`
- [ ] Verify EAS project link: `eas init`
- [ ] Confirm Project ID: efc85258-12ce-4f6a-826a-ab5765d18ebc

### 🔑 Phase 4: Environment Configuration (Week 1, Day 3-5)

#### Clerk Production Instance

- [x] Visit https://dashboard.clerk.com/
- [x] Create new application: "Nam Việt Internal (Production)"
- [x] Configure sign-in methods (match development)
- [x] Copy production Publishable Key (`pk_live_...`)
- [x] Copy production Secret Key (`sk_live_...`)
- [x] Configure user metadata fields
- [x] Save keys securely

#### Google Maps API Keys

- [x] Visit https://console.cloud.google.com/apis/credentials
- [x] Create iOS Production Key
  - [x] Name: "Nam Việt Internal - iOS Production"
  - [x] Restrict to iOS apps
  - [x] Add bundle ID: `vn.dienlanhnamviet.internal`
  - [x] Enable Maps SDK for iOS + Places API
  - [x] Save key as `GOOGLE_MAPS_IOS_PROD_KEY`
- [ ] Create Android Production Key
  - [ ] Name: "Nam Việt Internal - Android Production"
  - [ ] Restrict to Android apps
  - [ ] Add package name: `vn.dienlanhnamviet.internal`
  - [ ] Enable Maps SDK for Android + Places API
  - [ ] Save key as `GOOGLE_MAPS_ANDROID_PROD_KEY`
  - [ ] Note: SHA-1 fingerprint to be added after first build
- [x] Enable billing on Google Cloud project
- [x] Set budget alert ($50/month)

#### EAS Secrets Configuration

- [ ] Create staging secrets (from `apps/mobile/`):
  - [ ] `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING`
  - [ ] `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_STAGING`
  - [ ] `EXPO_PUBLIC_API_URL_STAGING`
- [ ] Create production secrets:
  - [ ] `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_PRODUCTION`
  - [ ] `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY_PRODUCTION`
  - [ ] `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY_PRODUCTION`
  - [ ] `EXPO_PUBLIC_API_URL_PRODUCTION`
- [ ] Verify all secrets: `eas secret:list`

### 📱 Phase 5-6: EAS Build Configuration (Week 1, Day 5-7)

- [ ] Review `eas.json` configuration (already exists)
- [ ] Update `eas.json` with Apple Team ID (in `submit.production.ios.appleTeamId`)
- [ ] Update `eas.json` with Apple ID email (in `submit.production.ios.appleId`)
- [ ] Review `app.config.ts` for dynamic configuration
- [ ] Verify environment-specific Google Maps keys in config
- [ ] Test local build with dev profile: `eas build --platform ios --profile development --local` (optional)
- [ ] Commit `eas.json` and `app.config.ts` changes

### 🌿 Phase 7: Git Branching Workflow (Week 1, Day 6)

- [ ] Create `develop` branch from `main`
- [ ] Push `develop` to remote: `git push -u origin develop`
- [ ] Configure Vercel deployment settings
  - [ ] Set `main` as production branch
  - [ ] Enable auto-deploy on `main`
  - [ ] Enable preview deployments for `develop`
- [ ] Test feature branch workflow (optional)

### 🗺️ Phase 8: Google Maps Production Setup (After First Build)

- [ ] Trigger first Android production build (see Phase 10)
- [ ] Get SHA-1 fingerprint from build output or `eas credentials`
- [ ] Add SHA-1 to Android API key restrictions
- [ ] Verify iOS key restrictions (bundle ID)
- [ ] Verify Android key restrictions (package + SHA-1)
- [ ] Test Maps integration with production keys

### 🔧 Phase 9: Third-Party Services (Week 1, Day 7)

#### Vercel API Configuration

- [ ] Verify API auto-deploys on `main` push
- [ ] Update storage service with environment prefixes (`prod/` vs `dev/`)
- [ ] Add `NODE_ENV` to Vercel environment variables

#### Vercel Environment Variables

- [ ] Visit https://vercel.com/duongdev/nv-internal-api/settings/environment-variables
- [ ] Add production variables:
  - [ ] `DATABASE_URL` (Neon production)
  - [ ] `CLERK_SECRET_KEY` (`sk_live_...`)
  - [ ] `CLERK_PUBLISHABLE_KEY` (`pk_live_...`)
  - [ ] `STORAGE_PROVIDER` (vercel-blob)
  - [ ] `BLOB_READ_WRITE_TOKEN`
  - [ ] `NODE_ENV` (production)
- [ ] Trigger redeploy after adding variables

#### Neon Database

- [ ] Test production database connection
- [ ] Run `npx prisma migrate status` on production DB
- [ ] Verify all migrations applied
- [ ] Document: NEVER use `migrate dev` on production

#### Clerk Production

- [ ] Verify sign-in methods match development
- [ ] Verify user metadata fields configured
- [ ] Configure webhooks to point to production API (if used)
- [ ] Test authentication with production instance

### 🏗️ Phase 10: Build & Deploy (Week 2)

#### Pre-Build Validation

- [ ] All EAS secrets configured
- [ ] `app.config.ts` and `eas.json` committed
- [ ] Version number updated in `app.config.ts` (if applicable)
- [ ] Code tested locally
- [ ] API deployed to production
- [ ] Database migrations applied

#### iOS Production Build (Week 2, Day 13-14)

- [ ] Run: `eas build --platform ios --profile production`
- [ ] Wait for build completion (~15-20 min)
- [ ] Receive build completion email
- [ ] Download .ipa (optional): `eas build:download --id <BUILD_ID>`
- [ ] Verify build on EAS dashboard

#### Android Production Build (Week 2, Day 13-14)

- [ ] Run: `eas build --platform android --profile production`
- [ ] Wait for build completion (~10-15 min)
- [ ] Receive build completion email
- [ ] Copy SHA-1 fingerprint from build output
- [ ] Add SHA-1 to Google Maps Android API key (Phase 8)
- [ ] Download .aab (optional): `eas build:download --id <BUILD_ID>`
- [ ] Verify build on EAS dashboard

### 🔄 Phase 11: OTA Updates Setup (Week 2)

- [ ] Create `.github/workflows/eas-update.yml` workflow
- [ ] Get Expo access token from https://expo.dev/accounts/[account]/settings/access-tokens
- [ ] Add `EXPO_TOKEN` to GitHub Secrets
- [ ] Test OTA update to staging channel
- [ ] Document OTA vs App Store update decision criteria

### 📲 Phase 12: iOS App Store Submission (Week 3-4)

#### Create App Listing (Week 3, Day 15-16)

- [ ] Visit https://appstoreconnect.apple.com/apps
- [ ] Create new app: "Nam Việt Internal"
- [ ] Set primary language: Vietnamese
- [ ] Select bundle ID: `vn.dienlanhnamviet.internal`
- [ ] Set SKU: `nv-internal`
- [ ] Copy App Store Connect App ID (ASC App ID)
- [ ] Update `eas.json` with ASC App ID

#### Prepare Store Listing (Week 3, Day 15-16)

- [ ] Take screenshots (6.7", 6.5", 5.5" displays)
- [ ] Write Vietnamese description
- [ ] Set keywords (Vietnamese)
- [ ] Create/host privacy policy
- [ ] Add support URL/email
- [ ] Set category: Productivity/Business
- [ ] Set age rating: 4+

#### TestFlight Distribution (Week 3, Day 17-21)

- [ ] Submit build: `eas submit --platform ios --profile production`
- [ ] Wait for processing (5-10 min)
- [ ] Configure export compliance in TestFlight
- [ ] Add internal testers (App Store Connect users)
- [ ] Add external testers (optional, requires review)
- [ ] Send TestFlight invitations
- [ ] Gather feedback (1-2 weeks)
- [ ] Test on multiple devices
- [ ] Verify GPS check-in/check-out
- [ ] Verify photo uploads
- [ ] Fix any critical bugs found

#### App Store Review (Week 4, Day 22-28)

- [ ] Create version 1.0.0 in App Store tab
- [ ] Upload all screenshots
- [ ] Fill in description, keywords, URLs
- [ ] Select build to submit
- [ ] Provide demo account credentials
- [ ] Add review notes
- [ ] Submit for review
- [ ] Wait for approval (24-48 hours)
- [ ] Monitor review status
- [ ] Address any rejection reasons
- [ ] Release app when approved

### 🤖 Phase 13: Android Play Store Submission (Week 3-4)

#### Create App Listing (Week 3, Day 15-16)

- [ ] Visit https://play.google.com/console/
- [ ] Create new app: "Nam Việt Internal"
- [ ] Set default language: Vietnamese
- [ ] Set app type: App (not game)
- [ ] Set pricing: Free
- [ ] Accept declarations

#### App Content Configuration (Week 3, Day 15-16)

- [ ] Add privacy policy URL
- [ ] Configure app access (restricted + test credentials)
- [ ] Complete content ratings questionnaire
- [ ] Set target audience: 18+
- [ ] Configure data safety section
  - [ ] Location, Photos, User account info
  - [ ] Encryption in transit: Yes
  - [ ] Data deletion available: Yes

#### Store Listing (Week 3, Day 15-16)

- [ ] Take screenshots (phone: 1080x1920-2340)
- [ ] Create app icon (512x512, no transparency)
- [ ] Create feature graphic (1024x500)
- [ ] Write Vietnamese description
- [ ] Set category: Productivity
- [ ] Add contact email
- [ ] Add website (optional)

#### Internal Testing (Week 3, Day 17-21)

- [ ] Submit to internal testing: `eas submit --platform android --profile production`
- [ ] Create tester email list: "Nam Việt Team"
- [ ] Add tester emails
- [ ] Share testing link with testers
- [ ] Gather feedback (1-2 weeks)
- [ ] Test on multiple Android devices
- [ ] Fix any critical bugs found

#### Production Release (Week 4, Day 22-28)

- [ ] Create production release
- [ ] Promote internal testing build (or upload new AAB)
- [ ] Select countries (Vietnam or all)
- [ ] Write release notes (Vietnamese)
- [ ] Start rollout to production
- [ ] Wait for review (1-3 days)
- [ ] Monitor review status
- [ ] App goes live automatically after approval

### 📊 Phase 14: Post-Launch Monitoring

#### Monitoring Setup

- [ ] Set up App Store Connect analytics
- [ ] Set up Play Console statistics
- [ ] Monitor TestFlight/internal testing feedback
- [ ] Set up crash reporting (Sentry or PostHog)
- [ ] Configure Sentry DSN in EAS secrets (if using Sentry)
- [ ] Set up PostHog account (recommended)
  - [ ] Create project: "Nam Việt Internal - Mobile"
  - [ ] Get API key
  - [ ] Integrate with mobile app
  - [ ] Configure event tracking

#### Daily Monitoring (After Launch)

- [ ] Check crash reports
- [ ] Monitor user reviews/ratings
- [ ] Track app store analytics
- [ ] Review error logs
- [ ] Monitor API performance (Vercel)
- [ ] Check database performance (Neon)

### 🔒 Phase 16: Security Best Practices

- [ ] Verify `.gitignore` includes all sensitive files
- [ ] Confirm no secrets in committed code
- [ ] Document secret rotation schedule (every 6 months)
- [ ] Set API key restrictions (Google Maps)
- [ ] Enable Clerk security features:
  - [ ] Bot detection
  - [ ] Rate limiting
  - [ ] IP restrictions (if applicable)
- [ ] Document security incident response plan

### 📚 Documentation & Training

- [ ] Update README with production deployment info
- [ ] Document OTA update process for team
- [ ] Create runbook for common operations
- [ ] Train team on monitoring dashboards
- [ ] Document support process
- [ ] Create FAQ for common issues
- [ ] Document rollback procedures

### 🎉 Launch Readiness

- [ ] All above phases completed
- [ ] App tested on iOS physical device
- [ ] App tested on Android physical device
- [ ] GPS verification tested with production keys
- [ ] Photo uploads tested with production storage
- [ ] Authentication tested with production Clerk
- [ ] Monitoring dashboards configured
- [ ] Team trained and ready
- [ ] Support process documented
- [ ] Launch announcement prepared (if applicable)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites & Account Setup](#prerequisites--account-setup)
3. [Environment Configuration](#environment-configuration)
4. [EAS Build Configuration](#eas-build-configuration)
5. [Git Branching Workflow](#git-branching-workflow)
6. [Google Maps API Production Setup](#google-maps-api-production-setup)
7. [Third-Party Services Configuration](#third-party-services-configuration)
8. [Build & Deploy Workflow](#build--deploy-workflow)
9. [OTA Updates Strategy](#ota-updates-strategy)
10. [App Store Submission](#app-store-submission)
11. [Post-Launch Monitoring](#post-launch-monitoring)
12. [Future Optimizations](#future-optimizations)

---

## Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Development Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Feature Branch ──→ develop ──→ main ──→ Production         │
│       ↓                ↓           ↓            ↓            │
│   Local Dev      Auto Deploy   Manual     App Stores        │
│                  (Vercel)      OTA Push   (TestFlight/      │
│                                           Play Console)      │
└─────────────────────────────────────────────────────────────┘
```

### Build & Distribution Strategy

| Type                 | Trigger                 | Distribution                    | Use Case                   |
| -------------------- | ----------------------- | ------------------------------- | -------------------------- |
| **Development**      | Manual (local)          | Expo Go                         | Local testing              |
| **Staging Build**    | Manual (GitHub Actions) | Internal OTA (staging channel)  | QA testing                 |
| **Production Build** | Manual (GitHub Actions) | TestFlight/Play Console + OTA   | Beta → Public release      |
| **OTA Update**       | Manual (GitHub Actions) | EAS Update (production channel) | Hot fixes, JS-only updates |

### Cost Breakdown

#### One-Time Costs

- **Apple Developer Program**: $99/year (required for TestFlight & App Store)
- **Google Play Console**: $25 one-time (required for Play Store)

#### Monthly Costs (Free Tier)

- **EAS Build**: FREE (30 builds/month per platform)
- **EAS Submit**: FREE (included)
- **EAS Update**: FREE (unlimited OTA updates)
- **GitHub Actions**: FREE (unlimited for public repos)
- **Vercel**: FREE (hobby plan, current usage)
- **Neon Database**: FREE (current tier)
- **Clerk**: FREE (up to 10,000 MAU)

**Total Monthly**: $0 (assuming free tiers are sufficient)

---

## Prerequisites & Account Setup

### Phase 1: Apple Developer Account Setup

**Timeline**: 1-2 business days (Apple approval time)

#### Step 1.1: Create Apple Developer Account

1. **Visit**: https://developer.apple.com/programs/enroll/
2. **Sign in** with your Apple ID (or create one)
3. **Choose Account Type**:
   - **Organization**: Recommended (company name in App Store)
     - Requires: D-U-N-S Number (free, takes 1-2 weeks)
     - Process: https://developer.apple.com/support/D-U-N-S/
   - **Individual**: Faster (your name in App Store)
     - Uses personal Apple ID
4. **Pay**: $99/year (auto-renews)
5. **Wait for approval**: Check email (usually 24-48 hours)

#### Step 1.2: Access App Store Connect

1. **Visit**: https://appstoreconnect.apple.com/
2. **Sign in** with Developer Account credentials
3. **Navigate to**: "My Apps" → Should see empty app list
4. **Note**: Keep this tab open - you'll create the app listing later

#### Step 1.3: Get Team ID (Required for EAS)

1. In **App Store Connect**, click your name (top right)
2. Go to **"Users and Access"** → **"Keys"** (left sidebar)
3. Or visit: https://developer.apple.com/account
4. Click **"Membership"** → Copy **"Team ID"** (10-character string)
5. **Save this**: You'll need it for `eas.json`

**🔐 Security Note**: Do NOT commit Team ID to public repo - we'll use environment variables.

---

### Phase 2: Google Play Console Account Setup

**Timeline**: 24 hours (Google verification time)

#### Step 2.1: Create Google Play Developer Account

1. **Visit**: https://play.google.com/console/signup
2. **Sign in** with Google Account (or create one)
3. **Accept** Developer Distribution Agreement
4. **Pay**: $25 one-time registration fee
5. **Complete Identity Verification**:
   - Government-issued ID
   - Proof of address (may be required)
6. **Wait for approval**: Check email (usually 24 hours)

#### Step 2.2: Set Up Your Organization

1. In **Play Console**, go to **"Settings"** → **"Developer account"**
2. Fill in:
   - **Organization name**: "Điện Lạnh Nam Việt" (or company name)
   - **Address**: Company address in Vietnam
   - **Contact email**: Support email
   - **Website**: Company website (if available)

#### Step 2.3: Create Internal Testing Track (Optional but Recommended)

1. **Navigate to**: "Testing" → "Internal testing"
2. **Create track**: "Internal"
3. **Add testers**: Add email addresses of beta testers
4. **Note**: You'll upload your first APK/AAB later

---

### Phase 3: EAS CLI & Project Setup

#### Step 3.1: Install EAS CLI

```bash
# Install globally
npm install -g eas-cli

# Login to your Expo account
eas login
# Enter credentials for: duongdev

# Verify login
eas whoami
# Should output: duongdev
```

#### Step 3.2: Link Project to EAS

```bash
# Navigate to mobile app
cd apps/mobile

# Initialize EAS (project already linked, but verify)
eas init

# Should show:
# ✔ Project ID: efc85258-12ce-4f6a-826a-ab5765d18ebc
# ✔ Owner: duongdev
```

---

## Environment Configuration

### Phase 4: Environment Variables Setup

We need **three environments**:

1. **Development** (local `.env`)
2. **Staging** (EAS secrets)
3. **Production** (EAS secrets)

#### Step 4.1: Create Production Clerk Instance

1. **Visit**: https://dashboard.clerk.com/
2. **Create New Application**:
   - Name: "Nam Việt Internal (Production)"
   - Sign-in methods: Same as dev (Email, Phone, etc.)
3. **Copy Keys**:
   - **Publishable Key**: `pk_live_...`
   - **Secret Key**: `sk_live_...`
4. **Configure Settings**: Match development instance settings
5. **Save keys** for next step

#### Step 4.2: Create Production Google Maps API Keys

**Important**: Separate keys for iOS and Android for better security.

##### iOS Production Key

1. **Visit**: https://console.cloud.google.com/apis/credentials
2. **Select Project**: Your Google Cloud project
3. **Create Credentials** → **API Key**
4. **Name**: `Nam Việt Internal - iOS Production`
5. **Restrict Key**:
   - **Application restrictions**: iOS apps
   - **Add iOS bundle ID**: `vn.dienlanhnamviet.internal`
6. **API restrictions**:
   - Maps SDK for iOS
   - Places API (if used)
7. **Copy Key**: Save as `GOOGLE_MAPS_IOS_PROD_KEY`

##### Android Production Key

1. **Create Credentials** → **API Key**
2. **Name**: `Nam Việt Internal - Android Production`
3. **Restrict Key**:
   - **Application restrictions**: Android apps
   - **Add package name**: `vn.dienlanhnamviet.internal`
   - **SHA-1 Fingerprint**: Get from EAS (we'll add this later)
4. **API restrictions**:
   - Maps SDK for Android
   - Places API (if used)
5. **Copy Key**: Save as `GOOGLE_MAPS_ANDROID_PROD_KEY`

**Note**: We'll get the SHA-1 fingerprint after the first build and add it back to this key.

##### Enable Billing (Required for Production)

1. **Visit**: https://console.cloud.google.com/billing
2. **Link Billing Account** to your project
3. **Set Budget Alert**: $50/month (to avoid surprises)
4. **Note**: $200/month free credit covers most small apps

#### Step 4.3: Set EAS Secrets

EAS Secrets are encrypted environment variables for builds.

##### Development/Staging Secrets

```bash
cd apps/mobile

# Clerk - Staging (can use dev keys initially)
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING --value "pk_test_..." --type string

# Google Maps - Staging (can use dev keys initially)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_STAGING --value "YOUR_DEV_KEY" --type string

# API URL - Staging
eas secret:create --scope project --name EXPO_PUBLIC_API_URL_STAGING --value "https://nv-internal-api.vercel.app" --type string
```

##### Production Secrets

```bash
# Clerk - Production
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_PRODUCTION --value "pk_live_..." --type string

# Google Maps - Production (iOS)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY_PRODUCTION --value "YOUR_IOS_PROD_KEY" --type string

# Google Maps - Production (Android)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY_PRODUCTION --value "YOUR_ANDROID_PROD_KEY" --type string

# API URL - Production
eas secret:create --scope project --name EXPO_PUBLIC_API_URL_PRODUCTION --value "https://nv-internal-api.vercel.app" --type string
```

##### Verify Secrets

```bash
# List all secrets
eas secret:list

# Should see:
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_PRODUCTION
# EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_STAGING
# EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY_PRODUCTION
# EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY_PRODUCTION
# EXPO_PUBLIC_API_URL_STAGING
# EXPO_PUBLIC_API_URL_PRODUCTION
```

#### Step 4.4: Update Mobile App to Use Environment-Specific Keys

We need to update `app.json` to use different keys based on the build profile.

**Current issue**: `app.json` uses `process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` which doesn't exist.

**Solution**: Create `app.config.ts` for dynamic configuration.

---

## EAS Build Configuration

### Phase 5: Create `eas.json`

Create `apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 13.2.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "buildConfiguration": "Debug"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_ENV": "development",
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_...",
        "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY": "YOUR_DEV_KEY",
        "EXPO_PUBLIC_API_URL": "http://localhost:3000"
      }
    },
    "staging": {
      "distribution": "internal",
      "channel": "staging",
      "ios": {
        "buildConfiguration": "Release",
        "bundleIdentifier": "vn.dienlanhnamviet.internal"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "env": {
        "EXPO_PUBLIC_ENV": "staging"
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release",
        "bundleIdentifier": "vn.dienlanhnamviet.internal"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "channel": "production",
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release",
        "bundleIdentifier": "vn.dienlanhnamviet.internal"
      },
      "android": {
        "buildType": "aab",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "PLACEHOLDER",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  },
  "update": {
    "staging": {
      "channel": "staging"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

**Key Configuration Explained**:

- **`appVersionSource: "remote"`**: EAS manages build numbers automatically
- **`autoIncrement: true`**: Build numbers auto-increment (256 → 257 → 258)
- **`channel`**: OTA update channels (staging/production)
- **`distribution`**:
  - `internal`: Ad-hoc/internal testing
  - `store`: App Store/Play Store builds
- **Android `buildType`**:
  - `apk`: For staging/testing (larger file, easy to install)
  - `aab`: For production (smaller, required by Play Store)

### Phase 6: Create `app.config.ts` for Dynamic Configuration

Replace `apps/mobile/app.json` with `apps/mobile/app.config.ts`:

```typescript
import { ExpoConfig, ConfigContext } from "@expo/config";

const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENV === "production";
const IS_STAGING = process.env.EXPO_PUBLIC_ENV === "staging";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Nam Việt Internal",
  slug: "nv-internal",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "nv-internal",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "vn.dienlanhnamviet.internal",
    config: {
      googleMapsApiKey: IS_PRODUCTION
        ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY_PRODUCTION
        : process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_STAGING ||
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.",
      NSCameraUsageDescription:
        "Nam Việt Internal cần quyền truy cập máy ảnh để chụp ảnh công việc và đính kèm vào nhiệm vụ.",
      NSPhotoLibraryUsageDescription:
        "Nam Việt Internal cần quyền truy cập thư viện ảnh để đính kèm ảnh vào nhiệm vụ.",
    },
  },
  android: {
    package: "vn.dienlanhnamviet.internal",
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
    ],
    config: {
      googleMaps: {
        apiKey: IS_PRODUCTION
          ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY_PRODUCTION
          : process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_STAGING ||
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "expo-font",
    "expo-asset",
    "expo-video",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Nam Việt Internal cần quyền truy cập thư viện ảnh để đính kèm ảnh vào nhiệm vụ.",
        cameraPermission:
          "Nam Việt Internal cần quyền truy cập máy ảnh để chụp ảnh công việc.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "efc85258-12ce-4f6a-826a-ab5765d18ebc",
    },
  },
  owner: "duongdev",
  updates: {
    url: "https://u.expo.dev/efc85258-12ce-4f6a-826a-ab5765d18ebc",
  },
  runtimeVersion: {
    policy: "appVersion", // OTA updates only work for same app version
  },
});
```

**Important Changes**:

1. ✅ App name: "Nam Việt Internal"
2. ✅ Bundle IDs: `vn.dienlanhnamviet.internal`
3. ✅ Dynamic Google Maps API keys based on environment
4. ✅ Vietnamese permission descriptions
5. ✅ EAS Update configuration for OTA
6. ✅ Runtime version policy

---

## Git Branching Workflow

### Phase 7: Set Up Git Branches

#### Step 7.1: Create `develop` Branch

```bash
# From main branch
git checkout main
git pull origin main

# Create develop branch
git checkout -b develop
git push -u origin develop
```

#### Step 7.2: Update Vercel Deployment Settings

1. **Visit**: https://vercel.com/duongdev/nv-internal-api/settings/git
2. **Production Branch**: Set to `main` (default)
3. **Enable Auto-Deploy**: ✅ Checked (deploys on every push to main)
4. **Preview Branches**: ✅ Enable for `develop` (creates preview deployments)

#### Step 7.3: Branching Strategy

```
main (production)
  ↑
  └── develop (staging)
        ↑
        └── feature/* (feature branches)
```

**Workflow**:

1. **Feature Development**:

   ```bash
   git checkout develop
   git checkout -b feature/task-comments
   # ... make changes ...
   git commit -m "feat: add task comments"
   git push origin feature/task-comments
   ```

2. **Merge to Develop** (via PR):
   - Creates Vercel preview deployment
   - Test on preview URL
   - Merge when ready

3. **Release to Production**:

   ```bash
   git checkout main
   git merge develop
   git push origin main
   # This triggers Vercel production deployment
   ```

4. **Tag Releases** (optional but recommended):
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

---

## Google Maps API Production Setup

### Phase 8: Configure Production API Keys

#### Step 8.1: Get Android SHA-1 Fingerprint

After your first production Android build, you need to add the SHA-1 fingerprint to your API key restrictions.

**Option A: From EAS Build Credentials**

```bash
cd apps/mobile

# List credentials
eas credentials

# Select Android → Production → Keystore
# Copy SHA-1 fingerprint
```

**Option B: From First Build Output**

After running your first production Android build, the output will include:

```
✔ Build successful
  SHA-1 Fingerprint: A1:B2:C3:D4:E5:F6:...
```

#### Step 8.2: Add SHA-1 to Android API Key

1. **Visit**: https://console.cloud.google.com/apis/credentials
2. **Select**: "Nam Việt Internal - Android Production" API key
3. **Edit Restrictions**:
   - Application restrictions → Android apps
   - Click **"Add package name and fingerprint"**
   - Package name: `vn.dienlanhnamviet.internal`
   - SHA-1 fingerprint: Paste from Step 8.1
4. **Save**

#### Step 8.3: Verify API Key Restrictions

**iOS Key Restrictions**:

- ✅ iOS bundle ID: `vn.dienlanhnamviet.internal`
- ✅ APIs: Maps SDK for iOS, Places API

**Android Key Restrictions**:

- ✅ Package name: `vn.dienlanhnamviet.internal`
- ✅ SHA-1 fingerprint: (from build)
- ✅ APIs: Maps SDK for Android, Places API

#### Step 8.4: Set Up Billing Alerts

1. **Visit**: https://console.cloud.google.com/billing/budgets
2. **Create Budget**:
   - Name: "Maps API Budget Alert"
   - Amount: $50/month
   - Threshold: 50%, 90%, 100%
   - Email: Your email
3. **Save**

**Note**: With $200/month free credit, you're unlikely to pay unless you exceed ~25,000 map loads/month.

---

## Third-Party Services Configuration

### Phase 9: Production Service Setup

#### Step 9.1: Vercel API Deployment (Already Configured)

Your API is already set up to auto-deploy on `main` branch pushes. No changes needed.

**Production URL**: `https://nv-internal-api.vercel.app`

#### Step 9.2: Vercel Blob Storage - Dev/Prod Separation

Update your API storage service to use path prefixes.

**File**: `apps/api/src/services/storage.service.ts` (or wherever storage logic is)

Add environment-based prefix:

```typescript
// Get environment prefix
const ENV_PREFIX = process.env.NODE_ENV === "production" ? "prod" : "dev";

// When uploading files
const blobPath = `${ENV_PREFIX}/attachments/${filename}`;

// Example:
// Development: dev/attachments/photo-123.jpg
// Production: prod/attachments/photo-123.jpg
```

**Environment Variable**:
Add to `apps/api/.env` and Vercel environment variables:

```bash
NODE_ENV=production  # Set in Vercel production environment
```

#### Step 9.3: Clerk Production Instance

Already created in Phase 4. Verify:

1. **Visit**: https://dashboard.clerk.com/
2. **Select**: "Nam Việt Internal (Production)"
3. **Verify Settings**:
   - ✅ Sign-in methods match development
   - ✅ User metadata fields configured
   - ✅ Webhooks (if used) point to production API
4. **Copy production keys** to Vercel environment variables

#### Step 9.4: Neon Database Production

Verify production database is ready:

```bash
# Test connection from local
cd apps/api

# Update .env with production DATABASE_URL temporarily
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/nvinternal?sslmode=require"

# Run migration check
npx prisma migrate status

# Should show all migrations applied
```

**Important**: Do NOT run `prisma migrate dev` on production. Use `prisma migrate deploy` instead.

#### Step 9.5: Set Vercel Production Environment Variables

1. **Visit**: https://vercel.com/duongdev/nv-internal-api/settings/environment-variables
2. **Add Production Variables**:

| Variable                | Value                    | Environment |
| ----------------------- | ------------------------ | ----------- |
| `DATABASE_URL`          | Your Neon production URL | Production  |
| `CLERK_SECRET_KEY`      | `sk_live_...`            | Production  |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_...`            | Production  |
| `STORAGE_PROVIDER`      | `vercel-blob`            | Production  |
| `BLOB_READ_WRITE_TOKEN` | Your Vercel Blob token   | Production  |
| `NODE_ENV`              | `production`             | Production  |

3. **Redeploy** after adding variables:
   ```bash
   git commit --allow-empty -m "chore: trigger redeploy"
   git push origin main
   ```

---

## Build & Deploy Workflow

### Phase 10: Manual Build Process

#### Step 10.1: Pre-Build Checklist

Before triggering a build:

- [ ] All environment variables configured in EAS
- [ ] `app.config.ts` merged to `main`/`develop`
- [ ] `eas.json` committed
- [ ] Version bumped in `app.config.ts` (if new version)
- [ ] Code tested locally
- [ ] API deployed to production (if backend changes)

#### Step 10.2: Trigger Production Build (Manual via CLI)

**iOS Production Build**:

```bash
cd apps/mobile

# Build for App Store
eas build --platform ios --profile production

# EAS will:
# 1. Auto-increment build number (e.g., 256 → 257)
# 2. Use production environment variables
# 3. Create production bundle ID
# 4. Generate .ipa file
# 5. Upload to EAS servers

# Build completes in ~15-20 minutes
# You'll receive email when done
```

**Android Production Build**:

```bash
cd apps/mobile

# Build AAB for Play Store
eas build --platform android --profile production

# EAS will:
# 1. Auto-increment build number
# 2. Use production environment variables
# 3. Create production package name
# 4. Generate .aab file (Android App Bundle)
# 5. Upload to EAS servers

# Build completes in ~10-15 minutes
```

**Build Both Platforms**:

```bash
# Build both in parallel
eas build --platform all --profile production

# Saves time - builds run simultaneously
```

#### Step 10.3: Download Build Artifacts (Optional)

```bash
# List builds
eas build:list

# Download specific build
eas build:download --id <BUILD_ID>

# This downloads the .ipa (iOS) or .aab (Android) to local machine
```

---

## OTA Updates Strategy

### Phase 11: Over-the-Air Updates

OTA updates allow you to push JavaScript/React changes without going through app store review.

#### Step 11.1: When to Use OTA vs App Store Update

**✅ Safe for OTA** (no app store review needed):

- Bug fixes in JavaScript code
- UI/UX changes
- Business logic updates
- Text/copy changes
- API endpoint changes
- New screens (pure React Native)

**❌ Requires App Store Update**:

- Native module version changes (e.g., `expo-location@18.0.0` → `19.0.0`)
- New iOS/Android permissions
- Changes to `app.config.ts` native config
- Expo SDK upgrades
- Native code modifications

#### Step 11.2: Create GitHub Actions Workflow for OTA

Create `.github/workflows/eas-update.yml`:

```yaml
name: EAS Update

on:
  workflow_dispatch:
    inputs:
      channel:
        description: "Update channel (staging or production)"
        required: true
        type: choice
        options:
          - staging
          - production
      message:
        description: "Update message"
        required: true
        type: string

jobs:
  update:
    name: EAS Update
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: |
          cd apps/mobile
          pnpm install

      - name: Publish update
        run: |
          cd apps/mobile
          eas update --branch ${{ github.event.inputs.channel }} --message "${{ github.event.inputs.message }}"
        env:
          EXPO_PUBLIC_ENV: ${{ github.event.inputs.channel }}

      - name: Notify
        run: |
          echo "✅ OTA update published to ${{ github.event.inputs.channel }} channel"
          echo "Message: ${{ github.event.inputs.message }}"
```

#### Step 11.3: Set Up GitHub Secrets

```bash
# Get Expo token
eas whoami
# Follow instructions to create access token
# Visit: https://expo.dev/accounts/[account]/settings/access-tokens

# Add to GitHub Secrets:
# Settings → Secrets and variables → Actions → New repository secret
# Name: EXPO_TOKEN
# Value: [your token]
```

#### Step 11.4: Publish OTA Update

**Via GitHub Actions** (recommended):

1. Go to **Actions** tab in GitHub
2. Select **"EAS Update"** workflow
3. Click **"Run workflow"**
4. Choose:
   - **Channel**: `staging` or `production`
   - **Message**: "Fix task comment photo upload bug"
5. Click **"Run workflow"**

**Via CLI** (alternative):

```bash
cd apps/mobile

# Publish to staging
eas update --branch staging --message "Fix photo upload"

# Publish to production
eas update --branch production --message "Fix critical bug"
```

#### Step 11.5: Verify OTA Update

```bash
# View recent updates
eas update:list --branch production

# Should show:
# ✔ Update ID: abc-123
#   Message: Fix task comment photo upload bug
#   Published: 2 minutes ago
#   Runtime version: 1.0.0
```

**User Impact**:

- Users with internet connection get update on next app restart
- No app store review (updates in minutes vs days)
- Works only for same runtime version (1.0.0 updates 1.0.0 users)

---

## App Store Submission

### Phase 12: iOS App Store Submission

#### Step 12.1: Create App in App Store Connect

1. **Visit**: https://appstoreconnect.apple.com/apps
2. **Click**: "+" (Add App)
3. **Fill in**:
   - **Platform**: iOS
   - **Name**: "Nam Việt Internal"
   - **Primary Language**: Vietnamese
   - **Bundle ID**: `vn.dienlanhnamviet.internal` (select from dropdown)
   - **SKU**: `nv-internal` (unique identifier, not shown to users)
4. **Click**: "Create"

#### Step 12.2: Prepare App Store Listing

**Required Screenshots** (use simulator or real device):

- **6.7" Display (iPhone 15 Pro Max)**: 1290 x 2796 pixels (at least 1)
- **6.5" Display (iPhone 14 Plus)**: 1284 x 2778 pixels
- **5.5" Display (iPhone 8 Plus)**: 1242 x 2208 pixels

**Tip**: Use Expo's screenshot tool or Xcode simulator.

**App Information**:

- **Category**: Productivity / Business
- **Content Rights**: Does not contain third-party content
- **Age Rating**: 4+ (unless your app has specific content)

**Description** (Vietnamese):

```
Nam Việt Internal là ứng dụng quản lý công việc nội bộ dành cho nhân viên Điện Lạnh Nam Việt.

Tính năng chính:
• Quản lý nhiệm vụ và phân công công việc
• Check-in/Check-out với xác minh GPS
• Đính kèm ảnh và video vào công việc
• Theo dõi tiến độ và báo cáo
• Thanh toán và hóa đơn

Ứng dụng dành riêng cho nhân viên của Điện Lạnh Nam Việt.
```

**Keywords** (Vietnamese):

```
quản lý công việc, điện lạnh, nam việt, nhiệm vụ, check-in
```

**Support URL**: Your company website or support email

**Privacy Policy URL**: Required by Apple

- Create a simple privacy policy (can use template)
- Host on GitHub Pages or company website
- Example: `https://github.com/yourusername/nv-internal/blob/main/PRIVACY.md`

#### Step 12.3: Submit Build to App Store Connect

**Via EAS Submit** (recommended):

```bash
cd apps/mobile

# Submit to App Store Connect
eas submit --platform ios --profile production

# EAS will:
# 1. Prompt for Apple ID credentials (if not in eas.json)
# 2. Upload .ipa to App Store Connect
# 3. Process the build (takes 5-10 minutes)

# You'll receive email when build is processed
```

**Via Manual Upload** (alternative):

1. Download .ipa from EAS dashboard
2. Open **Transporter** app (Mac App Store)
3. Sign in with Apple ID
4. Drag .ipa into Transporter
5. Click "Deliver"

#### Step 12.4: Configure TestFlight

1. **In App Store Connect**, go to **TestFlight** tab
2. **Build should appear** under "iOS Builds" (after processing)
3. **Click build** → **Provide Export Compliance**:
   - Does your app use encryption? **No** (unless you added custom encryption)
   - Click "Start Internal Testing"

#### Step 12.5: Add TestFlight Testers

1. **TestFlight** → **Internal Testing** → **App Store Connect Users**
2. **Add users**:
   - Click "+"
   - Add email addresses of team members
   - They'll receive TestFlight invitation
3. **External Testing** (optional, requires Apple review):
   - Add up to 10,000 external testers
   - Requires beta app review (2-3 days)

#### Step 12.6: Distribute via TestFlight

Testers will:

1. Receive email invitation
2. Download **TestFlight** app from App Store
3. Tap invitation link → Install "Nam Việt Internal"
4. Provide feedback via TestFlight

**Gather Feedback** (1-2 weeks recommended):

- Test all features
- Check GPS check-in/check-out
- Verify photo uploads
- Test on different devices

#### Step 12.7: Submit for App Store Review

After TestFlight testing:

1. **App Store Connect** → **App Store** tab → **+ Version** (1.0.0)
2. **Fill in all required fields**:
   - Screenshots (upload from simulator)
   - Description, keywords, support URL
   - Privacy policy URL
   - Age rating
3. **Select build** to submit
4. **App Review Information**:
   - Sign-in required: **Yes**
   - Demo account: Provide test credentials
   - Notes: "Internal app for Điện Lạnh Nam Việt employees"
5. **Click**: "Add for Review"
6. **Click**: "Submit for Review"

**Review Timeline**:

- Typical: 24-48 hours
- Can be longer during holidays

**Common Rejection Reasons**:

- Missing privacy policy
- Insufficient demo account access
- Crashes during review
- Missing screenshots

**After Approval**:

- App goes live automatically (or on your chosen date)
- Can manually release via "Release this version"

---

### Phase 13: Android Play Store Submission

#### Step 13.1: Create App in Play Console

1. **Visit**: https://play.google.com/console/
2. **Click**: "Create app"
3. **Fill in**:
   - **App name**: "Nam Việt Internal"
   - **Default language**: Vietnamese
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**:
     - ✅ Developer Program Policies
     - ✅ US export laws
4. **Click**: "Create app"

#### Step 13.2: Set Up App Content

**Dashboard → Policy → App content**:

1. **Privacy policy**: Same URL as iOS
2. **App access**:
   - ✅ "All or some functionality is restricted"
   - Provide test credentials
3. **Ads**: No ads
4. **Content ratings**:
   - Complete questionnaire
   - Should get "Everyone" or "Teen" rating
5. **Target audience**: 18+
6. **News app**: No
7. **COVID-19 contact tracing**: No
8. **Data safety**:
   - Collect: Location, Photos, User account info
   - Purpose: App functionality
   - Encryption in transit: Yes
   - Users can request data deletion: Yes (via support email)

#### Step 13.3: Prepare Store Listing

**Dashboard → Grow → Store presence → Main store listing**:

**Screenshots** (at least 2 per type):

- **Phone**: 1080 x 1920 to 1080 x 2340 pixels
- **7" Tablet**: 1024 x 1920 to 1024 x 2340 pixels (optional)
- **10" Tablet**: 1200 x 2000 to 1200 x 2340 pixels (optional)

**App Icon**: 512 x 512 pixels (PNG, no transparency)

**Feature Graphic**: 1024 x 500 pixels (JPG or PNG)

**Description** (same as iOS, Vietnamese):

```
Nam Việt Internal là ứng dụng quản lý công việc nội bộ dành cho nhân viên Điện Lạnh Nam Việt.
...
```

**Category**: Productivity

**Contact details**:

- Email: support@yourcompany.com
- Phone: (optional)
- Website: (optional)

#### Step 13.4: Upload AAB to Internal Testing

1. **Dashboard → Release → Testing → Internal testing**
2. **Click**: "Create new release"
3. **Upload AAB**:

   **Via EAS Submit**:

   ```bash
   cd apps/mobile

   # Submit to Play Console (internal track)
   eas submit --platform android --profile production

   # Follow prompts to create service account (first time only)
   ```

   **Via Manual Upload**:
   - Download .aab from EAS dashboard
   - Click "Upload" → Select .aab file

4. **Release name**: "1.0.0 (256)" (auto-filled from AAB)
5. **Release notes** (Vietnamese):
   ```
   Phiên bản đầu tiên của Nam Việt Internal:
   • Quản lý nhiệm vụ
   • Check-in/Check-out GPS
   • Đính kèm ảnh/video
   • Báo cáo nhân viên
   ```
6. **Click**: "Save" → "Review release" → "Start rollout to Internal testing"

#### Step 13.5: Add Internal Testers

1. **Internal testing** → **Testers**
2. **Create email list**:
   - Name: "Nam Việt Team"
   - Add emails: team@example.com, developer@example.com
3. **Save**
4. **Copy testing link** and share with testers

**Testers will**:

1. Click testing link on Android device
2. Tap "Download it on Google Play"
3. Install app
4. Provide feedback

#### Step 13.6: Submit for Production Review

After internal testing (1-2 weeks):

1. **Dashboard → Release → Production**
2. **Click**: "Create new release"
3. **Promote from internal testing**:
   - Select your 1.0.0 build
   - Or upload same AAB again
4. **Countries**: Select Vietnam (or all countries)
5. **Release notes**: Same as internal testing
6. **Review release** → **Start rollout to Production**

**Review Timeline**:

- Typical: 1-3 days (faster than iOS)
- First release can take up to 7 days

**After Approval**:

- App goes live automatically
- Available in Play Store within 2-4 hours

---

## Post-Launch Monitoring

### Phase 14: Monitor App Performance

#### Step 14.1: Set Up Monitoring

**App Store Connect** (iOS):

- **Analytics**: Daily active users, sessions, crashes
- **TestFlight**: Beta feedback
- **Ratings & Reviews**: Monitor user feedback

**Play Console** (Android):

- **Statistics**: Installs, uninstalls, crashes
- **Ratings & Reviews**: User feedback
- **Pre-launch reports**: Automated testing results

#### Step 14.2: Crash Reporting

You already have **Sentry** integrated (from `apps/mobile/package.json`):

**Verify Sentry is configured**:

1. Check `apps/mobile/app/_layout.tsx` for Sentry initialization
2. If not configured, add:

   ```typescript
   import * as Sentry from "@sentry/react-native";

   Sentry.init({
     dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
     environment: process.env.EXPO_PUBLIC_ENV,
     enableAutoSessionTracking: true,
     tracesSampleRate: 1.0,
   });
   ```

3. **Set Sentry DSN** in EAS secrets:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://..." --type string
   ```

**Alternative**: Use **PostHog** (as mentioned in CLAUDE.md) for combined analytics + error tracking.

#### Step 14.3: Analytics

**Recommended**: PostHog (from your enhancement plan `.claude/enhancements/20251031-posthog-observability-implementation.md`)

**Set up PostHog**:

1. Create account: https://posthog.com/
2. Create project: "Nam Việt Internal - Mobile"
3. Get API key
4. Add to mobile app (follow enhancement plan)

**Track key events**:

- App opens
- Task check-ins
- Photo uploads
- User sessions
- Feature usage

---

## Future Optimizations

### Phase 15: Cost Optimization (After Launch)

#### Option 1: Migrate to GitHub Actions for Builds

When you exceed EAS free tier (30 builds/month):

**Benefits**:

- Unlimited free builds (open source repo)
- Full control over build environment
- Same output (.ipa/.aab) as EAS

**Drawbacks**:

- More complex setup (code signing, credentials)
- Longer build times (~20-30 min vs 10-15 min)
- Manual credential management

**Implementation**:

- See: `.github/workflows/eas-build.yml` (create later)
- Guide: https://docs.expo.dev/build-reference/local-builds/
- Use `eas build --local` to test locally first

#### Option 2: Optimize OTA Updates

**Current**: Manual OTA via GitHub Actions
**Optimization**: Automatic OTA on merge to `main`

**Create**: `.github/workflows/auto-ota.yml`

```yaml
name: Auto OTA Update

on:
  push:
    branches:
      - main
    paths:
      - "apps/mobile/**"
      - "!apps/mobile/app.config.ts" # Exclude native changes

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      # ... same as manual OTA workflow ...
      - run: eas update --branch production --message "Auto-deploy from main"
```

**Risk**: Auto-deploys every merge (may not want this)
**Mitigation**: Use `workflow_dispatch` for manual control

#### Option 3: Multi-Region Deployment

If your user base grows beyond Vietnam:

**Vercel**: Already multi-region (automatic)
**EAS Update**: CDN-based (automatic)
**Neon**: Add read replicas in other regions

---

## Secrets Management Best Practices

### Phase 16: Security for Public Repo

Since your repo is public, follow these guidelines:

#### Step 16.1: Never Commit Secrets

**Already gitignored** (verify):

```bash
# Check .gitignore includes:
.env
.env.local
.env.production
*.keystore
*.p12
*.mobileprovision
google-play-service-account.json
```

#### Step 16.2: Use Environment Variables

**For mobile app**:

- ✅ EAS Secrets (encrypted)
- ❌ Never in `app.config.ts` or `eas.json`

**For API**:

- ✅ Vercel environment variables
- ❌ Never in `.env` committed to repo

#### Step 16.3: Rotate Keys Periodically

**Every 6 months**:

- Regenerate Clerk production keys
- Rotate Google Maps API keys
- Update Vercel Blob tokens

#### Step 16.4: Limit API Key Restrictions

**Google Maps**:

- ✅ Restrict by bundle ID/package name
- ✅ Restrict to specific APIs
- ✅ Set usage quotas

**Clerk**:

- ✅ Enable bot detection
- ✅ Rate limiting
- ✅ IP restrictions (if applicable)

---

## Quick Reference Commands

### Build Commands

```bash
# Development builds
eas build --platform ios --profile development
eas build --platform android --profile development

# Staging builds (internal testing)
eas build --platform ios --profile staging
eas build --platform android --profile staging

# Production builds (app store)
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all --profile production  # Both platforms

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

### OTA Update Commands

```bash
# Via GitHub Actions (recommended)
# Go to Actions tab → "EAS Update" → Run workflow

# Via CLI
eas update --branch staging --message "Bug fix"
eas update --branch production --message "Critical fix"

# List updates
eas update:list --branch production
```

### Version Management

```bash
# Update version in app.config.ts
# EAS auto-increments build number

# Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

## Checklist: Ready to Go Live

### Pre-Launch Checklist

#### Accounts

- [ ] Apple Developer Account created and verified
- [ ] Google Play Console account created and verified
- [ ] Team ID copied from Apple Developer account
- [ ] Play Console service account created (for EAS Submit)

#### Configuration

- [ ] `app.config.ts` created with production bundle IDs
- [ ] `eas.json` created and committed
- [ ] Production environment variables set in EAS Secrets
- [ ] Production API deployed to Vercel
- [ ] Production database migrations applied

#### Third-Party Services

- [ ] Clerk production instance created
- [ ] Production Google Maps API keys created (iOS + Android)
- [ ] API key restrictions configured
- [ ] Vercel Blob storage configured with dev/prod prefixes
- [ ] Billing alerts set up for Google Maps API

#### Git & CI/CD

- [ ] `develop` branch created
- [ ] Vercel connected to `main` (production) and `develop` (preview)
- [ ] GitHub Actions workflow for OTA updates created
- [ ] `EXPO_TOKEN` added to GitHub Secrets

#### Testing

- [ ] App tested on physical iOS device
- [ ] App tested on physical Android device
- [ ] GPS check-in/check-out verified with production keys
- [ ] Photo upload tested with production blob storage
- [ ] Authentication tested with production Clerk instance

#### Store Listings

- [ ] App Store Connect app created
- [ ] Play Console app created
- [ ] Screenshots prepared (iOS + Android)
- [ ] App descriptions written (Vietnamese)
- [ ] Privacy policy created and hosted
- [ ] Support email configured

#### Builds

- [ ] First iOS production build successful
- [ ] First Android production build successful
- [ ] SHA-1 fingerprint added to Android API key
- [ ] TestFlight build uploaded and processed
- [ ] Play Console internal testing build uploaded

#### Documentation

- [ ] README updated with production deployment info
- [ ] Team trained on OTA update process
- [ ] Monitoring dashboards set up (Sentry/PostHog)
- [ ] Support process documented

---

## Timeline Estimate

### Week 1: Setup

- **Day 1-2**: Create Apple & Google accounts (wait for approval)
- **Day 3-4**: Configure EAS, create production keys
- **Day 5-7**: Update app config, set environment variables

### Week 2: Testing

- **Day 8-10**: Build staging versions, internal testing
- **Day 11-12**: Fix bugs found in testing
- **Day 13-14**: Build production versions

### Week 3: Submission

- **Day 15-16**: Create store listings, upload screenshots
- **Day 17**: Submit to TestFlight (iOS) and internal testing (Android)
- **Day 18-21**: Gather feedback from beta testers

### Week 4: Review & Launch

- **Day 22-23**: Fix issues from beta testing
- **Day 24**: Submit for App Store and Play Store review
- **Day 25-28**: Wait for approval (iOS: 1-2 days, Android: 1-3 days)
- **Day 29-30**: Launch! 🚀

**Total**: ~4 weeks from start to public release

---

## Support & Resources

### Official Documentation

- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/
- **EAS Update**: https://docs.expo.dev/eas-update/introduction/
- **App Store Connect**: https://developer.apple.com/app-store-connect/
- **Play Console**: https://support.google.com/googleplay/android-developer/

### Troubleshooting

- **EAS Build Issues**: https://docs.expo.dev/build-reference/troubleshooting/
- **iOS Code Signing**: https://docs.expo.dev/app-signing/managed-credentials/
- **Android Signing**: https://docs.expo.dev/app-signing/android-credentials/

### Community

- **Expo Forums**: https://forums.expo.dev/
- **Discord**: https://chat.expo.dev/

---

## Next Steps

1. **Review this plan** thoroughly
2. **Create Apple Developer Account** (start ASAP - 1-2 days approval)
3. **Create Google Play Console Account** (1 day approval)
4. **Follow Phase 1-16** in order
5. **Test everything** before submitting to stores
6. **Launch!** 🎉

Questions or issues? Refer to the troubleshooting section or reach out to Expo support.

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-01
**Next Review**: After first production launch
