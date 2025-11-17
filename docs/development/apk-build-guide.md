# APK Build Guide

Guide for building Android APK files for direct distribution (instead of AAB for Play Store).

## Overview

APK (Android Package) files can be directly installed on Android devices, making them ideal for:
- Internal testing and QA
- Distribution to users outside the Play Store
- Beta testing with stakeholders
- Quick iterations without Play Store review delays

## Build Configurations

### EAS Build Profiles

**`production-apk`** - Production-ready APK with all production settings
- Environment: Production
- API URL: `https://nv-internal-api.vercel.app`
- PostHog enabled
- Signed with release keystore
- Distribution: Internal (downloadable from EAS)

**`preview`** - Preview APK for testing
- Environment: Staging
- API URL: `https://nv-internal-staging.vercel.app`
- PostHog enabled
- Signed with release keystore
- Distribution: Internal

**`staging`** - Staging APK
- Environment: Staging
- API URL: `https://nv-internal-staging.vercel.app`
- PostHog enabled
- Signed with release keystore
- Distribution: Internal

## Building APKs

### Option 1: EAS Build (Recommended)

Build APKs using EAS (Expo Application Services):

```bash
# Production APK (from apps/mobile/)
pnpm build:apk:production

# Or use EAS CLI directly
eas build --platform android --profile production-apk

# Preview APK for testing
eas build --platform android --profile preview

# Local build (build on your machine)
pnpm build:apk:local
```

**Advantages:**
- ✅ Cloud-based (no local setup required)
- ✅ Consistent build environment
- ✅ Automatic version increment
- ✅ Build artifacts stored in EAS
- ✅ All environment variables from EAS secrets

**Process:**
1. EAS builds the APK in the cloud
2. Download from EAS dashboard or CLI
3. Share the APK file directly with users

### Option 2: GitHub Actions Workflow

Trigger APK builds via GitHub Actions:

```bash
# Via GitHub UI:
# 1. Go to Actions tab
# 2. Select "Build & Deploy to TestFlight/Play Store"
# 3. Click "Run workflow"
# 4. Choose:
#    - Platform: android
#    - Environment: production
#    - Submit: false
#    - Build format: apk

# Download artifacts from GitHub Actions after build completes
```

**Advantages:**
- ✅ Automated CI/CD
- ✅ All secrets from GitHub Secrets
- ✅ Build artifacts stored in GitHub
- ✅ Can be triggered automatically on events

**Environment Variables (all from GitHub Secrets):**
- `EXPO_PUBLIC_ENV`
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID`
- `EXPO_PUBLIC_POSTHOG_API_KEY`
- `EXPO_PUBLIC_POSTHOG_ENABLED`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

### Option 3: Local Fastlane Build

Build APK locally using Fastlane (requires full setup):

```bash
# From apps/mobile/
cd apps/mobile

# Set required environment variables
export BUILD_NUMBER="123"
export ANDROID_KEYSTORE_PASSWORD="your-keystore-password"
export ANDROID_KEY_ALIAS="nv-internal"
export ANDROID_KEY_PASSWORD="your-key-password"
export EXPO_PUBLIC_ENV="production"
export EXPO_PUBLIC_API_URL="https://nv-internal-api.vercel.app"
export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
export EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS="..."
export EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID="..."
export EXPO_PUBLIC_POSTHOG_API_KEY="..."
export EXPO_PUBLIC_POSTHOG_ENABLED="true"

# Run Fastlane build
bundle exec fastlane android build_apk

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

**Requirements:**
- Android SDK installed
- Java 17 installed
- Keystore file: `@duongdev__nv-internal.jks`
- All environment variables set
- Node.js 22.x
- pnpm installed

## Distributing APKs

### Method 1: Direct Download from EAS

After building with EAS:

```bash
# Get build URL
eas build:list --platform android --limit 1

# Or download directly
eas build:download --platform android --latest
```

Share the download link or APK file with users.

### Method 2: Download from GitHub Actions

After GitHub Actions build:

1. Go to the workflow run
2. Scroll to "Artifacts" section
3. Download `android-build-apk-{build_number}`
4. Extract and share the APK file

### Method 3: Internal Testing Track (Play Store)

Upload APK to Play Store internal testing track:

1. Build APK using any method above
2. Upload to Play Console > Internal Testing
3. Add testers via email
4. Share internal testing link

## Installation Instructions for Users

**Android Device:**

1. **Enable Unknown Sources**:
   - Go to Settings > Security
   - Enable "Unknown Sources" or "Install unknown apps"

2. **Download APK**:
   - Download the APK file from the provided link
   - Save to device storage

3. **Install**:
   - Open the APK file from Downloads
   - Tap "Install"
   - Grant any requested permissions

4. **Launch**:
   - Open "Nam Việt Internal" app

**Note:** Users may see a warning about installing from unknown sources - this is normal for APKs outside the Play Store.

## APK vs AAB

| Feature | APK | AAB |
|---------|-----|-----|
| **Distribution** | Direct install | Play Store only |
| **File Size** | Larger (contains all architectures) | Smaller (dynamic delivery) |
| **Use Case** | Testing, internal distribution | Production Play Store release |
| **Installation** | Manual (requires unknown sources) | Via Play Store |
| **Updates** | Manual reinstall | Automatic via Play Store |
| **Configuration** | All environments included | Play Store configuration |

## Build Configuration Details

### Environment Variables

APK builds use the **same environment configuration** as AAB builds:

**Production APK (`production-apk` profile):**
```json
{
  "EXPO_PUBLIC_ENV": "production",
  "EXPO_PUBLIC_API_URL": "https://nv-internal-api.vercel.app",
  "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_...",
  "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS": "...",
  "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID": "...",
  "EXPO_PUBLIC_POSTHOG_API_KEY": "...",
  "EXPO_PUBLIC_POSTHOG_ENABLED": "true"
}
```

**Preview APK (`preview` profile):**
```json
{
  "EXPO_PUBLIC_ENV": "staging",
  "EXPO_PUBLIC_API_URL": "https://nv-internal-staging.vercel.app",
  "EXPO_PUBLIC_POSTHOG_HOST": "https://app.posthog.com",
  "EXPO_PUBLIC_POSTHOG_ENABLED": "true"
}
```

### Signing Configuration

All APKs are signed with the **release keystore** (`@duongdev__nv-internal.jks`):
- Store password: From `ANDROID_KEYSTORE_PASSWORD` secret
- Key alias: From `ANDROID_KEY_ALIAS` secret (default: `nv-internal`)
- Key password: From `ANDROID_KEY_PASSWORD` secret

## Troubleshooting

### Build Fails: "Keystore not found"

**Solution:**
```bash
# Verify keystore exists
ls apps/mobile/@duongdev__nv-internal.jks

# If missing, restore from backup or regenerate
```

### APK Installation Blocked

**Solution:**
- Enable "Install from unknown sources" in Android settings
- Some devices require per-app permission (Settings > Apps > Chrome/Files > Install unknown apps)

### Environment Variables Not Set

**Solution:**
```bash
# Check GitHub Secrets are configured
gh secret list --repo $REPO

# Check EAS secrets
eas secret:list

# For local builds, source .env file
source .env.production
```

### Different Behavior than Play Store Build

**Cause:** APK and AAB use identical configurations. If behavior differs:
1. Check build profile in `eas.json`
2. Verify environment variables match
3. Check build logs for configuration differences

## Quick Reference

```bash
# EAS Builds
pnpm build:apk:production      # Production APK via EAS
pnpm build:apk:local           # Local preview APK
pnpm build:aab:production      # Production AAB for Play Store

# Download builds
eas build:download --platform android --latest

# List recent builds
eas build:list --platform android --limit 5

# GitHub Actions (manual trigger)
# Actions tab > "Build & Deploy" > Run workflow
# Select: platform=android, build_format=apk, submit=false
```

## Best Practices

1. **Use EAS for production APKs** - Ensures consistent environment and signing
2. **Include version info in filename** - e.g., `nvinternal-v1.2.3-build456.apk`
3. **Test APK before distributing** - Install on a fresh device to verify
4. **Document environment** - Note which environment (production/staging) the APK uses
5. **Expire old APKs** - Remove outdated APK links after new builds
6. **Use internal testing track** - For broader testing before full release

## Related Documentation

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android APK vs AAB](https://developer.android.com/guide/app-bundle)
- [GitHub Actions Workflows](../../.github/workflows/build-deploy.yml)
- [EAS Configuration](../../apps/mobile/eas.json)
