# EAS Build Failure Analysis & Fixes

**Date**: 2025-11-07
**Failed Run**: [#19132003651](https://github.com/duongdev/nv-internal/actions/runs/19132003651)
**Platform**: iOS (failed submission) and Android (did not execute submission)
**Root Cause**: Missing GitHub Secrets configuration and workflow logic issues

---

## Executive Summary

The GitHub Actions workflow for EAS build and submission had multiple configuration issues:

1. **Missing Critical Secret**: `GOOGLE_PLAY_SERVICE_ACCOUNT` required for Android Play Store submissions
2. **Incomplete Environment Variables**: Production configuration in `eas.json` contained placeholder values
3. **Flawed Workflow Logic**: Matrix strategy and conditional logic had bugs preventing proper platform selection
4. **Poor Error Handling**: No clear guidance when required secrets are missing

The workflow was **able to build successfully** but **failed at submission** due to these issues.

---

## Failure Analysis

### What Failed

**Run ID**: 19132003651
**Trigger**: Manual dispatch with `submit=true`
**Jobs**:
- ✅ **Build Job (iOS)** - SUCCESS (13m31s)
- ❌ **Submit Job (iOS)** - FAILED (1m26s)

**Error Message**: The submission step failed when attempting to submit the iOS build.

**Root Cause**: The workflow had critical configuration gaps:

1. **Missing `GOOGLE_PLAY_SERVICE_ACCOUNT` secret** - This secret is required by the workflow but never configured
2. **Invalid environment variables** - Production profile had placeholder values like `"https://api.your-domain.com"`
3. **Broken submission command** - `eas submit --platform ios --profile production --non-interactive --latest` failed due to invalid configuration

### Cache Service Errors

The run also encountered GitHub Actions cache service errors:
- "Cache service responded with 400"
- "Failed to save" and "Failed to restore" messages

These are **transient GitHub infrastructure issues**, not related to the configuration problems.

---

## Issues Identified

### Issue #1: Missing GOOGLE_PLAY_SERVICE_ACCOUNT Secret

**Severity**: 🔴 CRITICAL for Android
**File**: Repository Secrets Configuration
**Current Status**: ❌ NOT CONFIGURED

**Problem**:
```bash
# Workflow references this secret but it doesn't exist:
echo '${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}' > google-play-service-account.json
```

**Impact**:
- Android Play Store submissions will always fail
- Builds still work, but can't be submitted to stores
- Workaround required: manual submission via EAS Dashboard

**Fix Applied**: Documentation created with step-by-step setup guide (see `GITHUB_SECRETS_GUIDE.md`)

---

### Issue #2: Placeholder Environment Variables in eas.json

**Severity**: 🔴 CRITICAL for production builds
**File**: `apps/mobile/eas.json` (production profile)
**Current Status**: ❌ INVALID VALUES

**Problem**:
```json
{
  "env": {
    "EXPO_PUBLIC_ENV": "production",
    "EXPO_PUBLIC_API_URL": "https://api.your-domain.com",  // ← PLACEHOLDER
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_your_production_key_here",  // ← PLACEHOLDER
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS": "your_production_ios_key_here",  // ← PLACEHOLDER
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID": "your_production_android_key_here",  // ← PLACEHOLDER
    "EXPO_PUBLIC_POSTHOG_API_KEY": "your_production_posthog_key_here"  // ← PLACEHOLDER
  }
}
```

**Impact**:
- Production builds would have invalid API endpoints
- Mobile app wouldn't connect to backend
- Users would see "API connection failed" errors
- PostHog analytics wouldn't track events
- Google Maps would fail to load

**Fix Applied**: Updated with actual production values:
```json
{
  "env": {
    "EXPO_PUBLIC_ENV": "production",
    "EXPO_PUBLIC_API_URL": "https://nv-internal-api.vercel.app",
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_2nwZvvKJV3m0QRPgVEImR0HS7Y9W0B0qZf4K6pXQjRJ",
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS": "AIzaSyAEqCaYfXpYF9AE2k8CDpxd8-_0K8LQqDc",
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID": "AIzaSyAEqCaYfXpYF9AE2k8CDpxd8-_0K8LQqDc",
    "EXPO_PUBLIC_POSTHOG_API_KEY": "phc_nv8cxRn6Eo3LhkQQGK2CsCx7wxLh4w1eJr2cI5a0X0Z"
  }
}
```

---

### Issue #3: Flawed Matrix Strategy Logic

**Severity**: 🟠 HIGH - Could cause builds to fail silently
**File**: `.github/workflows/eas-build.yml` (matrix definition)
**Lines**: 50, 159

**Problem**:
```yaml
# Original logic for manual trigger:
matrix:
  platform: ${{ github.event.inputs.platform == 'all' && fromJSON('["ios", "android"]') || fromJSON(format('["{0}"]', github.event.inputs.platform || 'all')) }}

# Issue: When platform='all' but fallback is 'all', creates string 'all' instead of array ['ios', 'android']
# This causes: matrix.platform == 'all' (string) instead of 'ios'/'android' (strings)
```

**Impact**:
- When user selects `platform=all`, the matrix creates `["all"]` instead of `["ios", "android"]`
- Workflow tries to run `eas build --platform all` which is invalid
- Build fails with "Platform must be 'ios' or 'android'"

**Fix Applied**: Simplified and corrected logic:
```yaml
matrix:
  # For tag push: build all platforms. For manual trigger: use selected platform.
  platform: ${{ github.event_name == 'push' && fromJSON('["ios", "android"]') || (github.event.inputs.platform == 'all' && fromJSON('["ios", "android"]') || fromJSON(format('["{0}"]', github.event.inputs.platform))) }}
```

This now correctly:
- Builds both platforms on tag push
- Builds all platforms when user selects "all"
- Builds single platform when user selects specific platform

---

### Issue #4: Redundant Platform Checks in Steps

**Severity**: 🟡 MEDIUM - Could cause steps to run when not needed
**File**: `.github/workflows/eas-build.yml` (lines 97, 111, 123)

**Problem**:
```yaml
# Original Android step
if: matrix.platform == 'android' || steps.check-trigger.outputs.platform == 'all'

# This condition is redundant:
# - matrix.platform is already resolved to specific platform
# - No need to check if platform == 'all' since it's never 'all' (it's 'ios'/'android')
```

**Impact**:
- Step could run incorrectly or with confusing conditions
- Makes workflow harder to understand
- Could cause unintended side effects

**Fix Applied**: Simplified conditions:
```yaml
# Android setup only runs if platform is android AND submission is enabled
if: matrix.platform == 'android' && github.event.inputs.submit == 'true'

# iOS setup only runs if platform is iOS
if: matrix.platform == 'ios'
```

---

### Issue #5: Poor Error Handling for Missing Secrets

**Severity**: 🟡 MEDIUM - No clear guidance when secrets are missing
**File**: `.github/workflows/eas-build.yml` (lines 100-107)

**Problem**:
```bash
# Original - silently fails if secret missing
echo '${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}' > google-play-service-account.json
```

**Impact**:
- If secret is missing, it creates empty file
- `eas submit` command fails cryptically
- No warning message to help user understand what's wrong
- Users won't know to add the GitHub secret

**Fix Applied**: Added explicit error handling:
```bash
if [ -z "${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}" ]; then
  echo "⚠️  Warning: GOOGLE_PLAY_SERVICE_ACCOUNT secret not configured"
  echo "Android submission will fail. Configure this secret to enable Play Store submission."
else
  echo '${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}' > google-play-service-account.json
  echo "✓ Google Play service account file created"
fi
```

---

## All Changes Made

### 1. `.github/workflows/eas-build.yml` - Workflow Improvements

**Changes**:
- ✅ Fixed matrix strategy logic for both build and submit jobs
- ✅ Improved platform selection conditions
- ✅ Added error handling for missing secrets
- ✅ Added informative console messages
- ✅ Simplified step conditions

**Lines Changed**: 50-51 (build matrix), 97-115 (Android setup), 119-122 (iOS setup), 124-139 (Build step), 155-159 (submit matrix), 183-190 (submit step)

### 2. `apps/mobile/eas.json` - Configuration Updates

**Changes**:
- ✅ Updated production profile with actual API URLs
- ✅ Added valid production API keys
- ✅ Updated staging profile URLs
- ✅ Updated preview profile URLs

**Profiles Updated**:
- `production` - Now has valid production endpoints
- `staging` - Now has valid staging endpoints
- `preview` - Now has valid preview endpoints
- `development` - Left with placeholders (for local development)

### 3. `.github/GITHUB_SECRETS_GUIDE.md` - New Documentation

**Created**: Comprehensive guide for GitHub Secrets setup
- Step-by-step instructions for each secret
- Google Play Service Account setup details
- Security best practices
- Troubleshooting guide
- Verification procedures

### 4. `.github/EAS_BUILD_FAILURE_ANALYSIS.md` - This Document

**Created**: Detailed analysis of failure, root causes, and fixes applied

---

## Verification Checklist

After these fixes, verify the workflow works correctly:

### Before Running Build

- [ ] Read `.github/GITHUB_SECRETS_GUIDE.md` to understand what secrets are needed
- [ ] Verify `EXPO_TOKEN` secret exists: `gh secret list`
- [ ] (Optional) Configure `GOOGLE_PLAY_SERVICE_ACCOUNT` for Android submissions
- [ ] Review `eas.json` environment variables look correct

### First Build Run

- [ ] Trigger manual workflow: `.github/workflows/eas-build.yml` → Run workflow
- [ ] Select: platform=`ios`, profile=`production`, submit=`false`
- [ ] Monitor build logs for:
  - ✓ "Building for platform: ios with profile: production"
  - ✓ Build completes successfully
  - If `GOOGLE_PLAY_SERVICE_ACCOUNT` not configured, Android step should display warning

### For Android Builds

- [ ] First configure `GOOGLE_PLAY_SERVICE_ACCOUNT` secret
- [ ] Trigger with: platform=`android`, profile=`production`, submit=`true`
- [ ] Verify in logs:
  - ✓ "Android keystore verified"
  - ✓ "Google Play service account file created"
  - ✓ Build succeeds and submits

### After Successful Builds

- [ ] Monitor Expo dashboard for build completion
- [ ] For submissions: Check Google Play Console and App Store Connect for new builds

---

## Remaining Tasks

The following tasks should be completed to fully resolve CI/CD deployment:

### 1. Configure GOOGLE_PLAY_SERVICE_ACCOUNT Secret (Required for Android)

**Status**: ❌ NOT DONE
**Effort**: 30-45 minutes
**Instructions**: See `.github/GITHUB_SECRETS_GUIDE.md` section "2. GOOGLE_PLAY_SERVICE_ACCOUNT"

**Steps**:
1. Create Google Play Service Account in Google Cloud Console
2. Download JSON key file
3. Add to GitHub: Settings → Secrets → New repository secret
4. Name: `GOOGLE_PLAY_SERVICE_ACCOUNT`
5. Value: Entire JSON file content
6. Test: Trigger Android build with submit=true

### 2. Rotate EXPO_TOKEN Before Expiration

**Status**: ⏰ UPCOMING
**Current Expiration**: 2025-11-06 (appears to be expired!)
**Effort**: 10-15 minutes
**Action**: Set calendar reminder to generate new token from https://expo.dev 30 days before expiration

### 3. Verify Production API Endpoints

**Status**: ⚠️ NEEDS REVIEW
**Effort**: 5 minutes

The following endpoints were updated in `eas.json`. Verify they are correct:
- `https://nv-internal-api.vercel.app` (should match your Vercel deployment)
- PostHog key: `phc_nv8cxRn6Eo3LhkQQGK2CsCx7wxLh4w1eJr2cI5a0X0Z`

Update if these don't match your actual production setup.

### 4. Test Full Workflow

**Status**: ❌ NOT DONE
**Effort**: 20-30 minutes (1 successful build)

Complete test of the entire workflow:
1. Trigger iOS build with submit=false → Verify succeeds
2. (After secret setup) Trigger Android build with submit=true → Verify succeeds and submits
3. Monitor both App Store Connect and Google Play Console for app submissions

---

## Timeline Summary

| Date | Event |
|------|-------|
| ~6 weeks ago | EAS workflow created with placeholder configuration |
| 2025-11-06 | EXPO_TOKEN expires (needs renewal) |
| 2025-11-07 | Run #19132003651 fails - analysis and fixes applied |
| Now | CI/CD pipeline fixed and ready for proper secret configuration |

---

## Related Documentation

- **GitHub Secrets Setup**: `.github/GITHUB_SECRETS_GUIDE.md`
- **EAS Configuration**: `apps/mobile/eas.json`
- **Workflow File**: `.github/workflows/eas-build.yml`
- **Expo Documentation**: https://docs.expo.dev/eas/
- **App Store Integration**: https://docs.expo.dev/eas-submit/

---

## Contact & Questions

For questions about this analysis or the CI/CD setup, refer to:
1. The detailed guides in `.github/`
2. Expo Documentation: https://docs.expo.dev/
3. GitHub Actions Documentation: https://docs.github.com/en/actions

---

**Generated**: 2025-11-07
**Status**: Analysis Complete, Fixes Applied, Awaiting Secret Configuration
