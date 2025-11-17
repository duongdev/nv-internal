# OTA Update Troubleshooting

Common issues with OTA (Over-The-Air) updates and how to resolve them.

## Issue: Environment Variables Missing After OTA Update

### Symptoms

- Google Maps location search stops working after OTA update
- API calls fail with authentication errors
- PostHog analytics not tracking events
- App shows "Missing environment variable" errors

### Root Cause

**The OTA workflow wasn't explicitly passing environment variables to the `eas update` command.**

While environment variables were being set in `$GITHUB_ENV` in a previous step, they need to be **explicitly listed** in the `env:` section of the "Publish OTA update" step to ensure they're available during the bundle build process.

### Fix Applied

**Before** (Broken - lines 355-357 in ota-update.yml):
```yaml
- name: Publish OTA update
  env:
    BUILD_NUMBER: ${{ steps.increment.outputs.build_number }}
    # All EXPO_PUBLIC_* vars are now set via steps above ❌ NOT ENOUGH!
  run: |
    eas update --channel "$CHANNEL" ...
```

**After** (Fixed - lines 355-366):
```yaml
- name: Publish OTA update
  env:
    BUILD_NUMBER: ${{ steps.increment.outputs.build_number }}
    # Explicitly pass all environment variables for OTA bundle
    EXPO_PUBLIC_ENV: ${{ env.EXPO_PUBLIC_ENV }}
    EXPO_PUBLIC_API_URL: ${{ env.EXPO_PUBLIC_API_URL }}
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY }}
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS: ${{ env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS }}
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID: ${{ env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID }}
    EXPO_PUBLIC_POSTHOG_API_KEY: ${{ env.EXPO_PUBLIC_POSTHOG_API_KEY }}
    EXPO_PUBLIC_POSTHOG_HOST: ${{ env.EXPO_PUBLIC_POSTHOG_HOST }}
    EXPO_PUBLIC_POSTHOG_ENABLED: ${{ env.EXPO_PUBLIC_POSTHOG_ENABLED }}
    EXPO_PUBLIC_BUILD_NUMBER: ${{ env.EXPO_PUBLIC_BUILD_NUMBER }}
  run: |
    eas update --channel "$CHANNEL" ...
```

### Why This Matters

When `eas update` bundles your JavaScript code, it includes the values of `process.env.EXPO_PUBLIC_*` at bundle time. If these environment variables aren't available in the step's environment, they'll be `undefined` in the OTA bundle, causing features to break.

### Verification

After publishing an OTA update, verify environment variables are included:

1. **Check the workflow logs**:
   - Look for the "Publish OTA update" step
   - Verify all `EXPO_PUBLIC_*` variables are listed in the environment section

2. **Test in the app**:
   ```typescript
   // components/debug-info.tsx
   console.log('API URL:', process.env.EXPO_PUBLIC_API_URL)
   console.log('Clerk Key:', !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)
   console.log('Google Maps iOS:', !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS)
   console.log('Google Maps Android:', !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID)
   ```

3. **Use Debug Info screen**:
   - Open app → Settings → Debug Info
   - Check "Environment Variables" section
   - All keys should show as configured

## OTA Update Best Practices

### 1. Always Set Environment Variables Explicitly

**DON'T** rely on `$GITHUB_ENV` variables being automatically available:
```yaml
# ❌ Bad - Variables may not be available
- name: Previous step
  run: echo "EXPO_PUBLIC_API_URL=https://api.com" >> $GITHUB_ENV

- name: Publish OTA
  run: eas update --channel production
```

**DO** explicitly list all required variables:
```yaml
# ✅ Good - Variables explicitly passed
- name: Previous step
  run: echo "EXPO_PUBLIC_API_URL=https://api.com" >> $GITHUB_ENV

- name: Publish OTA
  env:
    EXPO_PUBLIC_API_URL: ${{ env.EXPO_PUBLIC_API_URL }}
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY }}
    # ... all other EXPO_PUBLIC_* variables
  run: eas update --channel production
```

### 2. Match Native Build Configuration

OTA updates should have the **same environment variables** as native builds:

**Native builds** (build-deploy.yml):
```yaml
env:
  EXPO_PUBLIC_ENV: production
  EXPO_PUBLIC_API_URL: https://api.namviet.withdustin.com
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY }}
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS: ${{ secrets.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS }}
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID: ${{ secrets.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID }}
  # ...
```

**OTA updates** (ota-update.yml) - Should match!
```yaml
env:
  EXPO_PUBLIC_ENV: ${{ env.EXPO_PUBLIC_ENV }}  # Set based on channel
  EXPO_PUBLIC_API_URL: ${{ env.EXPO_PUBLIC_API_URL }}
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY }}
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS: ${{ env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS }}
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID: ${{ env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID }}
  # ...
```

### 3. Validate Before Publishing

Add environment variable validation:

```yaml
- name: Validate environment variables
  run: |
    if [ -z "$EXPO_PUBLIC_API_URL" ]; then
      echo "❌ EXPO_PUBLIC_API_URL not set"
      exit 1
    fi

    if [ -z "$EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
      echo "❌ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY not set"
      exit 1
    fi

    echo "✅ All required environment variables are set"
```

## Common OTA Issues

### Issue: "Missing API URL" Error

**Cause**: `EXPO_PUBLIC_API_URL` not set in OTA bundle

**Fix**: Ensure variable is in the `env:` section of the publish step

### Issue: Google Maps Not Working

**Cause**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_*` not set in OTA bundle

**Fix**: Add to `env:` section:
```yaml
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS: ${{ env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS }}
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID: ${{ env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID }}
```

**Note**: While the keys are also configured in `app.config.ts` for native SDKs, the JavaScript environment variables are still needed for consistency and debugging.

### Issue: PostHog Not Tracking

**Cause**: PostHog variables not set or enabled flag is false

**Fix**:
```yaml
EXPO_PUBLIC_POSTHOG_API_KEY: ${{ env.EXPO_PUBLIC_POSTHOG_API_KEY }}
EXPO_PUBLIC_POSTHOG_HOST: ${{ env.EXPO_PUBLIC_POSTHOG_HOST }}
EXPO_PUBLIC_POSTHOG_ENABLED: ${{ env.EXPO_PUBLIC_POSTHOG_ENABLED }}
```

### Issue: Different Behavior Per Channel

**Cause**: Environment variables differ between production/staging

**Fix**: Ensure `configure-env` step sets channel-specific values correctly:

```yaml
if [ "$CHANNEL" == "production" ]; then
  echo "EXPO_PUBLIC_ENV=production" >> $GITHUB_ENV
  echo "EXPO_PUBLIC_API_URL=https://nv-internal-api.vercel.app" >> $GITHUB_ENV
elif [ "$CHANNEL" == "staging" ]; then
  echo "EXPO_PUBLIC_ENV=staging" >> $GITHUB_ENV
  echo "EXPO_PUBLIC_API_URL=https://nv-internal-staging.vercel.app" >> $GITHUB_ENV
fi
```

## Testing OTA Updates

### 1. Local Testing

Test OTA configuration locally:

```bash
cd apps/mobile

# Set environment variables
export EXPO_PUBLIC_ENV=staging
export EXPO_PUBLIC_API_URL=https://nv-internal-staging.vercel.app
export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
export EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=AIza...
export EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=AIza...
export EXPO_PUBLIC_POSTHOG_API_KEY=phc_...

# Publish to preview channel
eas update --channel preview
```

### 2. Verify Update Contents

After publishing, check what was bundled:

```bash
# Download the update
eas update:view --channel staging

# Check environment variables in your app
# Settings → Debug Info → Environment Variables
```

### 3. Test Key Features

After OTA update, verify:
- ✅ API calls work (check network tab)
- ✅ Google Maps location search works
- ✅ PostHog events are tracked
- ✅ Clerk authentication works
- ✅ Debug info shows all env vars

## Prevention

### Add to CI Checklist

Before merging OTA workflow changes:

1. ✅ All `EXPO_PUBLIC_*` variables explicitly listed in publish step
2. ✅ Variables match native build configuration
3. ✅ Validation step checks for missing variables
4. ✅ Test OTA update on staging channel first
5. ✅ Verify all features work after update

### Code Review Checklist

When reviewing OTA workflow changes:

- [ ] Environment variables explicitly passed to `eas update` step
- [ ] No reliance on `$GITHUB_ENV` without explicit re-declaration
- [ ] Channel-specific values set correctly
- [ ] Secrets properly referenced from `${{ secrets.* }}`
- [ ] Validation step includes all critical variables

## Related Documentation

- [OTA Update Workflow](./.github/workflows/ota-update.yml)
- [Build & Deploy Workflow](./.github/workflows/build-deploy.yml)
- [Environment Setup Guide](./environment-setup.md)
- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)

## Summary

**Key Takeaway**: Environment variables must be **explicitly listed** in the `env:` section of the "Publish OTA update" step. Setting them in `$GITHUB_ENV` in a previous step is not sufficient for the `eas update` build process.

**Fixed Files**:
- `.github/workflows/ota-update.yml` - Added explicit env vars to publish step (lines 357-366)

**Impact**: Google Maps, API calls, PostHog analytics, and all other features now work correctly after OTA updates.
