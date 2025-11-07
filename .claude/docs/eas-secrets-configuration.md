# EAS Secrets Configuration Guide

**Created**: 2025-11-07
**Status**: Required for Production Build Fix
**Related Issue**: TestFlight app crashes due to placeholder environment variables

## Problem Summary

The TestFlight production build is crashing on startup because the `eas.json` file contains placeholder values instead of real environment variables. When EAS builds run via GitHub Actions, these placeholder values are embedded in the app binary, causing Clerk authentication to fail.

## Root Cause

EAS Build does **NOT** use GitHub Secrets directly. Environment variables must be:
1. Defined on EAS servers using EAS Secrets
2. Or embedded in `eas.json` (not secure for production secrets)

**Current Issue**: Production secrets are placeholders in `eas.json`, and GitHub Actions workflow doesn't inject real values because EAS Build doesn't support passing environment variables via CLI flags.

## Solution: Use EAS Secrets

EAS provides a secure secret management system that stores encrypted secrets on EAS servers. These secrets are injected during the build process and never exposed in logs or configuration files.

### Architecture

```
┌─────────────────┐
│ GitHub Actions  │
│                 │
│  Triggers →     │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────┐
│ EAS Build (Expo Servers)        │
│                                  │
│  1. Reads eas.json profile      │
│  2. Fetches EAS Secrets         │
│  3. Merges with eas.json env    │
│  4. Builds app with real values │
└─────────────────────────────────┘
```

### Environment Variable Priority (Highest to Lowest)

1. **EAS Secrets** (stored on EAS servers) ← **USE THIS FOR PRODUCTION**
2. Command-line flags (not available for environment variables)
3. `eas.json` env configuration ← **USE THIS FOR NON-SENSITIVE VALUES**

## Required EAS Secrets for Production

### List of Secrets to Create

All secrets should be created for the **production** environment with **secret** visibility.

| Secret Name | Example Value | Description | Where to Get |
|-------------|---------------|-------------|--------------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_xxxxxxxxxxxxx` | Clerk production publishable key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS` | `AIzaSyXXXXXXXXXXXXX` | Google Maps iOS key | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID` | `AIzaSyYYYYYYYYYYYYY` | Google Maps Android key | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | `phc_xxxxxxxxxxxxx` | PostHog project API key | [PostHog Dashboard](https://app.posthog.com) → Project Settings |

### Non-Secret Values (Keep in eas.json)

These values can remain in `eas.json` as they are not sensitive:

- `EXPO_PUBLIC_ENV`: `"production"` (environment indicator)
- `EXPO_PUBLIC_API_URL`: `"https://nv-internal-api.vercel.app"` (public URL)
- `EXPO_PUBLIC_POSTHOG_ENABLED`: `"true"` (feature flag)
- `EXPO_PUBLIC_POSTHOG_HOST`: `"https://app.posthog.com"` (public URL)

## Implementation Steps

### Step 1: Create EAS Secrets

**Option A: Using Expo Dashboard (Recommended for first-time setup)**

1. Go to [Expo Dashboard](https://expo.dev/)
2. Navigate to your project (`nv-internal`)
3. Go to **Project Settings** → **Environment Variables**
4. Click **Create Variable**
5. For each secret:
   - **Name**: Enter exact variable name (e.g., `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`)
   - **Value**: Enter the real production value
   - **Environment**: Select `production`
   - **Visibility**: Select `Secret` (not readable outside EAS servers)
   - Click **Save**

**Option B: Using EAS CLI (For scripting/automation)**

```bash
# From apps/mobile directory
cd apps/mobile

# Create each secret (you'll be prompted for values)
eas env:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --environment production --visibility secret
eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --environment production --visibility secret
eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --environment production --visibility secret
eas env:create --name EXPO_PUBLIC_POSTHOG_API_KEY --environment production --visibility secret
```

### Step 2: Update eas.json (Remove Placeholder Secrets)

Modify `apps/mobile/eas.json` to remove sensitive placeholders from the production profile:

```json
{
  "build": {
    "production": {
      "distribution": "store",
      "channel": "production",
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "EXPO_PUBLIC_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://nv-internal-api.vercel.app",
        "EXPO_PUBLIC_POSTHOG_ENABLED": "true"
        // Secrets are now fetched from EAS Secrets automatically
      }
    }
  }
}
```

**Important Notes**:
- Remove all `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_*`, and `EXPO_PUBLIC_POSTHOG_API_KEY` from eas.json
- EAS Build will automatically merge secrets from EAS Secrets with the env configuration
- Placeholders are no longer needed once secrets are created on EAS servers

### Step 3: Verify GitHub Actions Workflow

The existing workflow (`.github/workflows/eas-build.yml`) already works correctly:

```yaml
- name: Build on EAS
  working-directory: apps/mobile
  env:
    BUILD_NUMBER: ${{ steps.build_number.outputs.build_number }}
  run: |
    PLATFORM="${{ matrix.platform }}"
    PROFILE="${{ steps.check-trigger.outputs.profile }}"

    eas build --platform $PLATFORM --profile $PROFILE --non-interactive --auto-submit
```

**Why it works**:
- GitHub Actions triggers the build on EAS servers
- EAS servers fetch secrets from EAS Secrets storage
- No changes needed to GitHub Actions workflow

### Step 4: Test the Fix

**Local Testing** (using development profile):
```bash
cd apps/mobile
eas build --profile development --platform ios --local
```

**Production Build Trigger** (via GitHub Actions):
```bash
# Create a version tag to trigger production build
git tag v1.0.1
git push origin v1.0.1
```

**Or manually trigger from GitHub Actions UI**:
1. Go to Actions tab in GitHub
2. Select "EAS Build & Submit" workflow
3. Click "Run workflow"
4. Select platform: `all`, profile: `production`, submit: `true`

### Step 5: Verify Build Success

1. **Check EAS Build Dashboard**: [https://expo.dev/accounts/duongdev/projects/nv-internal/builds](https://expo.dev/accounts/duongdev/projects/nv-internal/builds)
2. **Monitor build logs**: Ensure no "undefined" or placeholder values in logs
3. **Test on TestFlight**: Download and verify Clerk authentication works

## Security Best Practices

### ✅ DO

- Store all API keys and secrets in EAS Secrets with `secret` visibility
- Use production environment for production builds
- Use staging environment for preview/staging builds
- Rotate secrets regularly
- Use different API keys for each environment (dev/staging/production)

### ❌ DON'T

- Commit real API keys to `eas.json` or any file in git
- Use production keys in development or staging environments
- Share EAS Secrets between projects
- Use `plain text` visibility for sensitive data
- Hardcode secrets in app code

## Troubleshooting

### Issue: Build still uses placeholder values

**Cause**: EAS Secrets not created or wrong environment selected

**Solution**:
1. Verify secrets exist: Check Expo Dashboard → Environment Variables
2. Ensure secrets are created for `production` environment
3. Check build profile in eas.json uses correct environment

### Issue: "Environment variable not found" error

**Cause**: Variable name mismatch between eas.json and EAS Secrets

**Solution**:
1. Ensure variable names match exactly (case-sensitive)
2. Check that all `EXPO_PUBLIC_*` variables are defined
3. Verify environment is set to `production` in build profile

### Issue: App crashes with "Invalid Clerk key" error

**Cause**: Using test key in production or wrong key format

**Solution**:
1. Verify you're using `pk_live_*` key (not `pk_test_*`)
2. Check key is copied correctly without extra spaces
3. Regenerate key in Clerk Dashboard if needed

## Migration Checklist

Use this checklist when migrating from placeholder values to EAS Secrets:

- [ ] Obtain all production API keys (Clerk, Google Maps, PostHog)
- [ ] Create EAS Secrets for all sensitive variables
- [ ] Set visibility to `secret` for all API keys
- [ ] Set environment to `production` for all secrets
- [ ] Update `eas.json` to remove placeholder values
- [ ] Commit updated `eas.json` to git
- [ ] Test local build with development profile
- [ ] Trigger production build via GitHub Actions
- [ ] Monitor build logs for successful secret injection
- [ ] Test production build on TestFlight
- [ ] Verify Clerk authentication works
- [ ] Verify Google Maps displays correctly
- [ ] Verify PostHog analytics tracking works
- [ ] Document secret rotation schedule
- [ ] Update team documentation with access instructions

## Additional Resources

- [EAS Environment Variables Documentation](https://docs.expo.dev/eas/environment-variables/)
- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [Clerk API Keys](https://clerk.com/docs/deployments/clerk-environment-variables)
- [Google Maps API Keys](https://developers.google.com/maps/documentation/embed/get-api-key)
- [PostHog API Keys](https://posthog.com/docs/api)

## Appendix: Environment Variable Naming Convention

The project uses Expo's native environment management pattern:

- **Single Variable Names**: Each environment variable has one name (no suffixes like `_PROD` or `_DEV`)
- **Build Profile Management**: Values are defined per build profile or EAS Secret environment
- **No Runtime Switching**: Environment is determined at build time, not runtime
- **Platform Exception**: Only Google Maps keys remain platform-specific (iOS/Android)

See `.claude/tasks/20251107-100000-environment-variable-refactoring.md` for migration history.
