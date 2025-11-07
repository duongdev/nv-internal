# Build Number & Version Management

Complete guide to understanding and managing build numbers, app versions, and OTA update versioning in the NV Internal mobile app.

**Last Updated**: 2025-11-07

---

## Table of Contents

- [Overview](#overview)
- [Version Types](#version-types)
- [Auto-Increment Configuration](#auto-increment-configuration)
- [How It Works](#how-it-works)
- [OTA Updates vs Native Builds](#ota-updates-vs-native-builds)
- [Version Increment Commands](#version-increment-commands)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The NV Internal app uses **EAS Build's remote version management** system to automatically track and increment build numbers across both native builds and OTA updates.

### Key Configuration

```json
// apps/mobile/eas.json
{
  "cli": {
    "appVersionSource": "remote"
  },
  "build": {
    "development": { "autoIncrement": true },
    "staging": { "autoIncrement": true },
    "preview": { "autoIncrement": true },
    "production": { "autoIncrement": true }
  }
}
```

---

## Version Types

### 1. App Version (User-Facing)

**What it is**: The version number shown to users (e.g., "1.0.0")

**Where it's set**: `apps/mobile/app.config.ts`

```typescript
export default {
  version: '1.0.0',  // User-facing version
  // ...
}
```

**When to change**:
- Major feature releases
- Breaking changes
- Significant updates

**Format**: Semantic versioning (MAJOR.MINOR.PATCH)
- MAJOR: Breaking changes or major redesign
- MINOR: New features, non-breaking
- PATCH: Bug fixes

### 2. Build Number (iOS) / Version Code (Android)

**What it is**: Developer-facing build identifier that increments with every build

**iOS**: `buildNumber` (e.g., 1, 2, 3, ...)
**Android**: `versionCode` (e.g., 1, 2, 3, ...)

**Where it's managed**: EAS Build remote storage (automatic)

**When it increments**:
- Every `eas build` command (native builds)
- Automatically with `autoIncrement: true`

### 3. Runtime Version

**What it is**: Determines which OTA updates are compatible with which builds

**Where it's set**: `apps/mobile/app.config.ts`

```typescript
export default {
  runtimeVersion: {
    policy: 'appVersion'  // Ties runtime version to app version
  }
}
```

**Compatibility**:
```
App Version 1.0.0 → Runtime Version "1.0.0" → Can receive OTA for 1.0.0 only
App Version 1.0.1 → Runtime Version "1.0.1" → Can receive OTA for 1.0.1 only
```

### 4. Update Group ID (OTA Updates)

**What it is**: Unique identifier for each OTA update deployment

**Format**: UUID (e.g., `a1b2c3d4-e5f6-...`)

**Where it's tracked**: EAS Update dashboard

**When it's created**: Every `eas update` command

---

## Auto-Increment Configuration

### Current Setup ✅

All build profiles in `eas.json` have auto-increment enabled:

| Profile | Auto-Increment | Use Case |
|---------|---------------|----------|
| `development` | ✅ Yes | Local dev builds |
| `staging` | ✅ Yes | Internal testing |
| `preview` | ✅ Yes | Beta testing |
| `production` | ✅ Yes | App store releases |

### How Auto-Increment Works

1. **First Build**: EAS reads version from `app.config.ts`
   - iOS: Uses `ios.buildNumber` if set, otherwise starts at 1
   - Android: Uses `android.versionCode` if set, otherwise starts at 1

2. **Subsequent Builds**: EAS auto-increments from remote storage
   - iOS: 1 → 2 → 3 → ...
   - Android: 1 → 2 → 3 → ...

3. **Storage**: EAS stores current build numbers in cloud
   - Independent per build profile
   - Shared across team members

---

## How It Works

### Native Builds (eas build)

```bash
# Production build with auto-increment
eas build --platform ios --profile production
```

**What happens**:
1. ✅ EAS fetches current build number from remote (e.g., 42)
2. ✅ Increments build number (42 → 43)
3. ✅ Builds app with new build number
4. ✅ Stores new build number (43) back to remote
5. ✅ App submitted has buildNumber = 43

**Result**:
- iOS: CFBundleVersion = "43"
- Android: versionCode = 43

### OTA Updates (eas update)

```bash
# OTA update for production channel
eas update --channel production --message "Fix critical bug"
```

**What happens**:
1. ✅ EAS creates new update group (UUID)
2. ✅ Uses current runtime version from app.config.ts
3. ✅ Publishes JavaScript bundle to channel
4. ❌ Does NOT increment build number (not a native build)

**Result**:
- Update Group ID: `a1b2c3d4-...`
- Runtime Version: "1.0.0" (from app.config.ts)
- No build number change

---

## OTA Updates vs Native Builds

### Build Number Behavior

| Action | Build Number Changes? | How to Track |
|--------|----------------------|--------------|
| `eas build` | ✅ Yes (auto-increments) | iOS: buildNumber<br>Android: versionCode |
| `eas update` | ❌ No | Update Group ID |

### Why OTA Updates Don't Increment Build Numbers

**OTA updates are NOT native builds**:
- They only update JavaScript/TypeScript code and assets
- They don't change native code or app binaries
- App stores don't see them as new builds
- Build numbers are for native builds only

**OTA updates use different versioning**:
- **Update Group ID**: Unique UUID for each deployment
- **Runtime Version**: Compatibility constraint
- **Message**: Human-readable description
- **Timestamp**: Deployment time

### Tracking OTA Update Iterations

If you want to track OTA update versions, use these strategies:

#### 1. Update Messages (Recommended)

```bash
# Include iteration info in message
eas update --channel production --message "v1.0.0-ota.1: Fix login bug"
eas update --channel production --message "v1.0.0-ota.2: Improve performance"
eas update --channel production --message "v1.0.0-ota.3: Update translations"
```

#### 2. Git Tags

```bash
# Tag each OTA deployment
git tag ota/1.0.0/001
git tag ota/1.0.0/002
git push --tags
```

#### 3. Update Group IDs

EAS automatically creates unique Update Group IDs - view them in the EAS dashboard.

---

## Version Increment Commands

### Manual Version Management

#### View Current Remote Versions

```bash
# Check what EAS has stored
eas build:version:get

# Output example:
# iOS buildNumber: 43
# Android versionCode: 43
```

#### Manually Set Build Number

```bash
# Set specific build number for iOS
eas build:version:set --platform ios

# Prompts:
# ? What version would you like to set? 100
# ? Set buildNumber to "100"? Yes
```

#### Sync Remote to Local

```bash
# Update local app.config.ts with remote versions
eas build:version:sync

# This updates:
# - ios.buildNumber in app.config.ts
# - android.versionCode in app.config.ts
```

#### Set Version Source

```bash
# Switch to remote version source (already configured)
eas build:version:set --source remote

# Or use local source (not recommended with autoIncrement)
eas build:version:set --source local
```

---

## Best Practices

### 1. Version Naming Convention

**App Version** (user-facing):
```
1.0.0 → Initial release
1.1.0 → New features (minor)
1.1.1 → Bug fixes (patch)
2.0.0 → Major redesign (major)
```

**OTA Update Messages**:
```
"v1.0.0-ota.1: Fix critical login bug"
"v1.0.0-ota.2: Improve task list performance"
"v1.0.0-ota.3: Update Vietnamese translations"
```

### 2. Build Number Management

**DO**:
- ✅ Use `autoIncrement: true` for all profiles
- ✅ Let EAS manage build numbers automatically
- ✅ Use `appVersionSource: "remote"` for consistency
- ✅ Track OTA updates via messages and Update Group IDs

**DON'T**:
- ❌ Manually set build numbers in app.config.ts
- ❌ Try to increment build numbers for OTA updates
- ❌ Mix local and remote version sources
- ❌ Reuse build numbers across platforms

### 3. When to Increment App Version

Increment app version when:
1. **Major Release**: New major feature set
2. **Breaking Change**: API changes, removed features
3. **New Native Build**: Submitting to app stores
4. **Runtime Incompatibility**: Native code changes

Keep app version the same when:
1. **Bug Fixes**: Small fixes via OTA
2. **UI Tweaks**: Visual improvements
3. **Copy Changes**: Text updates
4. **Performance**: Code optimizations

### 4. Version Strategy for OTA Updates

**Recommended workflow**:

```bash
# 1. Release v1.0.0 to app stores
eas build --platform all --profile production

# 2. Push bug fixes via OTA (same version)
eas update --channel production --message "v1.0.0-ota.1: Fix login"
eas update --channel production --message "v1.0.0-ota.2: Fix search"

# 3. When native changes needed, bump version
# Edit app.config.ts: version: "1.1.0"
eas build --platform all --profile production

# 4. New OTA updates for v1.1.0
eas update --channel production --message "v1.1.0-ota.1: Add feature"
```

### 5. Testing Version Increments

**Before first production build**:

```bash
# 1. Build staging to test auto-increment
eas build --platform ios --profile staging

# 2. Check remote version
eas build:version:get

# 3. Build again - should increment
eas build --platform ios --profile staging

# 4. Verify increment
eas build:version:get
```

---

## Troubleshooting

### Build Number Not Incrementing

**Symptom**: Build number stays the same across builds

**Possible Causes**:
1. `autoIncrement: false` or missing in build profile
2. Using local version source instead of remote
3. Build failed before version was saved

**Fix**:
```bash
# 1. Check eas.json configuration
cat apps/mobile/eas.json | grep -A2 "autoIncrement"

# 2. Verify version source
eas build:version:get

# 3. Manually increment if needed
eas build:version:set --platform ios
```

### OTA Update Version Mismatch

**Symptom**: Users not receiving OTA updates

**Possible Causes**:
1. Runtime version mismatch (app version different)
2. Wrong channel (staging vs production)
3. Update not published yet

**Fix**:
```bash
# 1. Check runtime version in app.config.ts
grep -A2 "runtimeVersion" apps/mobile/app.config.ts

# 2. Verify channel in EAS dashboard
# Go to expo.dev → Updates

# 3. Check user's app version in Settings → About
```

### Different Build Numbers Across Platforms

**Symptom**: iOS buildNumber = 45, Android versionCode = 50

**This is normal**:
- Build numbers increment independently per platform
- iOS and Android are separate products
- Each platform has its own submission history

**To sync them**:
```bash
# Set iOS to match Android
eas build:version:set --platform ios
# Enter: 50

# Or set Android to match iOS
eas build:version:set --platform android
# Enter: 45
```

### Build Number Too Low After Manual Edit

**Symptom**: Edited app.config.ts buildNumber but EAS uses different value

**Cause**: Remote version source overrides local

**Fix**:
```bash
# Option 1: Update remote to match local
eas build:version:set --platform ios
# Enter value from app.config.ts

# Option 2: Sync local to remote (recommended)
eas build:version:sync
```

### Cannot Find Remote Version

**Symptom**: `eas build:version:get` shows "No version found"

**Cause**: Never built with this profile before

**Fix**:
```bash
# First build will initialize remote version
eas build --platform ios --profile production

# After build completes, check again
eas build:version:get
```

---

## Summary

### Native Builds
- ✅ Auto-increment enabled for all profiles
- ✅ Build numbers managed by EAS remote storage
- ✅ Independent per platform (iOS / Android)
- ✅ Increments every `eas build` command

### OTA Updates
- ❌ Do NOT increment build numbers
- ✅ Use Update Group IDs for tracking
- ✅ Tied to runtime version (app version)
- ✅ Track iterations via messages and tags

### Workflows
- **Native Build**: `eas build` → auto-increments build number
- **OTA Update**: `eas update` → creates new update group
- **Version Check**: `eas build:version:get` → view current versions
- **Manual Set**: `eas build:version:set` → override if needed

### Key Commands

```bash
# View current versions
eas build:version:get

# Manually set build number
eas build:version:set --platform ios

# Sync remote to local
eas build:version:sync

# Build with auto-increment
eas build --platform all --profile production

# OTA update (no build number change)
eas update --channel production --message "Description"
```

---

**Resources**:
- [EAS Build Version Management](https://docs.expo.dev/build-reference/app-versions/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Runtime Versions Guide](https://docs.expo.dev/distribution/runtime-versions/)
- [OTA Updates Guide](./.claude/docs/ota-updates-guide.md)

---

**Created**: 2025-11-07
**Status**: Active
