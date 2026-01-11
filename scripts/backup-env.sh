#!/bin/bash

# Vercel Environment Variables Backup Script
# Exports environment variables from Vercel project
#
# Usage: ./scripts/backup-env.sh [options]
# Options:
#   --dry-run         Show what would be done without executing
#   --include-values  Include actual values (default: names only for security)
#   --output          Custom output path (default: backups/env-YYYY-MM-DD-HHMMSS.txt)
#   --environment     Target environment: production, preview, development (default: production)
#
# Environment:
#   VERCEL_TOKEN      Vercel API token (required)
#   VERCEL_PROJECT_ID Project ID (optional, uses linked project if not set)
#   VERCEL_ORG_ID     Organization/Team ID (optional)
#
# Examples:
#   ./scripts/backup-env.sh
#   ./scripts/backup-env.sh --include-values
#   ./scripts/backup-env.sh --environment preview --dry-run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
INCLUDE_VALUES=false
CUSTOM_OUTPUT=""
ENVIRONMENT="production"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
DEFAULT_OUTPUT="$BACKUP_DIR/env-$TIMESTAMP.txt"

# Parse options
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --include-values)
      INCLUDE_VALUES=true
      shift
      ;;
    --output)
      CUSTOM_OUTPUT="$2"
      shift 2
      ;;
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--dry-run] [--include-values] [--output <path>] [--environment <env>]"
      exit 1
      ;;
  esac
done

# Functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check required environment variables
check_env() {
  if [ -z "$VERCEL_TOKEN" ]; then
    log_error "VERCEL_TOKEN environment variable is not set"
    log_info "Get your token from: https://vercel.com/account/tokens"
    exit 1
  fi
  log_success "VERCEL_TOKEN is configured"
}

# Check Vercel CLI is available via npx
check_vercel_cli() {
  if ! command -v npx &> /dev/null; then
    log_error "npx is not available"
    log_info "Install Node.js to use this script"
    exit 1
  fi

  local version=$(npx vercel --version 2>/dev/null | head -1)
  if [ -z "$version" ]; then
    log_error "Vercel CLI is not available"
    log_info "Install with: pnpm add -D vercel"
    exit 1
  fi
  log_success "Vercel CLI available: $version"
}

# Validate environment value
validate_environment() {
  case "$ENVIRONMENT" in
    production|preview|development)
      log_success "Target environment: $ENVIRONMENT"
      ;;
    *)
      log_error "Invalid environment: $ENVIRONMENT"
      log_info "Valid environments: production, preview, development"
      exit 1
      ;;
  esac
}

# Create backup directory
ensure_backup_dir() {
  local output_dir

  if [ -n "$CUSTOM_OUTPUT" ]; then
    output_dir="$(dirname "$CUSTOM_OUTPUT")"
  else
    output_dir="$BACKUP_DIR"
  fi

  if [ ! -d "$output_dir" ]; then
    if [ "$DRY_RUN" = true ]; then
      log_warning "DRY RUN - would create directory: $output_dir"
    else
      mkdir -p "$output_dir"
      log_success "Created backup directory: $output_dir"
    fi
  else
    log_success "Backup directory exists: $output_dir"
  fi
}

# Export environment variables
export_env_vars() {
  local output_file

  if [ -n "$CUSTOM_OUTPUT" ]; then
    output_file="$CUSTOM_OUTPUT"
  else
    output_file="$DEFAULT_OUTPUT"
  fi

  log_info "Exporting environment variables..."
  log_info "Environment: $ENVIRONMENT"
  log_info "Output: $output_file"

  if [ "$INCLUDE_VALUES" = true ]; then
    log_warning "Including actual values (ensure output is encrypted!)"
  else
    log_info "Values will be redacted (names only)"
  fi

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN - would execute:"
    log_info "  npx vercel env pull with --environment $ENVIRONMENT"
    return
  fi

  # Create a temporary file for the full export
  local temp_file=$(mktemp)

  # Use Vercel CLI to pull environment variables
  # Note: This requires the project to be linked or VERCEL_PROJECT_ID set
  cd "$PROJECT_ROOT"

  if npx vercel env pull "$temp_file" --environment "$ENVIRONMENT" --yes --token "$VERCEL_TOKEN" 2>/dev/null; then
    log_success "Environment variables exported"
  else
    log_error "Failed to export environment variables"
    log_info "Make sure the project is linked (run 'vercel link') or set VERCEL_PROJECT_ID"
    rm -f "$temp_file"
    exit 1
  fi

  # Create the output file with header
  {
    echo "# Vercel Environment Variables Backup"
    echo "# Environment: $ENVIRONMENT"
    echo "# Exported: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
    echo "# Project Root: $PROJECT_ROOT"
    echo "#"

    if [ "$INCLUDE_VALUES" = true ]; then
      echo "# WARNING: This file contains sensitive values!"
      echo "#"
      # Copy the file as-is (removing any .env-specific headers Vercel adds)
      grep -v "^#" "$temp_file" | sort
    else
      echo "# Values are redacted for security"
      echo "# Use --include-values flag to include actual values"
      echo "#"
      # Extract just the variable names
      grep -v "^#" "$temp_file" | grep "=" | cut -d'=' -f1 | sort | while read -r var_name; do
        echo "$var_name=[REDACTED]"
      done
    fi
  } > "$output_file"

  # Clean up temp file
  rm -f "$temp_file"

  local var_count=$(grep -v "^#" "$output_file" | grep -c "=" || echo "0")
  local file_size=$(ls -lh "$output_file" | awk '{print $5}')

  log_success "Backup completed successfully"
  log_info "File: $output_file"
  log_info "Variables: $var_count"
  log_info "Size: $file_size"

  # Output the file path for downstream scripts
  echo ""
  echo "BACKUP_FILE=$output_file"
}

# Main flow
main() {
  echo ""
  log_info "Vercel Environment Backup Script"
  log_info "================================="
  echo ""

  if [ "$DRY_RUN" = true ]; then
    log_warning "Running in DRY RUN mode - no changes will be made"
    echo ""
  fi

  # Pre-flight checks
  log_info "Running pre-flight checks..."
  check_vercel_cli
  check_env
  validate_environment
  ensure_backup_dir
  echo ""

  # Export environment variables
  export_env_vars
  echo ""

  log_success "Environment backup complete!"
}

# Run main function
main
