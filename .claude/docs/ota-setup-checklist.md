# OTA Updates Setup Checklist

Step-by-step guide to configure OTA updates in your GitHub Actions pipeline.

## Prerequisites ✅

- Expo account (https://expo.dev)
- GitHub repository access
- EXPO_TOKEN authentication
- App built and deployed (at least one version in stores)

---

## Phase 1: Get EXPO_TOKEN

### Step 1: Create EXPO_TOKEN

1. Go to https://expo.dev/settings/access-tokens
2. Click "Create token"
3. **Name**: `GitHub CI/CD` (or your preference)
4. **Scope**: Choose "Full access" for CI/CD use
5. Click "Create"
6. Copy the token to clipboard (you won't see it again!)

### Step 2: Add to GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** tab
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. **Name**: `EXPO_TOKEN` (exactly)
6. **Value**: Paste your token from step 1
7. Click **Add secret**

**Verify**: You should see `EXPO_TOKEN` listed (value hidden)

---

## Phase 2: Configure Workflows

### Step 1: Create Workflow Files

The following files are already in place:

- `.github/workflows/ota-update.yml` - Main OTA workflow ✅
- `.github/workflows/ota-scheduled.yml` - Optional nightly OTA ✅
- `scripts/publish-ota.sh` - CLI script for local publishing ✅

### Step 2: Review Workflow Configuration

**Main OTA Workflow** (`.github/workflows/ota-update.yml`):

- **Triggers**: Manual dispatch + auto on push to main
- **Channels**: staging, preview, production
- **Quality checks**: TypeScript, Biome, tests
- **Rollback support**: Can revert to previous OTA
- **Notifications**: Slack/Discord (optional)

**Scheduled Workflow** (`.github/workflows/ota-scheduled.yml`):

- **Schedule**: 2 AM UTC weekdays (optional)
- **Auto-publish**: Only publishes to staging
- **Change detection**: Checks for code changes

---

## Phase 3: Configure Optional Features

### Enable Slack Notifications

1. Create Slack Webhook:
   - Go to https://api.slack.com/apps
   - Create New App → From scratch
   - Name: "GitHub OTA Updates"
   - Channel: Choose workspace
   - Go to "Incoming Webhooks"
   - Click "Add New Webhook to Workspace"
   - Select channel (e.g., #deployments)
   - Copy webhook URL

2. Add to GitHub Secrets:
   - Repository Settings → Secrets and variables → Actions
   - New secret: `SLACK_WEBHOOK`
   - Value: Paste webhook URL from step 1

### Enable Discord Notifications

1. Create Discord Webhook:
   - Right-click channel → Edit Channel
   - Integrations → Webhooks
   - Create Webhook
   - Copy webhook URL

2. Add to GitHub Secrets:
   - Repository Settings → Secrets and variables → Actions
   - New secret: `DISCORD_WEBHOOK`
   - Value: Paste webhook URL

---

## Phase 4: Verify Setup

### Test 1: Check EXPO_TOKEN

```bash
# Export token (or ensure it's in .env.local)
export EXPO_TOKEN="your_token_here"

# Verify token works
npx expo whoami
# Should show your Expo account
```

### Test 2: Test Local OTA Publishing

```bash
# Build dependencies
pnpm install
pnpm -w --filter @nv-internal/prisma-client --filter @nv-internal/validation run build

# Test publish to staging (dry run)
./scripts/publish-ota.sh staging --dry-run

# If successful, try real publish
./scripts/publish-ota.sh staging
```

### Test 3: Verify on EAS Dashboard

1. Go to https://expo.dev
2. Click your project
3. Click "Updates" tab
4. You should see the published OTA
5. Note the timestamp and deployment ID

### Test 4: Test GitHub Workflow Manually

1. Go to GitHub repository
2. Click "Actions" tab
3. Find "OTA Update" workflow
4. Click "Run workflow"
5. Select channel: staging
6. Click "Run workflow" (green button)
7. Watch the workflow execute
8. Verify success in GitHub logs

---

## Phase 5: Production Readiness

### Pre-Production Checklist

- [ ] EXPO_TOKEN configured in GitHub Secrets
- [ ] Workflow files in place (`.github/workflows/ota-update.yml`)
- [ ] Tested local OTA publish with `./scripts/publish-ota.sh`
- [ ] Tested GitHub workflow trigger
- [ ] Verified update appears on EAS dashboard
- [ ] Slack/Discord webhooks configured (if using)
- [ ] Test app installed and verified (can receive OTA)
- [ ] Rollback procedures documented
- [ ] Team trained on OTA process

### Documentation for Team

Share with your team:
- `.claude/docs/ota-updates-guide.md` - Complete guide
- `.claude/docs/ota-setup-checklist.md` - This checklist
- How to trigger manual OTA: Via GitHub Actions → Run workflow
- Monitoring dashboard: https://expo.dev

---

## Phase 6: First OTA Update

### Step 1: Prepare Code

```bash
# Make your changes
git add .
git commit -m "fix: critical bug in task list"
git push origin develop
```

### Step 2: Test on Staging

```bash
# Trigger OTA to staging
gh workflow run ota-update.yml -f channel=staging
```

Or via UI:
1. Go to Actions → OTA Update
2. Click "Run workflow"
3. Select channel: staging
4. Click "Run workflow"

### Step 3: QA Verification

- [ ] QA team installs staging build (if not already)
- [ ] Wait 24h or force refresh in app
- [ ] Verify update installed
- [ ] Test the changes
- [ ] No regressions found

### Step 4: Promote to Production

```bash
# Once staging is validated, publish to production
gh workflow run ota-update.yml -f channel=production
```

Or wait for automatic publish on merge to main:
```bash
# Merge develop into main
git checkout main
git pull origin main
git merge develop
git push origin main

# OTA automatically publishes to production!
```

### Step 5: Monitor Production

- [ ] Check EAS dashboard for deployment status
- [ ] Monitor PostHog for error rate increase
- [ ] Watch Slack/Discord for notifications
- [ ] Wait 24h for users to receive update
- [ ] Verify no spike in crash reports
- [ ] Document in deployment record

---

## Troubleshooting

### EXPO_TOKEN Not Working

```
Error: Invalid token
```

**Fix**:
1. Go to https://expo.dev/settings/access-tokens
2. Create new token (old one might be revoked)
3. Update GitHub secret with new token
4. Retry workflow

### Workflow Fails in "Publish OTA" Step

**Check logs**:
```bash
gh run view <run-id> --log
```

**Common issues**:
- Network timeout: Retry (usually works)
- Out of storage: Clean caches
- Token invalid: Update token
- Version mismatch: Check app.config.ts version

### Users Not Receiving Update

**Check**:
1. Is update in "Published" state on EAS dashboard?
2. Are users on correct app version?
3. Have they restarted app?

**Fix**:
1. Verify update URL in app.config.ts: `https://u.expo.dev/efc85258-12ce-4f6a-826a-ab5765d18ebc`
2. Verify channel matches build profile
3. Ask users to restart app (pull-to-refresh)
4. Can manually trigger update with feature flag

### Need to Rollback

```bash
# Option 1: Via GitHub workflow
gh workflow run ota-update.yml \
  -f channel=production \
  -f rollback=true

# Option 2: Via EAS dashboard (easiest)
# Go to https://expo.dev
# Click project → Updates
# Find bad deployment → Click Rollback
# Select previous version → Confirm
```

---

## Advanced Configuration

### Custom Notification Templates

Edit `.github/workflows/ota-update.yml` and modify the Slack/Discord sections:

```yaml
- name: Send to Slack
  if: secrets.SLACK_WEBHOOK && needs.publish-ota.result == 'success'
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Custom notification text",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Custom Message*\n\nChannel: ${{ needs.preflight.outputs.channel }}"
            }
          }
        ]
      }
```

### Auto-Publish to Multiple Channels

Create multiple workflows that publish to different channels:

```bash
# .github/workflows/ota-staging.yml
npx expo publish --channel staging

# .github/workflows/ota-preview.yml
npx expo publish --channel preview

# .github/workflows/ota-production.yml
npx expo publish --channel production
```

### Progressive Rollout

Use PostHog feature flags for gradual rollout:

```typescript
// Instead of releasing 100% in OTA:
// 1. Publish OTA with feature behind flag
// 2. Flag starts at 10% rollout
// 3. Gradually increase to 50%, then 100%
// 4. Users receive update automatically
// 5. Feature gradually becomes visible

const { isEnabled } = useFeatureFlag('new_feature')
return isEnabled ? <NewFeature /> : <OldFeature />
```

---

## Security Best Practices

1. **Rotate EXPO_TOKEN Regularly**
   - Generate new token every 3-6 months
   - Revoke old token
   - Update GitHub secret

2. **Limit Token Scope**
   - Use "Full access" only for CI/CD
   - Never share token

3. **Audit OTA Deployments**
   - Check EAS dashboard monthly
   - Review what was published
   - Track who published it

4. **Secure Rollbacks**
   - Document rollback approvers
   - Require approval for production rollbacks
   - Keep audit trail

---

## Monitoring & Maintenance

### Weekly Checklist

- [ ] Check EAS dashboard for deployments
- [ ] Review GitHub Actions logs for failures
- [ ] Monitor PostHog for error spikes
- [ ] Check Slack/Discord for notifications

### Monthly Tasks

- [ ] Review OTA deployment records
- [ ] Update documentation if needed
- [ ] Audit GitHub Actions permissions
- [ ] Test rollback procedure

### Quarterly Tasks

- [ ] Rotate EXPO_TOKEN
- [ ] Review and update rollback procedures
- [ ] Train new team members
- [ ] Optimize workflow performance

---

## Resources

- **Expo Updates Documentation**: https://docs.expo.dev/build/updates/
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **EAS Dashboard**: https://expo.dev
- **OTA Updates Guide**: `.claude/docs/ota-updates-guide.md`

---

## Next Steps

1. ✅ Complete Phase 1 (Get EXPO_TOKEN)
2. ✅ Complete Phase 2 (Workflow files - already done)
3. ✅ Complete Phase 3 (Optional features)
4. ✅ Complete Phase 4 (Verify setup)
5. Run Phase 5 (Production readiness check)
6. Execute Phase 6 (First OTA update)
7. Implement monitoring from Troubleshooting section
8. Schedule maintenance tasks

---

**Created**: 2025-11-07
**Last Updated**: 2025-11-07
**Status**: Ready for Implementation
