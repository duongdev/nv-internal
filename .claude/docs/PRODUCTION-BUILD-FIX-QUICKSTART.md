# 🚨 PRODUCTION BUILD FIX - Quick Start Guide

**Issue**: TestFlight app crashes on startup due to placeholder environment variables
**Status**: ✅ Configuration updated, EAS Secrets setup required
**Priority**: CRITICAL - Production blocking

## 🎯 Immediate Action Required

You need to create EAS Secrets to provide real API keys for the production build. This is a **one-time setup** that takes approximately 10 minutes.

## 📋 Prerequisites

Before starting, gather these API keys:

| Service | Key Type | Where to Find | Example Format |
|---------|----------|---------------|----------------|
| **Clerk** | Production Publishable Key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys | `pk_live_xxxxxxxxxxxxxxxx` |
| **Google Maps (iOS)** | iOS API Key | [Google Cloud Console](https://console.cloud.google.com) → Credentials | `AIzaSyXXXXXXXXXXXXX` |
| **Google Maps (Android)** | Android API Key | [Google Cloud Console](https://console.cloud.google.com) → Credentials | `AIzaSyYYYYYYYYYYYYY` |
| **PostHog** | Project API Key | [PostHog Dashboard](https://app.posthog.com) → Project Settings | `phc_xxxxxxxxxxxxx` |

## ⚡ Quick Setup (5 Steps)

### Step 1: Navigate to Expo Dashboard

1. Go to [Expo Dashboard](https://expo.dev/)
2. Find project: **nv-internal** (under @duongdev account)
3. Click **Project Settings** → **Environment Variables**

### Step 2: Create Production Secrets

Click **Create Variable** and add each of these (4 variables total):

#### Variable 1: Clerk Key
- **Name**: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Value**: Your production Clerk key (starts with `pk_live_`)
- **Environment**: `production`
- **Visibility**: `Secret`

#### Variable 2: Google Maps iOS Key
- **Name**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS`
- **Value**: Your iOS API key
- **Environment**: `production`
- **Visibility**: `Secret`

#### Variable 3: Google Maps Android Key
- **Name**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID`
- **Value**: Your Android API key
- **Environment**: `production`
- **Visibility**: `Secret`

#### Variable 4: PostHog Key
- **Name**: `EXPO_PUBLIC_POSTHOG_API_KEY`
- **Value**: Your PostHog project key (starts with `phc_`)
- **Environment**: `production`
- **Visibility**: `Secret`

### Step 3: Verify Configuration

After creating all 4 secrets, verify they appear in the dashboard:
- Environment: **production**
- Visibility: **Secret** (not readable outside EAS servers)
- Status: ✅ Active

### Step 4: Trigger New Production Build

**Option A: Via GitHub Actions UI** (Recommended)
1. Go to [GitHub Actions](https://github.com/duongdev/nv-internal/actions)
2. Select **EAS Build & Submit** workflow
3. Click **Run workflow** button
4. Configure:
   - Platform: `all` (or specific platform)
   - Profile: `production`
   - Submit to stores: `true`
5. Click **Run workflow**

**Option B: Via Git Tag**
```bash
git tag v1.0.2
git push origin v1.0.2
```

### Step 5: Verify Build Success

1. Monitor build progress at [EAS Build Dashboard](https://expo.dev/accounts/duongdev/projects/nv-internal/builds)
2. Check build logs for successful secret injection (no placeholder values)
3. Once complete, test on TestFlight:
   - Download latest build
   - Launch app (should not crash)
   - Verify Clerk authentication works
   - Check Google Maps displays correctly
   - Confirm PostHog analytics tracking

## ✅ Success Criteria

Your production build is fixed when:
- ✅ App launches without crashing
- ✅ Clerk login/signup works
- ✅ Google Maps loads correctly on both iOS and Android
- ✅ PostHog events are tracked (check PostHog dashboard)
- ✅ No placeholder values appear in app behavior

## 🔧 Troubleshooting

### Issue: Still seeing placeholder values in build logs

**Solution**: Verify all 4 secrets are created for `production` environment with exact names

### Issue: "Invalid Clerk key" error on app launch

**Solution**:
1. Verify you're using `pk_live_*` key (not `pk_test_*`)
2. Check key is copied without extra spaces
3. Regenerate key in Clerk Dashboard if needed

### Issue: Google Maps not loading

**Solution**:
1. Verify iOS and Android keys are separate
2. Check keys are enabled for Maps SDK in Google Cloud Console
3. Verify API keys have correct restrictions (bundle ID for iOS, package name for Android)

### Issue: PostHog not tracking events

**Solution**:
1. Verify PostHog key starts with `phc_`
2. Check project is active in PostHog Dashboard
3. Ensure `EXPO_PUBLIC_POSTHOG_ENABLED` is `"true"` in eas.json (already set)

## 📚 Additional Resources

For detailed documentation, see:
- **Full Guide**: `.claude/docs/eas-secrets-configuration.md`
- **EAS Documentation**: [Environment Variables & Secrets](https://docs.expo.dev/eas/environment-variables/)
- **Clerk Documentation**: [Environment Variables](https://clerk.com/docs/deployments/clerk-environment-variables)

## 🎉 After Fix is Complete

Once production builds are working:

1. **Update staging environment** (optional but recommended):
   - Create same secrets for `staging` environment
   - Use test keys (not production keys)

2. **Document secret rotation**:
   - Set calendar reminder to rotate keys quarterly
   - Document key rotation process

3. **Update team documentation**:
   - Share this guide with team members
   - Document access to Expo Dashboard and API key sources

## ❓ Need Help?

If you encounter issues:

1. Check the full documentation: `.claude/docs/eas-secrets-configuration.md`
2. Verify all prerequisites are met (valid API keys)
3. Confirm secrets are created with exact names (case-sensitive)
4. Check EAS build logs for specific error messages

---

**Last Updated**: 2025-11-07
**Related Files**:
- Configuration: `/apps/mobile/eas.json` (updated to use EAS Secrets)
- Workflow: `/.github/workflows/eas-build.yml` (no changes needed)
