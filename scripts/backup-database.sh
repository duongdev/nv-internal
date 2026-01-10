#!/bin/bash

# Database Backup Script
# Creates a gzipped pg_dump backup of the PostgreSQL database
#
# Usage: ./scripts/backup-database.sh [options]
# Options:
#   --dry-run    Show what would be done without executing
#   --output     Custom output path (default: backups/database-YYYY-MM-DD-HHMMSS.sql.gz)
#
# Environment:
#   DATABASE_URL  PostgreSQL connection string (required)
#
# Examples:
#   ./scripts/backup-database.sh
#   ./scripts/backup-database.sh --dry-run
#   ./scripts/backup-database.sh --output /tmp/backup.sql.gz

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
CUSTOM_OUTPUT=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
DEFAULT_OUTPUT="$BACKUP_DIR/database-$TIMESTAMP.sql.gz"

# Parse options
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --output)
      CUSTOM_OUTPUT="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--dry-run] [--output <path>]"
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
  if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    log_info "Set DATABASE_URL to your PostgreSQL connection string"
    exit 1
  fi
  log_success "DATABASE_URL is configured"
}

# Validate database connection
validate_connection() {
  log_info "Validating database connection..."

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN - skipping connection validation"
    return
  fi

  # Try to connect and run a simple query
  if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    log_success "Database connection validated"
  else
    log_error "Failed to connect to database"
    log_info "Please verify your DATABASE_URL is correct"
    exit 1
  fi
}

# Check pg_dump is available
check_pg_dump() {
  if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump is not installed or not in PATH"
    log_info "Install PostgreSQL client tools to use this script"
    exit 1
  fi

  local version=$(pg_dump --version | head -1)
  log_success "pg_dump available: $version"
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

# Run the backup
run_backup() {
  local output_file

  if [ -n "$CUSTOM_OUTPUT" ]; then
    output_file="$CUSTOM_OUTPUT"
  else
    output_file="$DEFAULT_OUTPUT"
  fi

  log_info "Starting database backup..."
  log_info "Output: $output_file"

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN - would execute:"
    log_info "  pg_dump \"\$DATABASE_URL\" | gzip > \"$output_file\""
    return
  fi

  # Run pg_dump with gzip compression
  if pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$output_file"; then
    local file_size=$(ls -lh "$output_file" | awk '{print $5}')
    log_success "Backup completed successfully"
    log_info "File: $output_file"
    log_info "Size: $file_size"

    # Output the file path for downstream scripts
    echo ""
    echo "BACKUP_FILE=$output_file"
  else
    log_error "Backup failed"
    rm -f "$output_file"
    exit 1
  fi
}

# Main flow
main() {
  echo ""
  log_info "Database Backup Script"
  log_info "======================"
  echo ""

  if [ "$DRY_RUN" = true ]; then
    log_warning "Running in DRY RUN mode - no changes will be made"
    echo ""
  fi

  # Pre-flight checks
  log_info "Running pre-flight checks..."
  check_pg_dump
  check_env
  validate_connection
  ensure_backup_dir
  echo ""

  # Run backup
  run_backup
  echo ""

  log_success "Database backup complete!"
}

# Run main function
main
