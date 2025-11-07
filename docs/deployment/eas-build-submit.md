# EAS Build & Submit Automation

This document describes the automated EAS build and submit workflow configured in `.github/workflows/eas-build.yml`.

## Overview

The workflow automates building and submitting the mobile app to Apple App Store and Google Play Store using Expo Application Services (EAS).

## Triggers

### 1. Automatic (Tag-based)

Automatically builds and submits to production when a version tag is pushed:

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# Result: Builds both iOS and Android for production and submits to stores
```

**Tag format**: `v*` (e.g., `v1.0.0`, `v1.2.3-beta.1`, `v2.0.0-rc.1`)

### 2. Manual (workflow_dispatch)

Trigger manually via GitHub Actions UI with custom options:

**Parameters**:
- **Platform**: `all`, `ios`, or `android` (default: `all`)
- **Profile**: `production`, `preview`, or `staging` (default: `production`)
- **Submit**: Submit to stores after build (default: `true`)
- **Auto-submit**: Submit immediately without waiting for build (default: `false`)

**How to trigger**:
1. Go to GitHub Actions → EAS Build & Submit
2. Click "Run workflow"
3. Select your options
4. Click "Run workflow"

## Build Profiles

Configured in `apps/mobile/eas.json`:

### Production
- **Distribution**: App Store / Google Play
- **Channel**: `production`
- **iOS**: Release configuration
- **Android**: App bundle (`.aab`)
- **Auto-increment**: Enabled
- **Environment**: Production

### Preview
- **Distribution**: Internal testing
- **Channel**: `preview`
- **iOS**: Release configuration
- **Android**: APK (`.apk`)
- **Use case**: Testing release builds before production

### Staging
- **Distribution**: Internal testing
- **Channel**: `staging`
- **iOS**: Release configuration
- **Android**: APK (`.apk`)
- **Use case**: Testing with staging backend

### Development
- **Distribution**: Internal
- **iOS**: Simulator + Debug configuration
- **Android**: APK (`.apk`)
- **Use case**: Development client builds
- **Note**: Not used in CI/CD (local development only)

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

### Required for all builds

| Secret | Description | How to get |
|--------|-------------|------------|
| `EXPO_TOKEN` | Expo access token | 1. Run `eas login` locally<br>2. Run `eas whoami`<br>3. Go to [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)<br>4. Create new token |

### Required for Android builds

| Secret | Description | How to get |
|--------|-------------|------------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | Google Play service account JSON | 1. Go to [Google Cloud Console](https://console.cloud.google.com/)<br>2. Create service account with Google Play Developer API access<br>3. Download JSON key<br>4. Copy entire JSON content |

**Android Keystore**: Already checked into repository at `apps/mobile/@duongdev__nv-internal.jks` (configured in `app.config.ts`)

### Optional for iOS builds

| Secret | Description | Note |
|--------|-------------|------|
| `APPLE_ID` | Apple ID email | Optional - uses `dustin.do95@gmail.com` from `eas.json` if not provided |

**iOS Credentials**: Managed by Expo (certificates and provisioning profiles handled automatically)

## Workflow Jobs

### Job 1: Build

**Purpose**: Build the app using EAS Build

**Steps**:
1. Checkout code
2. Setup Node.js, pnpm, and Expo
3. Install dependencies and build workspace packages
4. Setup platform-specific secrets
   - **Android**: Create service account JSON file
   - **iOS**: Uses Expo managed credentials
5. Run EAS build command
6. Optional: Auto-submit if enabled
7. Cleanup secrets

**Matrix Strategy**: Builds iOS and Android in parallel when platform is `all`

### Job 2: Submit

**Purpose**: Submit builds to app stores

**When it runs**:
- Manual trigger with `submit=true` and `auto_submit=false`
- Tag-based trigger (always submits after build)

**Steps**:
1. Checkout code
2. Setup Node.js, pnpm, and Expo
3. Submit latest build to stores using `eas submit --latest`
4. Send notifications (success/failure)

**Matrix Strategy**: Submits iOS and Android in parallel when platform is `all`

## Usage Examples

### Example 1: Production Release (Tag-based)

```bash
# After merging to main and testing
git tag v1.0.0
git push origin v1.0.0

# Workflow will:
# 1. Build iOS and Android for production
# 2. Auto-submit both to App Store and Google Play
# 3. Build version will auto-increment
```

### Example 2: Manual iOS Preview Build

1. Go to GitHub Actions → EAS Build & Submit → Run workflow
2. Set:
   - Platform: `ios`
   - Profile: `preview`
   - Submit: `false`
3. Result: Internal iOS build without store submission

### Example 3: Manual Android Staging Build with Submit

1. Go to GitHub Actions → EAS Build & Submit → Run workflow
2. Set:
   - Platform: `android`
   - Profile: `staging`
   - Submit: `true`
   - Auto-submit: `false`
3. Result: Android staging build, then separate submit job

### Example 4: Beta Release

```bash
# Tag with pre-release version
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1

# Workflow will:
# 1. Build both platforms for production
# 2. Submit to stores (TestFlight/Internal Testing)
```

## Submit Configuration

### iOS Submit (`eas.json`)

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "dustin.do95@gmail.com",
        "ascAppId": "6754835683",
        "appleTeamId": "9F77J83SKT"
      }
    }
  }
}
```

**Submission target**: TestFlight → App Store Connect

### Android Submit (`eas.json`)

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Submission target**: Internal testing track (can be promoted to beta/production in Google Play Console)

## Build Monitoring

### Check Build Status

1. **GitHub Actions**: Monitor workflow progress in Actions tab
2. **Expo Dashboard**: View build details at [expo.dev/accounts/[account]/projects/nv-internal](https://expo.dev)
3. **Build Logs**: Available in both GitHub Actions and Expo dashboard

### Build Artifacts

- **iOS**: `.ipa` file (submitted to TestFlight)
- **Android**: `.aab` bundle (submitted to Google Play)

## Troubleshooting

### Build Fails

**Common causes**:
1. Missing `EXPO_TOKEN` secret
2. Android keystore not found
3. TypeScript/lint errors in code
4. Invalid `eas.json` configuration

**Fix**: Check GitHub Actions logs for specific error messages

### Submit Fails

**iOS submission failures**:
1. Invalid Apple credentials
2. App not created in App Store Connect
3. Missing App Store Connect API key

**Android submission failures**:
1. Invalid service account JSON
2. Service account lacks Google Play Developer API permissions
3. App not created in Google Play Console

### Auto-increment Issues

If version auto-increment fails:
1. Manually increment version in `app.config.ts`
2. Commit and push changes
3. Re-trigger workflow

## Best Practices

### 1. Version Tagging Strategy

```bash
# Production releases
v1.0.0, v1.1.0, v2.0.0

# Beta releases (TestFlight/Internal Testing)
v1.0.0-beta.1, v1.0.0-beta.2

# Release candidates
v1.0.0-rc.1, v1.0.0-rc.2

# Hotfixes
v1.0.1, v1.0.2
```

### 2. Pre-release Checklist

Before creating a version tag:
- [ ] All PRs merged to main
- [ ] All tests passing
- [ ] Code quality checks passing
- [ ] Manual QA completed
- [ ] Release notes prepared
- [ ] Version number decided (following semver)

### 3. Build Profile Usage

| Profile | Use Case | When to Use |
|---------|----------|-------------|
| `production` | App Store release | Production releases only |
| `preview` | Internal testing | Before production release |
| `staging` | Staging backend testing | Testing with staging API |
| `development` | Local development | Never use in CI/CD |

### 4. Parallel Builds

The workflow builds iOS and Android in parallel for faster completion:
- **Advantage**: Faster builds (both platforms at once)
- **Consideration**: Uses 2 concurrent EAS build slots

### 5. Submission Timing

**Auto-submit** (recommended for production):
- Starts submission immediately after build starts
- Faster overall workflow
- Uses Expo's latest build matching

**Manual submit** (recommended for testing):
- Waits for build to complete
- Allows build verification before submission
- More control over submission timing

## Environment Variables

The mobile app uses **Expo's native environment management pattern**. Each build profile in `eas.json` defines its complete environment configuration:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://api.your-domain.com",
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_your_key",
        "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS": "ios_key",
        "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID": "android_key"
      }
    },
    "staging": {
      "env": {
        "EXPO_PUBLIC_ENV": "staging",
        "EXPO_PUBLIC_API_URL": "https://staging-api.your-domain.com",
        // ... staging-specific values
      }
    }
  }
}
```

**Key Points**:
- **No suffixed variables**: Each environment uses the same variable names
- **Build-time configuration**: Environment is determined when building, not at runtime
- **Platform-specific exception**: Only Google Maps keys use platform suffixes (iOS/Android)
- **Local development**: Use `.env.local` for local development values

**Available in app**: Access directly via `process.env.EXPO_PUBLIC_*`

See `.claude/tasks/20251107-100000-environment-variable-refactoring.md` for migration details.

## Cost Considerations

### EAS Build Pricing

Check current pricing at [expo.dev/pricing](https://expo.dev/pricing)

**Free tier**:
- Priority builds available on paid plans
- Slower builds on free tier

**Optimization tips**:
1. Use `preview` profile for testing (APK builds are faster)
2. Test locally before triggering CI/CD builds
3. Use `--platform` flag to build only needed platform

## Security Notes

### Secrets Management

1. **Never commit secrets** to repository
2. **Use GitHub Secrets** for all sensitive data
3. **Cleanup secrets** after build (automated in workflow)
4. **Rotate tokens** periodically

### Android Keystore

- Currently checked into repository (encrypted in Git)
- Consider using EAS Secrets for production: `eas secret:create --scope project --name ANDROID_KEYSTORE`

### Service Accounts

- Use dedicated service account for CI/CD
- Grant minimum required permissions
- Rotate keys annually

## Related Documentation

- [Expo Application Services (EAS)](https://docs.expo.dev/eas/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [eas.json Configuration](https://docs.expo.dev/build-reference/eas-json/)
- [GitHub Actions for Expo](https://docs.expo.dev/build/building-on-ci/)

## Support

**Issues**: Create an issue in the repository with the `ci/cd` label

**Expo Support**: [expo.dev/support](https://expo.dev/support)
