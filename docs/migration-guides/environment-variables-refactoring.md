# Environment Variables Migration Guide

## Overview

On November 7, 2025, the mobile app's environment variable system was refactored from using suffixed variables with runtime fallback logic to Expo's native environment management pattern.

## What Changed

### Before (Runtime Switching)
- Variables had environment suffixes: `_PRODUCTION`, `_STAGING`
- Complex runtime logic selected appropriate values
- All environments bundled in single build
- Required many environment variables in CI/CD

### After (Build-Time Configuration)
- Single variable names for all environments
- Values defined per build profile in `eas.json`
- Each build contains only its environment's values
- Minimal CI/CD secrets needed

## Migration Steps

### 1. For Local Development

Update your `.env.local` file to use single variable names:

```env
# Remove suffixed variables
- EXPO_PUBLIC_API_URL_PRODUCTION=https://api.example.com
- EXPO_PUBLIC_API_URL_STAGING=https://staging.example.com
- EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_PRODUCTION=pk_live_xxx
- EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING=pk_test_xxx

# Use single variables (local values only)
+ EXPO_PUBLIC_API_URL=http://localhost:3000
+ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_local_key

# Platform-specific keys remain unchanged
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=your_ios_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=your_android_key
```

### 2. For CI/CD (GitHub Actions, EAS Secrets)

Remove suffixed environment variables from your CI/CD secrets:

**Remove these**:
- `EXPO_PUBLIC_API_URL_PRODUCTION`
- `EXPO_PUBLIC_API_URL_STAGING`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_PRODUCTION`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_STAGING`
- `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY_PRODUCTION`
- `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY_PRODUCTION`

**Keep only**:
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS` (platform-specific)
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID` (platform-specific)
- `EXPO_TOKEN` (for EAS authentication)

### 3. Update EAS Secrets

```bash
# Remove old suffixed secrets
eas secret:delete EXPO_PUBLIC_API_URL_PRODUCTION
eas secret:delete EXPO_PUBLIC_API_URL_STAGING
eas secret:delete EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_PRODUCTION
eas secret:delete EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING

# Keep only platform-specific Google Maps keys
eas secret:list  # Should only show Google Maps keys
```

### 4. Verify eas.json Configuration

Ensure each build profile in `eas.json` has complete environment definitions:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://api.your-domain.com",
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_xxx",
        // ... all production values
      }
    },
    "staging": {
      "env": {
        "EXPO_PUBLIC_ENV": "staging",
        "EXPO_PUBLIC_API_URL": "https://staging-api.your-domain.com",
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_xxx",
        // ... all staging values
      }
    }
  }
}
```

## Code Changes

### Accessing Environment Variables

**Before**:
```typescript
// Complex runtime selection
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL_PRODUCTION ||
  process.env.EXPO_PUBLIC_API_URL_STAGING ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3000'
```

**After**:
```typescript
// Simple direct access
const apiUrl = process.env.EXPO_PUBLIC_API_URL

// Or using the env utility
import { getApiUrl } from '@/lib/env'
const apiUrl = getApiUrl()
```

### Platform-Specific Exception

Google Maps keys remain platform-specific:

```typescript
import { Platform } from 'react-native'

const googleMapsKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
  android: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
})
```

## Building for Different Environments

```bash
# Development (local)
pnpm dev

# Staging build
eas build --profile staging --platform all

# Production build
eas build --profile production --platform all

# Preview build (internal testing)
eas build --profile preview --platform ios
```

## Troubleshooting

### Issue: Environment variable is undefined

**Solution**: Check that the variable is defined in the appropriate build profile in `eas.json`.

### Issue: Wrong environment values in build

**Solution**: Ensure you're using the correct build profile. Each profile has its own environment configuration.

### Issue: Google Maps not working

**Solution**: Platform-specific keys must still be set as EAS secrets or in `.env.local`:
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID`

### Issue: Local development broken

**Solution**: Update your `.env.local` file to use single variable names without suffixes.

## Benefits of New Pattern

1. **Simpler code**: No runtime environment detection logic
2. **Smaller bundles**: Only includes values for target environment
3. **Better security**: Production secrets never in development builds
4. **Easier maintenance**: Single source of truth in `eas.json`
5. **Type safety**: No nullable types from fallback chains
6. **Industry standard**: Follows Expo's recommended patterns

## Rollback Instructions

If you need to rollback:

1. Revert the git commit that introduced these changes
2. Restore suffixed environment variables in CI/CD and EAS secrets
3. Rebuild and redeploy the application

## Related Documentation

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [Task Documentation](../../.claude/tasks/20251107-100000-environment-variable-refactoring.md)