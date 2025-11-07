# Build Number Management

Complete guide to automatic build number incrementing for OTA updates using GitHub repository variables.

**Last Updated**: 2025-11-07

---

## Overview

The NV Internal app uses a **unified build number system** that:
- ✅ Stores build number in GitHub repository variables
- ✅ Uses the **same build number** for both iOS and Android
- ✅ Auto-increments on every OTA update
- ✅ Auto-increments on every native build (via EAS)
- ✅ No manual tracking needed

### Key Features

**Single Build Number**:
- iOS `buildNumber` and Android `versionCode` are identical
- Simplifies version tracking
- Easier to communicate with team (e.g., "Build 42" not "Build 42/45")

**GitHub Variables Storage**:
- Stored in GitHub repository variables (not secrets)
- Can be viewed and manually edited in GitHub UI
- Automatically updated by workflows

**Automatic Increment**:
- Every `eas update` (OTA) → increments build number
- Every `eas build` (native) → EAS auto-increment (separate tracking)

---

## How It Works

### 1. Storage

Build number is stored as a **GitHub repository variable**:
- Variable name: `BUILD_NUMBER`
- Location: Repository → Settings → Secrets and variables → Actions → Variables tab
- Initial value: `1` (set manually)

### 2. Reading Build Number

**In app.config.ts**:
```typescript
const buildNumber = process.env.BUILD_NUMBER || '1'

export default {
  ios: {
    buildNumber: buildNumber,  // String: "42"
  },
  android: {
    versionCode: parseInt(buildNumber),  // Number: 42
  },
}
```

**Environment variable set by**:
- GitHub Actions workflows (during OTA updates)
- Local `.env` file (for local development)

### 3. Incrementing Build Number

**All workflows sync with EAS before incrementing** to ensure build numbers never decrease:

```bash
# Get current GitHub build number
GH_BUILD=$(gh variable get BUILD_NUMBER --repo ${{ github.repository }} 2>/dev/null || echo "0")

# Get EAS build numbers
EAS_IOS=$(eas build:version:get -p ios 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")
EAS_ANDROID=$(eas build:version:get -p android 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")

# Find the maximum (never decrease!)
MAX_BUILD=$GH_BUILD
if [ "$EAS_IOS" -gt "$MAX_BUILD" ]; then MAX_BUILD=$EAS_IOS; fi
if [ "$EAS_ANDROID" -gt "$MAX_BUILD" ]; then MAX_BUILD=$EAS_ANDROID; fi

# Increment from maximum
NEW_BUILD=$((MAX_BUILD + 1))

# Save back to GitHub
gh variable set BUILD_NUMBER --body "$NEW_BUILD" --repo ${{ github.repository }}
```

**This ensures**:
- ✅ Build numbers always increase
- ✅ No conflicts between OTA and native builds
- ✅ Synced across all platforms

---

## Setup Instructions

### Step 1: Create BUILD_NUMBER Variable

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **Variables** tab (NOT Secrets)
4. Click **New repository variable**
5. Set:
   - **Name**: `BUILD_NUMBER`
   - **Value**: `1` (or current build number if migrating)
6. Click **Add variable**

### Step 2: Verify Workflow Permissions

Ensure GitHub Actions has permission to update variables:

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Save

### Step 3: Test OTA Update

Trigger an OTA update to test:

```bash
# Via GitHub CLI
gh workflow run ota-update.yml -f channel=staging

# Or via GitHub UI
# Actions → OTA Update → Run workflow → Select channel: staging
```

**Expected behavior**:
1. Workflow reads `BUILD_NUMBER` (e.g., 1)
2. Increments to 2
3. Updates GitHub variable to 2
4. Publishes OTA with build number 2
5. Next OTA will use build number 3

---

## Usage

### View Current Build Number

**Via GitHub UI**:
1. Repository → Settings → Secrets and variables → Actions → Variables tab
2. Find `BUILD_NUMBER` variable

**Via GitHub CLI**:
```bash
gh variable get BUILD_NUMBER --repo duongdev/nv-internal
```

**Via API**:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/duongdev/nv-internal/actions/variables/BUILD_NUMBER
```

### Manually Set Build Number

**Via GitHub UI**:
1. Repository → Settings → Secrets and variables → Actions → Variables tab
2. Click **BUILD_NUMBER** variable
3. Update value
4. Click **Update variable**

**Via GitHub CLI**:
```bash
gh variable set BUILD_NUMBER --body "100" --repo duongdev/nv-internal
```

**When to manually set**:
- Migrating from old system
- Syncing with App Store/Play Store build numbers
- After accidentally publishing incorrect build

### Local Development

For local OTA testing, set `BUILD_NUMBER` in your environment:

**Option 1: .env file** (apps/mobile/.env):
```env
BUILD_NUMBER=999
```

**Option 2: Command line**:
```bash
BUILD_NUMBER=999 eas update --channel staging
```

---

## Workflow Details

### OTA Update Workflow

**File**: `.github/workflows/ota-update.yml`

**Increment step**:
```yaml
- name: Increment build number
  id: increment
  if: github.event.inputs.rollback != 'true'
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    echo "📈 Incrementing build number for OTA update..."

    # Get current build number from repository variable
    CURRENT_BUILD=$(gh variable get BUILD_NUMBER --repo ${{ github.repository }} || echo "0")
    NEW_BUILD=$((CURRENT_BUILD + 1))

    echo "Current build number: $CURRENT_BUILD"
    echo "New build number: $NEW_BUILD"

    # Update repository variable with new build number
    gh variable set BUILD_NUMBER --body "$NEW_BUILD" --repo ${{ github.repository }}

    echo "build_number=$NEW_BUILD" >> $GITHUB_OUTPUT
    echo "✅ Build number incremented to $NEW_BUILD"
```

**Publish step**:
```yaml
- name: Publish OTA update
  working-directory: apps/mobile
  env:
    BUILD_NUMBER: ${{ steps.increment.outputs.build_number }}
  run: |
    CHANNEL="${{ needs.preflight.outputs.channel }}"
    VERSION="${{ needs.preflight.outputs.version }}"
    BUILD="${{ steps.increment.outputs.build_number }}"

    eas update --channel "$CHANNEL" --message "Deploy v$VERSION ($BUILD) to $CHANNEL"
```

### Scheduled OTA Workflow

**File**: `.github/workflows/ota-scheduled.yml`

Same increment logic as main OTA workflow.

---

## Version Display

### In GitHub Actions Summary

After OTA publish, the workflow displays:

```
✅ OTA Update Published

Channel: production
App Version: 1.0.0
Build Number: 42
Published At: 2025-11-07 08:30:00 UTC
```

### In OTA Message

OTA updates include build number in the message:

```
Deploy v1.0.0 (42) to production
```

This appears in EAS dashboard.

### In App (Future Enhancement)

You can display the build number in your app's settings:

```typescript
import * as Application from 'expo-application'

// In Settings screen
<Text>
  Version: {Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
</Text>

// Example output: Version: 1.0.0 (42)
```

---

## Unified Build Number System

### How It Works

Both OTA and native builds now use the **same unified build number system**:

**Before each build or OTA**:
1. Query GitHub `BUILD_NUMBER`
2. Query EAS iOS `buildNumber`
3. Query EAS Android `versionCode`
4. Find the maximum of all three
5. Increment by 1
6. Use for this build/OTA
7. Save back to GitHub `BUILD_NUMBER`

### Example Timeline

```
1. Initial Setup
   - Create GitHub variable: BUILD_NUMBER = 1
   - No EAS builds yet

2. First Native Build
   - Sync: GitHub=1, EAS iOS=0, EAS Android=0 → Max=1
   - Increment: 1 → 2
   - Build with buildNumber=2
   - Save GitHub BUILD_NUMBER=2
   - EAS now has: iOS=2, Android=2

3. First OTA Update
   - Sync: GitHub=2, EAS iOS=2, EAS Android=2 → Max=2
   - Increment: 2 → 3
   - Publish OTA with build 3
   - Save GitHub BUILD_NUMBER=3
   - App shows: v1.0.0 (3)

4. Second OTA Update
   - Sync: GitHub=3, EAS iOS=2, EAS Android=2 → Max=3
   - Increment: 3 → 4
   - Publish OTA with build 4
   - Save GitHub BUILD_NUMBER=4
   - App shows: v1.0.0 (4)

5. Second Native Build
   - Sync: GitHub=4, EAS iOS=2, EAS Android=2 → Max=4
   - Increment: 4 → 5
   - Build with buildNumber=5
   - Save GitHub BUILD_NUMBER=5
   - EAS now has: iOS=5, Android=5

6. Third OTA Update
   - Sync: GitHub=5, EAS iOS=5, EAS Android=5 → Max=5
   - Increment: 5 → 6
   - Publish OTA with build 6
   - Save GitHub BUILD_NUMBER=6
   - App shows: v1.1.0 (6)
```

**Key Benefits**:
- ✅ Build numbers **always increase** (never decrease)
- ✅ **No conflicts** between OTA and native builds
- ✅ **Unified numbering**: Same number across iOS, Android, OTA
- ✅ **Automatic sync**: No manual coordination needed

---

## Troubleshooting

### Build Number Not Incrementing

**Symptom**: OTA workflow completes but build number stays the same

**Possible Causes**:
1. `BUILD_NUMBER` variable not created
2. Workflow doesn't have write permissions
3. `gh` CLI authentication failed

**Fix**:
```bash
# 1. Check if variable exists
gh variable get BUILD_NUMBER --repo duongdev/nv-internal

# 2. Check workflow permissions
# Repository → Settings → Actions → General → Workflow permissions
# Must be "Read and write permissions"

# 3. Check workflow logs for errors
gh run view <run-id> --log
```

### BUILD_NUMBER Variable Not Found

**Symptom**: Workflow fails with "variable not found" error

**Fix**:
```bash
# Create the variable
gh variable set BUILD_NUMBER --body "1" --repo duongdev/nv-internal
```

### Build Number Out of Sync

**Symptom**: GitHub variable shows different number than what's in EAS dashboard

**This is expected**:
- GitHub `BUILD_NUMBER` is for OTA updates only
- EAS remote storage is for native builds only
- They are separate systems with separate purposes

**No fix needed** - this is by design.

If you want to sync them for consistency:
```bash
# Option 1: Update GitHub variable to match EAS
eas build:version:get  # Check EAS build numbers
gh variable set BUILD_NUMBER --body "42" --repo duongdev/nv-internal

# Option 2: Update EAS to match GitHub
gh variable get BUILD_NUMBER  # Check GitHub value
eas build:version:set --platform ios  # Set EAS build number
```

### Local OTA Not Using Build Number

**Symptom**: Local `eas update` doesn't show build number

**This is expected**:
- `BUILD_NUMBER` environment variable not set locally
- Falls back to default: "1"

**Fix** (if you want local OTA to use specific build):
```bash
# Option 1: Set in .env file
echo "BUILD_NUMBER=999" >> apps/mobile/.env

# Option 2: Set in command
BUILD_NUMBER=999 eas update --channel staging
```

---

## Best Practices

### 1. Let Workflows Manage Build Numbers

**DO**:
- ✅ Let workflows auto-increment
- ✅ Only manually update for migrations or corrections

**DON'T**:
- ❌ Manually increment for every OTA
- ❌ Edit during active workflows

### 2. Unified Numbering

With unified build numbers:
- iOS and Android always have the same number
- Easier team communication: "Deploy build 42" (not "42/45")
- Simpler version tracking

### 3. Monitoring

After each OTA deployment:
1. Check GitHub Actions summary for build number
2. Verify GitHub variable was updated
3. Check EAS dashboard shows correct build in message

### 4. Rollback Strategy

If an OTA update needs rollback:
1. Don't decrement `BUILD_NUMBER`
2. Publish new OTA with next build number
3. Build numbers should always increment (never decrease)

---

## Migration from Old System

If migrating from JSON-based or other system:

### Step 1: Determine Current Build Number

Check your existing system:
- JSON file
- EAS dashboard
- App Store Connect / Google Play Console

### Step 2: Set GitHub Variable

```bash
# Set to current + 1 (since next OTA should increment)
gh variable set BUILD_NUMBER --body "42" --repo duongdev/nv-internal
```

### Step 3: Test with Staging

```bash
# Trigger staging OTA
gh workflow run ota-update.yml -f channel=staging

# Verify build number incremented to 43
gh variable get BUILD_NUMBER
```

### Step 4: Clean Up Old System

Remove old files:
- `build-number.json`
- `scripts/increment-build-number.js`
- Any other custom scripts

---

## Security Considerations

### Why Variables, Not Secrets?

**Variables** are used (not secrets) because:
- ✅ Build numbers are not sensitive information
- ✅ Need to be readable in logs for debugging
- ✅ Need to be viewable in GitHub UI
- ✅ Publicly visible in app anyway

**Secrets** would be inappropriate because:
- ❌ Can't view value in logs
- ❌ Can't easily check current value
- ❌ Overhead for non-sensitive data

### Workflow Permissions

Workflows need **Read and write permissions** to:
- Read `BUILD_NUMBER` variable
- Update `BUILD_NUMBER` variable

This is configured in: Repository → Settings → Actions → General → Workflow permissions

---

## FAQ

### Q: Why separate systems for native vs OTA builds?

**A**: Different purposes:
- **Native builds**: Submitted to app stores, tracked by EAS
- **OTA updates**: JavaScript updates, not seen by app stores

Using separate tracking systems prevents conflicts and maintains accuracy.

### Q: Can I use the same number for both?

**A**: Not recommended. Native builds and OTA updates serve different purposes:
- Native: Binary updates via app stores
- OTA: JavaScript updates via Expo

Keep them separate for clarity.

### Q: What if I need to reset build numbers?

**A**: Manually update the GitHub variable:
```bash
gh variable set BUILD_NUMBER --body "1" --repo duongdev/nv-internal
```

Only do this for major app rewrites or migrations.

### Q: How do I see build number history?

**A**: Check workflow run logs:
```bash
# List recent OTA workflow runs
gh run list --workflow ota-update.yml

# View specific run logs
gh run view <run-id> --log
```

Look for "Increment build number" step output.

### Q: Can I use this for native builds too?

**A**: Not recommended. Native builds should use EAS's built-in `autoIncrement`:
- OTA: GitHub variable (this system)
- Native: EAS remote storage (`autoIncrement: true`)

---

## Summary

### System Overview

- **Storage**: GitHub repository variable `BUILD_NUMBER`
- **Unified**: iOS and Android use same number
- **Auto-increment**: Every OTA update increments
- **Manual control**: Edit variable in GitHub UI or CLI

### Key Commands

```bash
# View build number
gh variable get BUILD_NUMBER --repo duongdev/nv-internal

# Set build number
gh variable set BUILD_NUMBER --body "42" --repo duongdev/nv-internal

# Trigger OTA (auto-increments)
gh workflow run ota-update.yml -f channel=staging

# Check workflow logs
gh run view <run-id> --log
```

### Workflow

```
1. Workflow starts → Read BUILD_NUMBER
2. Increment: BUILD_NUMBER + 1
3. Update GitHub variable
4. Publish OTA with new build number
5. Display in GitHub Actions summary
```

---

**Resources**:
- [OTA Updates Guide](./.claude/docs/ota-updates-guide.md)
- [GitHub Variables Documentation](https://docs.github.com/en/actions/learn-github-actions/variables)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)

---

**Created**: 2025-11-07
**Status**: Active
