# Production Deployment Configuration Files

**Related**: [Production Deployment Plan](./production-deployment-plan.md)

This document contains all configuration files needed for production deployment.

---

## Table of Contents

1. [EAS Configuration (`eas.json`)](#eas-configuration)
2. [App Configuration (`app.config.ts`)](#app-configuration)
3. [GitHub Actions Workflows](#github-actions-workflows)
4. [Environment Variables Reference](#environment-variables-reference)
5. [Google Play Service Account Setup](#google-play-service-account-setup)

---

## EAS Configuration

### File: `apps/mobile/eas.json`

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
        "EXPO_PUBLIC_ENV": "development"
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
      },
      "env": {
        "EXPO_PUBLIC_ENV": "preview"
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
        "appleId": "YOUR_APPLE_ID@example.com",
        "ascAppId": "PLACEHOLDER_WILL_BE_FILLED_AFTER_APP_CREATION",
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

**Important Placeholders to Replace**:
- `YOUR_APPLE_ID@example.com`: Your Apple Developer account email
- `YOUR_TEAM_ID`: From Apple Developer portal (see deployment plan Phase 1.3)
- `PLACEHOLDER_WILL_BE_FILLED_AFTER_APP_CREATION`: Auto-filled after first app creation

**Security Note**: Add to `.gitignore`:
```
apps/mobile/google-play-service-account.json
```

---

## App Configuration

### File: `apps/mobile/app.config.ts`

**Replace existing `app.json` with this TypeScript config for dynamic environment handling.**

```typescript
import type { ConfigContext, ExpoConfig } from '@expo/config';

const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENV === 'production';
const IS_STAGING = process.env.EXPO_PUBLIC_ENV === 'staging';
const IS_DEV = !IS_PRODUCTION && !IS_STAGING;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Nam Việt Internal',
  slug: 'nv-internal',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'nv-internal',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'vn.dienlanhnamviet.internal',
    config: {
      // Platform-specific Google Maps key (exception to single-variable pattern)
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.',
      NSCameraUsageDescription:
        'Nam Việt Internal cần quyền truy cập máy ảnh để chụp ảnh công việc và đính kèm vào nhiệm vụ.',
      NSPhotoLibraryUsageDescription:
        'Nam Việt Internal cần quyền truy cập thư viện ảnh để đính kèm ảnh vào nhiệm vụ.',
      NSPhotoLibraryAddUsageDescription:
        'Nam Việt Internal cần quyền lưu ảnh vào thư viện ảnh.',
    },
  },

  android: {
    package: 'vn.dienlanhnamviet.internal',
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'READ_MEDIA_IMAGES',
      'READ_MEDIA_VIDEO',
    ],
    config: {
      googleMaps: {
        // Platform-specific Google Maps key (exception to single-variable pattern)
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
      },
    },
  },

  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-web-browser',
    'expo-font',
    'expo-asset',
    'expo-video',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Nam Việt Internal cần quyền truy cập vị trí để xác minh check-in/check-out tại địa điểm công việc.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Nam Việt Internal cần quyền truy cập thư viện ảnh để đính kèm ảnh vào nhiệm vụ.',
        cameraPermission:
          'Nam Việt Internal cần quyền truy cập máy ảnh để chụp ảnh công việc.',
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    eas: {
      projectId: 'efc85258-12ce-4f6a-826a-ab5765d18ebc',
    },
  },

  owner: 'duongdev',

  updates: {
    url: 'https://u.expo.dev/efc85258-12ce-4f6a-826a-ab5765d18ebc',
  },

  runtimeVersion: {
    policy: 'appVersion',
  },
});
```

**Migration Steps**:

1. **Backup current `app.json`**:
   ```bash
   cd apps/mobile
   cp app.json app.json.backup
   ```

2. **Create `app.config.ts`**:
   ```bash
   # Create file with content above
   touch app.config.ts
   ```

3. **Delete `app.json`**:
   ```bash
   rm app.json
   ```

4. **Test configuration**:
   ```bash
   npx expo config --type public
   # Should output resolved config without errors
   ```

---

## GitHub Actions Workflows

### 1. Manual OTA Updates

**File**: `.github/workflows/eas-update.yml`

```yaml
name: EAS Update

on:
  workflow_dispatch:
    inputs:
      channel:
        description: 'Update channel (staging or production)'
        required: true
        type: choice
        options:
          - staging
          - production
      message:
        description: 'Update message'
        required: true
        type: string

jobs:
  update:
    name: EAS Update
    runs-on: ubuntu-latest

    steps:
      - name: 🏗 Checkout code
        uses: actions/checkout@v4

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: 🏗 Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: 📦 Install dependencies
        run: |
          cd apps/mobile
          pnpm install --frozen-lockfile

      - name: 🏗 Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: 🚀 Publish update
        run: |
          cd apps/mobile
          eas update --branch ${{ github.event.inputs.channel }} --message "${{ github.event.inputs.message }}"
        env:
          EXPO_PUBLIC_ENV: ${{ github.event.inputs.channel }}

      - name: ✅ Notify
        run: |
          echo "✅ OTA update published to ${{ github.event.inputs.channel }} channel"
          echo "📝 Message: ${{ github.event.inputs.message }}"
          echo "🔗 View updates: https://expo.dev/accounts/duongdev/projects/nv-internal/updates"
```

### 2. Build Trigger (Future: GitHub Actions Builds)

**File**: `.github/workflows/eas-build.yml` (for future migration)

```yaml
name: EAS Build

on:
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to build'
        required: true
        type: choice
        options:
          - ios
          - android
          - all
      profile:
        description: 'Build profile'
        required: true
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  build:
    name: EAS Build
    runs-on: ubuntu-latest

    steps:
      - name: 🏗 Checkout code
        uses: actions/checkout@v4

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: 🏗 Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: 📦 Install dependencies
        run: |
          cd apps/mobile
          pnpm install --frozen-lockfile

      - name: 🏗 Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: 🚀 Build app
        run: |
          cd apps/mobile
          eas build --platform ${{ github.event.inputs.platform }} --profile ${{ github.event.inputs.profile }} --non-interactive

      - name: ✅ Notify
        run: |
          echo "✅ Build started for ${{ github.event.inputs.platform }} (${{ github.event.inputs.profile }} profile)"
          echo "🔗 View builds: https://expo.dev/accounts/duongdev/projects/nv-internal/builds"
```

**Note**: This workflow still uses EAS Build servers. For true GitHub Actions builds (to save EAS credits), see Phase 15 in the deployment plan.

---

## Environment Variables Reference

### EAS Secrets (Mobile App)

**UPDATED (2025-11-07)**: Environment variables are now managed via build profiles in `eas.json`. Only platform-specific Google Maps keys should be set as EAS secrets.

| Variable Name | Status | Example Value | Notes |
|---------------|---------|---------------|-------|
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS` | **Active** | `AIza...` | iOS Google Maps key |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID` | **Active** | `AIza...` | Android Google Maps key |
| ~~`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING`~~ | **Removed** | - | Use `eas.json` profiles |
| ~~`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_PRODUCTION`~~ | **Removed** | - | Use `eas.json` profiles |
| ~~`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_STAGING`~~ | **Removed** | - | Use `eas.json` profiles |
| ~~`EXPO_PUBLIC_API_URL_STAGING`~~ | **Removed** | - | Use `eas.json` profiles |
| ~~`EXPO_PUBLIC_API_URL_PRODUCTION`~~ | **Removed** | - | Use `eas.json` profiles |

**Set platform-specific secrets via CLI**:
```bash
# Only needed for Google Maps platform keys
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS --value "AIza..." --type string
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID --value "AIza..." --type string
```

**Environment-specific values**: Now defined in `apps/mobile/eas.json` under each build profile's `env` section.

See `.claude/tasks/20251107-100000-environment-variable-refactoring.md` for migration details.

### Vercel Environment Variables (API)

Set in Vercel dashboard: https://vercel.com/duongdev/nv-internal-api/settings/environment-variables

| Variable Name | Environment | Example Value | Description |
|---------------|-------------|---------------|-------------|
| `DATABASE_URL` | Production | `postgresql://user:pass@ep-...` | Neon production DB |
| `CLERK_SECRET_KEY` | Production | `sk_live_...` | Clerk production secret |
| `CLERK_PUBLISHABLE_KEY` | Production | `pk_live_...` | Clerk production public key |
| `STORAGE_PROVIDER` | Production | `vercel-blob` | Storage backend |
| `BLOB_READ_WRITE_TOKEN` | Production | `vercel_blob_rw_...` | Vercel Blob token |
| `NODE_ENV` | Production | `production` | Environment identifier |
| `ATTACHMENT_JWT_SECRET` | Production | `base64-encoded-secret` | JWT signing (if local storage) |

### GitHub Secrets

Set in GitHub: Settings → Secrets and variables → Actions

| Secret Name | Value | Used In |
|-------------|-------|---------|
| `EXPO_TOKEN` | From `eas whoami` → Create token | EAS Update, EAS Build workflows |

**Create Expo Token**:
1. Run `eas whoami`
2. Follow link to create access token
3. Visit: https://expo.dev/accounts/duongdev/settings/access-tokens
4. Create token with **Read & Write** permissions
5. Copy token to GitHub Secrets

---

## Google Play Service Account Setup

### Step-by-Step Guide

#### 1. Create Service Account in Google Cloud

1. **Visit**: https://console.cloud.google.com/iam-admin/serviceaccounts
2. **Select Project**: Your Google Cloud project (same as Maps API)
3. **Click**: "Create Service Account"
4. **Fill in**:
   - Name: `nam-viet-internal-play-console`
   - Description: `Service account for EAS Submit to Play Console`
5. **Click**: "Create and Continue"
6. **Grant Role**:
   - Skip (no role needed at Google Cloud level)
   - Click "Continue"
7. **Click**: "Done"

#### 2. Create JSON Key

1. **Click** on created service account
2. **Go to**: "Keys" tab
3. **Add Key** → "Create new key"
4. **Key type**: JSON
5. **Click**: "Create"
6. **Download** JSON file (auto-downloads)
7. **Rename** to `google-play-service-account.json`

#### 3. Grant Access in Play Console

1. **Visit**: https://play.google.com/console/
2. **Go to**: Settings (gear icon) → "Users and permissions"
3. **Click**: "Invite new users"
4. **Email**: Copy email from JSON file (e.g., `nam-viet-internal-play-console@project.iam.gserviceaccount.com`)
5. **Account permissions**:
   - ✅ Admin (Releases)
   - Or specific app permissions:
     - ✅ View app information
     - ✅ Manage production releases
     - ✅ Manage testing track releases
6. **Click**: "Invite user"
7. **Accept invitation**: Check service account email (may take a few minutes)

#### 4. Place JSON File

```bash
# Move downloaded JSON to mobile app directory
cd apps/mobile
mv ~/Downloads/google-play-service-account-*.json ./google-play-service-account.json

# Verify it's gitignored
git status
# Should NOT show google-play-service-account.json
```

#### 5. Test Submit

```bash
# After your first Android production build
eas submit --platform android --profile production

# EAS will:
# 1. Read google-play-service-account.json
# 2. Authenticate to Play Console
# 3. Upload AAB to internal testing track
```

**Troubleshooting**:
- **"Forbidden" error**: Service account doesn't have permissions in Play Console
- **"Not found" error**: Service account email not added to Play Console
- **"Invalid credentials" error**: JSON file corrupted or incorrect

---

## Storage Configuration

### Vercel Blob Dev/Prod Separation

**File**: `apps/api/src/services/storage.service.ts` (or equivalent)

```typescript
// Example implementation
import { put, del } from '@vercel/blob';

// Get environment prefix
const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

export async function uploadFile(file: File, filename: string) {
  const blobPath = `${ENV_PREFIX}/attachments/${filename}`;

  const blob = await put(blobPath, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  return blob.url;
}

export async function deleteFile(url: string) {
  // Extract path from URL
  const path = new URL(url).pathname;

  // Verify it's from correct environment
  if (!path.startsWith(`/${ENV_PREFIX}/`)) {
    throw new Error(`Cannot delete file from different environment: ${path}`);
  }

  await del(url);
}
```

**Benefits**:
- ✅ Single Blob storage (simpler setup)
- ✅ Environment isolation via path prefix
- ✅ Easy to migrate to separate stores later
- ✅ Clear separation: `dev/` vs `prod/`

**Vercel Environment Variables**:
```
NODE_ENV=production  # Set in Vercel production environment
NODE_ENV=development # Set in Vercel preview environments
```

---

## Next Steps

1. **Create `eas.json`**: Copy configuration from this document
2. **Migrate to `app.config.ts`**: Replace `app.json`
3. **Set EAS Secrets**: Run `eas secret:create` for each variable
4. **Create GitHub workflows**: Add OTA update workflow
5. **Test configuration**: Run `eas build --profile staging --platform ios` (test build)
6. **Verify**: Check that builds use correct environment variables

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-01
**Related**: [Production Deployment Plan](./production-deployment-plan.md)
