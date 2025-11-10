#!/bin/bash

# OTA Update Publishing Script
# Usage: ./scripts/publish-ota.sh [channel] [options]
# Examples:
#   ./scripts/publish-ota.sh staging
#   ./scripts/publish-ota.sh production --skip-checks
#   ./scripts/publish-ota.sh preview --notify

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHANNEL="${1:-staging}"
SKIP_CHECKS=false
NOTIFY=false
DRY_RUN=false

# Parse options
shift || true
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-checks)
      SKIP_CHECKS=true
      shift
      ;;
    --notify)
      NOTIFY=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# Validate channel
validate_channel() {
  case "$CHANNEL" in
    staging|preview|production)
      log_success "Channel: $CHANNEL"
      ;;
    *)
      log_error "Invalid channel: $CHANNEL"
      log_info "Valid channels: staging, preview, production"
      exit 1
      ;;
  esac
}

# Check EXPO_TOKEN
check_token() {
  if [ -z "$EXPO_TOKEN" ]; then
    log_error "EXPO_TOKEN not set"
    log_info "Set EXPO_TOKEN environment variable or run: eas login"
    exit 1
  fi
  log_success "EXPO_TOKEN is configured"
}

# Get app version
get_app_version() {
  if [ ! -f "apps/mobile/app.config.ts" ]; then
    log_error "app.config.ts not found"
    exit 1
  fi

  VERSION=$(grep -m1 '"version"' apps/mobile/app.config.ts | cut -d'"' -f4)
  if [ -z "$VERSION" ]; then
    log_error "Could not extract version from app.config.ts"
    exit 1
  fi

  log_success "App version: $VERSION"
  echo "$VERSION"
}

# Get and increment build number
get_build_number() {
  log_info "Getting build number from GitHub..."

  # Check if gh CLI is installed
  if ! command -v gh &> /dev/null; then
    log_warning "GitHub CLI (gh) not found - using timestamp as build number"
    echo "$(date +%s)"
    return
  fi

  # Try to get build number from GitHub variable
  if [ -n "$GH_TOKEN" ] || [ -n "$GITHUB_TOKEN" ]; then
    BUILD=$(gh variable get BUILD_NUMBER --repo "${GITHUB_REPOSITORY:-duongdev/nv-internal}" 2>/dev/null || echo "")

    if [ -n "$BUILD" ] && [[ "$BUILD" =~ ^[0-9]+$ ]]; then
      NEW_BUILD=$((BUILD + 1))

      # Try to update GitHub variable if not in CI
      if [ -z "$CI" ]; then
        gh variable set BUILD_NUMBER --body "$NEW_BUILD" --repo "${GITHUB_REPOSITORY:-duongdev/nv-internal}" 2>/dev/null || log_warning "Could not update BUILD_NUMBER in GitHub"
      fi

      log_success "Build number: $NEW_BUILD"
      echo "$NEW_BUILD"
      return
    fi
  fi

  # Fallback to timestamp
  log_warning "Could not get BUILD_NUMBER from GitHub - using timestamp"
  echo "$(date +%s)"
}

# Run quality checks
run_quality_checks() {
  if [ "$SKIP_CHECKS" = true ]; then
    log_warning "Skipping quality checks"
    return
  fi

  log_info "Running quality checks..."

  # TypeScript check
  log_info "Checking TypeScript..."
  pnpm -w tsc -b apps/mobile/tsconfig.json --pretty false || {
    log_error "TypeScript check failed"
    exit 1
  }
  log_success "TypeScript check passed"

  # Biome lint and format
  log_info "Running Biome checks..."
  pnpm biome check apps/mobile/ || {
    log_error "Biome check failed"
    exit 1
  }
  log_success "Biome checks passed"

  log_success "Quality checks passed"
}

# Check git status
check_git_status() {
  if [ "$(git status --porcelain)" ]; then
    log_warning "Uncommitted changes detected"
    log_info "Commit your changes before publishing OTA"
    exit 1
  fi
  log_success "Git working directory is clean"
}

# Publish OTA
publish_ota() {
  local version=$1
  local build=$2

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN - would execute:"
    log_info "cd apps/mobile && eas update --channel $CHANNEL --message \"Deploy v$version ($build) to $CHANNEL\" --non-interactive"
    return
  fi

  log_info "Publishing OTA update to $CHANNEL..."

  cd apps/mobile

  if eas update --channel "$CHANNEL" --message "Deploy v$version ($build) to $CHANNEL" --non-interactive; then
    log_success "OTA published successfully"
    cd - > /dev/null
    return 0
  else
    log_error "OTA publication failed"
    cd - > /dev/null
    return 1
  fi
}

# Send notification
send_notification() {
  if [ "$NOTIFY" != true ]; then
    return
  fi

  local version=$1

  # Try to send to Slack if webhook is configured
  if [ -n "$SLACK_WEBHOOK" ]; then
    log_info "Sending Slack notification..."

    curl -s -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \"OTA Update Published\",
        \"blocks\": [
          {
            \"type\": \"section\",
            \"text\": {
              \"type\": \"mrkdwn\",
              \"text\": \"✅ OTA Update Published\n\nChannel: \`$CHANNEL\`\nVersion: \`$version\`\nTime: $(date)\"
            }
          }
        ]
      }" > /dev/null || log_warning "Failed to send Slack notification"

    log_success "Slack notification sent"
  fi
}

# Create deployment record
create_deployment_record() {
  local version=$1
  local timestamp=$(date -u +'%Y-%m-%d %H:%M:%S UTC')
  local commit=$(git rev-parse --short HEAD)

  local record_file=".deployments/ota-$(date +%Y%m%d-%H%M%S).json"
  mkdir -p .deployments

  cat > "$record_file" <<EOF
{
  "type": "ota",
  "channel": "$CHANNEL",
  "version": "$version",
  "timestamp": "$timestamp",
  "commit": "$commit",
  "user": "$(whoami)",
  "host": "$(hostname)"
}
EOF

  log_success "Deployment record created: $record_file"
}

# Main flow
main() {
  log_info "Starting OTA update process..."
  echo ""

  # Pre-flight checks
  log_info "Running pre-flight checks..."
  validate_channel
  check_token
  check_git_status
  echo ""

  # Get version and build number
  VERSION=$(get_app_version)
  BUILD=$(get_build_number)
  echo ""

  # Quality checks
  run_quality_checks
  echo ""

  # Summary
  log_info "Ready to publish OTA:"
  log_info "  Channel: $CHANNEL"
  log_info "  Version: $VERSION"
  log_info "  Build: $BUILD"
  log_info "  Dry Run: $DRY_RUN"
  log_info "  Notify: $NOTIFY"
  echo ""

  if [ "$DRY_RUN" != true ]; then
    read -p "Proceed with OTA publication? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_warning "Cancelled"
      exit 0
    fi
  fi

  echo ""

  # Publish
  publish_ota "$VERSION" "$BUILD" || exit 1
  echo ""

  # Post-publish
  create_deployment_record "$VERSION"
  send_notification "$VERSION"

  echo ""
  log_success "OTA update complete!"
  log_info "Users will receive the update on next app launch"
  log_info "Monitor at: https://expo.dev"
}

# Run main function
main
