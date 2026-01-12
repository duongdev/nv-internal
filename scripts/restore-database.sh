#!/bin/bash

# Database Restore Script
# Restores a PostgreSQL database from a backup file
#
# CRITICAL: This script WILL OVERWRITE existing data in the target database.
# Use with extreme caution, especially in production environments.
#
# Usage: ./scripts/restore-database.sh <backup-file> [options]
# Options:
#   --confirm    REQUIRED: Confirm you want to restore (safety measure)
#   --dry-run    Show what would be done without executing
#   --no-drop    Skip dropping existing tables (merge restore)
#
# Supported formats:
#   - .sql.gz        Compressed SQL dump
#   - .sql.gz.gpg    Encrypted compressed SQL dump
#   - .sql           Plain SQL dump
#
# Environment:
#   DATABASE_URL           PostgreSQL connection string (required)
#   BACKUP_ENCRYPTION_KEY  Passphrase for decryption (required if .gpg file)
#
# Examples:
#   ./scripts/restore-database.sh backups/database-2024-01-01-120000.sql.gz --confirm
#   ./scripts/restore-database.sh backups/database-2024-01-01-120000.sql.gz.gpg --confirm
#   ./scripts/restore-database.sh backup.sql.gz --dry-run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_FILE=""
CONFIRMED=false
DRY_RUN=false
NO_DROP=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --confirm)
      CONFIRMED=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --no-drop)
      NO_DROP=true
      shift
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 <backup-file> --confirm [--dry-run] [--no-drop]"
      exit 1
      ;;
    *)
      if [ -z "$BACKUP_FILE" ]; then
        BACKUP_FILE="$1"
      else
        echo -e "${RED}Unexpected argument: $1${NC}"
        exit 1
      fi
      shift
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

log_critical() {
  echo -e "${RED}[CRITICAL]${NC} $1"
}

# Check backup file argument
check_backup_file() {
  if [ -z "$BACKUP_FILE" ]; then
    log_error "No backup file specified"
    echo "Usage: $0 <backup-file> --confirm [--dry-run] [--no-drop]"
    exit 1
  fi

  if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file does not exist: $BACKUP_FILE"
    exit 1
  fi

  # Validate file format
  local valid_format=false
  if [[ "$BACKUP_FILE" == *.sql.gz.gpg ]] || \
     [[ "$BACKUP_FILE" == *.sql.gz ]] || \
     [[ "$BACKUP_FILE" == *.sql ]]; then
    valid_format=true
  fi

  if [ "$valid_format" = false ]; then
    log_error "Unsupported file format: $BACKUP_FILE"
    log_info "Supported formats: .sql.gz.gpg, .sql.gz, .sql"
    exit 1
  fi

  local file_size=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
  log_success "Backup file: $BACKUP_FILE ($file_size)"
}

# Check confirmation flag
check_confirmation() {
  if [ "$DRY_RUN" = true ]; then
    return
  fi

  if [ "$CONFIRMED" = false ]; then
    echo ""
    log_critical "========================================="
    log_critical "         PRODUCTION RESTORE WARNING"
    log_critical "========================================="
    echo ""
    log_warning "This operation WILL OVERWRITE all existing data!"
    log_warning "Target database will be restored from: $BACKUP_FILE"
    echo ""
    log_info "To proceed, add the --confirm flag:"
    log_info "  $0 $BACKUP_FILE --confirm"
    echo ""
    log_info "To preview what would happen, use --dry-run:"
    log_info "  $0 $BACKUP_FILE --dry-run"
    echo ""
    exit 1
  fi
}

# Check required environment variables
check_env() {
  if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    log_info "Set DATABASE_URL to your PostgreSQL connection string"
    exit 1
  fi
  log_success "DATABASE_URL is configured"

  # Check encryption key if file is encrypted
  if [[ "$BACKUP_FILE" == *.gpg ]]; then
    if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
      log_error "BACKUP_ENCRYPTION_KEY environment variable is not set"
      log_info "Required for decrypting .gpg files"
      exit 1
    fi
    log_success "BACKUP_ENCRYPTION_KEY is configured"
  fi
}

# Check PostgreSQL tools
check_psql() {
  if ! command -v psql &> /dev/null; then
    log_error "psql is not installed or not in PATH"
    log_info "Install PostgreSQL client tools to use this script"
    exit 1
  fi

  local version=$(psql --version | head -1)
  log_success "psql available: $version"
}

# Check GPG if needed
check_gpg() {
  if [[ "$BACKUP_FILE" != *.gpg ]]; then
    return
  fi

  if ! command -v gpg &> /dev/null; then
    log_error "GPG is not installed (required for encrypted files)"
    log_info "Install GPG: macOS: brew install gnupg, Ubuntu: sudo apt-get install gnupg"
    exit 1
  fi

  local version=$(gpg --version | head -1)
  log_success "GPG available: $version"
}

# Validate database connection
validate_connection() {
  log_info "Validating database connection..."

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN - skipping connection validation"
    return
  fi

  if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    log_success "Database connection validated"
  else
    log_error "Failed to connect to database"
    log_info "Please verify your DATABASE_URL is correct"
    exit 1
  fi
}

# Extract database info for display
get_database_info() {
  # Parse DATABASE_URL to extract host (for display only, not connection)
  local db_host=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
  local db_name=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

  if [ -n "$db_host" ] && [ -n "$db_name" ]; then
    log_info "Target: $db_name @ $db_host"
  fi
}

# Prepare file for restore (decrypt/decompress as needed)
prepare_restore_file() {
  local input_file="$BACKUP_FILE"
  local temp_dir=$(mktemp -d)
  local sql_file=""

  # Track files for cleanup
  TEMP_FILES=("$temp_dir")

  # Step 1: Decrypt if encrypted
  if [[ "$input_file" == *.gpg ]]; then
    local decrypted_file="$temp_dir/$(basename "${input_file%.gpg}")"

    log_info "Decrypting backup file..."

    if [ "$DRY_RUN" = true ]; then
      log_warning "DRY RUN - would decrypt to: $decrypted_file"
      echo "$decrypted_file"
      return
    fi

    if echo "$BACKUP_ENCRYPTION_KEY" | gpg \
      --decrypt \
      --batch \
      --yes \
      --passphrase-fd 0 \
      --output "$decrypted_file" \
      "$input_file" 2>/dev/null; then
      log_success "Decryption successful"
      input_file="$decrypted_file"
    else
      log_error "Decryption failed - check your encryption key"
      rm -rf "$temp_dir"
      exit 1
    fi
  fi

  # Step 2: Decompress if gzipped
  if [[ "$input_file" == *.gz ]]; then
    local decompressed_file="$temp_dir/$(basename "${input_file%.gz}")"

    log_info "Decompressing backup file..."

    if [ "$DRY_RUN" = true ]; then
      log_warning "DRY RUN - would decompress to: $decompressed_file"
      echo "$decompressed_file"
      return
    fi

    if gunzip -c "$input_file" > "$decompressed_file"; then
      log_success "Decompression successful"
      sql_file="$decompressed_file"
    else
      log_error "Decompression failed"
      rm -rf "$temp_dir"
      exit 1
    fi
  else
    sql_file="$input_file"
  fi

  echo "$sql_file"
}

# Clean up temporary files
cleanup() {
  if [ -n "${TEMP_FILES[*]}" ]; then
    for temp_item in "${TEMP_FILES[@]}"; do
      if [ -e "$temp_item" ]; then
        rm -rf "$temp_item"
      fi
    done
  fi
}

# Set trap for cleanup
trap cleanup EXIT

# Drop existing schema (optional)
drop_existing_schema() {
  if [ "$NO_DROP" = true ]; then
    log_warning "Skipping schema drop (--no-drop specified)"
    return
  fi

  log_info "Preparing database (dropping existing public schema)..."

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN - would drop and recreate public schema"
    return
  fi

  if psql "$DATABASE_URL" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" > /dev/null 2>&1; then
    log_success "Schema prepared for restore"
  else
    log_error "Failed to prepare schema"
    exit 1
  fi
}

# Run the restore
run_restore() {
  local sql_file="$1"

  log_info "Starting database restore..."
  log_info "Source: $BACKUP_FILE"

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN - would execute:"
    log_info "  psql \"\$DATABASE_URL\" < \"$sql_file\""
    return
  fi

  local start_time=$(date +%s)

  if psql "$DATABASE_URL" --quiet --single-transaction < "$sql_file" 2>&1; then
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_success "Database restore completed successfully"
    log_info "Duration: ${duration}s"
  else
    log_error "Database restore failed"
    log_info "Check the error messages above for details"
    exit 1
  fi
}

# Verify restore
verify_restore() {
  if [ "$DRY_RUN" = true ]; then
    return
  fi

  log_info "Verifying restore..."

  # Count tables in public schema
  local table_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

  if [ -n "$table_count" ] && [ "$table_count" -gt 0 ]; then
    log_success "Verification passed: $table_count tables found"
  else
    log_warning "Verification uncertain: Could not count tables"
  fi
}

# Main flow
main() {
  echo ""
  echo -e "${RED}=========================================${NC}"
  echo -e "${RED}     DATABASE RESTORE SCRIPT${NC}"
  echo -e "${RED}=========================================${NC}"
  echo ""

  if [ "$DRY_RUN" = true ]; then
    log_warning "Running in DRY RUN mode - no changes will be made"
    echo ""
  else
    log_critical "WARNING: This will OVERWRITE existing database data!"
    echo ""
  fi

  # Pre-flight checks
  log_info "Running pre-flight checks..."
  check_backup_file
  check_confirmation
  check_env
  check_psql
  check_gpg
  validate_connection
  get_database_info
  echo ""

  # Final confirmation for non-dry-run
  if [ "$DRY_RUN" = false ]; then
    echo ""
    log_critical "========================================="
    log_critical "  FINAL CONFIRMATION"
    log_critical "========================================="
    log_warning "You are about to OVERWRITE the database!"
    log_warning "Backup file: $BACKUP_FILE"
    echo ""
    read -p "Type 'RESTORE' to proceed: " confirmation
    if [ "$confirmation" != "RESTORE" ]; then
      log_warning "Cancelled"
      exit 0
    fi
    echo ""
  fi

  # Prepare file
  log_info "Preparing backup file..."
  local sql_file=$(prepare_restore_file)
  echo ""

  # Drop existing schema
  drop_existing_schema
  echo ""

  # Run restore
  run_restore "$sql_file"
  echo ""

  # Verify
  verify_restore
  echo ""

  log_success "Database restore complete!"
  echo ""
  echo "RESTORE_STATUS=success"
}

# Run main function
main
