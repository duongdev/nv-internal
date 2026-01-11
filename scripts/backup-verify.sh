#!/bin/bash

# Backup Verification Script
# Validates integrity of database backup files
#
# Usage: ./scripts/backup-verify.sh <backup-file> [options]
# Options:
#   --verbose    Show detailed output during verification
#
# Supported formats:
#   - .sql.gz        Compressed SQL dump
#   - .sql.gz.gpg    Encrypted compressed SQL dump
#   - .sql           Plain SQL dump
#
# Environment:
#   BACKUP_ENCRYPTION_KEY  Passphrase for decryption (required for .gpg files)
#
# Exit codes:
#   0  Backup is valid
#   1  Backup is invalid or verification failed
#
# Examples:
#   ./scripts/backup-verify.sh backups/database-2024-01-01-120000.sql.gz
#   ./scripts/backup-verify.sh backups/database-2024-01-01-120000.sql.gz.gpg --verbose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_FILE=""
VERBOSE=false
TEMP_FILES=()

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose)
      VERBOSE=true
      shift
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 <backup-file> [--verbose]"
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

# Functions - all log to stderr so stdout can be used for return values
log_info() {
  if [ "$VERBOSE" = true ]; then
    echo -e "${BLUE}[INFO]${NC} $1" >&2
  fi
}

log_success() {
  echo -e "${GREEN}[PASS]${NC} $1" >&2
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_error() {
  echo -e "${RED}[FAIL]${NC} $1" >&2
}

log_result() {
  echo -e "$1" >&2
}

# Clean up temporary files on exit
cleanup() {
  for temp_file in "${TEMP_FILES[@]}"; do
    if [ -e "$temp_file" ]; then
      rm -rf "$temp_file"
    fi
  done
}
trap cleanup EXIT

# Check backup file argument
check_file_exists() {
  if [ -z "$BACKUP_FILE" ]; then
    log_error "No backup file specified"
    echo "Usage: $0 <backup-file> [--verbose]"
    exit 1
  fi

  if [ ! -f "$BACKUP_FILE" ]; then
    log_error "File does not exist: $BACKUP_FILE"
    exit 1
  fi

  log_success "File exists: $BACKUP_FILE"
  return 0
}

# Check file size is greater than 0
check_file_size() {
  local file_size=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)

  if [ -z "$file_size" ] || [ "$file_size" -eq 0 ]; then
    log_error "File is empty (0 bytes)"
    exit 1
  fi

  local human_size=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
  log_success "File size: $human_size ($file_size bytes)"
  return 0
}

# Check file format
check_file_format() {
  local valid=false

  if [[ "$BACKUP_FILE" == *.sql.gz.gpg ]]; then
    log_success "Format: Encrypted compressed SQL (.sql.gz.gpg)"
    valid=true
  elif [[ "$BACKUP_FILE" == *.sql.gz ]]; then
    log_success "Format: Compressed SQL (.sql.gz)"
    valid=true
  elif [[ "$BACKUP_FILE" == *.sql ]]; then
    log_success "Format: Plain SQL (.sql)"
    valid=true
  fi

  if [ "$valid" = false ]; then
    log_error "Unsupported format (expected .sql, .sql.gz, or .sql.gz.gpg)"
    exit 1
  fi

  return 0
}

# Verify GPG encryption (if applicable)
verify_gpg() {
  if [[ "$BACKUP_FILE" != *.gpg ]]; then
    log_info "Skipping GPG verification (not encrypted)"
    return 0
  fi

  # Check GPG is installed
  if ! command -v gpg &> /dev/null; then
    log_error "GPG not installed (required for .gpg files)"
    exit 1
  fi

  # Check encryption key is set
  if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
    log_error "BACKUP_ENCRYPTION_KEY not set (required for .gpg files)"
    exit 1
  fi

  # Try to decrypt to temp file
  local temp_decrypted=$(mktemp)
  TEMP_FILES+=("$temp_decrypted")

  log_info "Testing GPG decryption..."

  if echo "$BACKUP_ENCRYPTION_KEY" | gpg \
    --decrypt \
    --batch \
    --yes \
    --passphrase-fd 0 \
    --output "$temp_decrypted" \
    "$BACKUP_FILE" 2>/dev/null; then
    log_success "GPG decryption: Valid (correct key)"
    # Return the decrypted file path for further checks
    echo "$temp_decrypted"
    return 0
  else
    log_error "GPG decryption failed (wrong key or corrupted)"
    exit 1
  fi
}

# Verify gzip compression (if applicable)
verify_gzip() {
  local file="$1"

  if [[ "$file" != *.gz ]]; then
    log_info "Skipping gzip verification (not compressed)"
    echo "$file"
    return 0
  fi

  log_info "Testing gzip integrity..."

  # Use gzip -t to test integrity
  if gzip -t "$file" 2>/dev/null; then
    log_success "Gzip integrity: Valid"

    # Decompress to temp file for SQL check
    local temp_sql=$(mktemp)
    TEMP_FILES+=("$temp_sql")

    if gunzip -c "$file" > "$temp_sql" 2>/dev/null; then
      echo "$temp_sql"
      return 0
    else
      log_error "Gzip decompression failed"
      exit 1
    fi
  else
    log_error "Gzip integrity check failed (corrupted)"
    exit 1
  fi
}

# Verify SQL content
verify_sql() {
  local file="$1"

  log_info "Verifying SQL content..."

  # Check file is not empty
  if [ ! -s "$file" ]; then
    log_error "SQL content is empty"
    exit 1
  fi

  # Look for common PostgreSQL dump markers (case-insensitive, anywhere in line)
  local has_pg_dump=false
  local has_set_statements=false
  local has_create_or_data=false
  local has_sql_comments=false

  # Check for pg_dump header (common in PostgreSQL dumps) - case insensitive
  if head -100 "$file" | grep -q -i -E "(postgresql|pg_dump|dumped|database dump)" 2>/dev/null; then
    has_pg_dump=true
  fi

  # Check for SQL comments (-- style)
  if head -100 "$file" | grep -q -E "^--" 2>/dev/null; then
    has_sql_comments=true
  fi

  # Check for SET statements (may have leading whitespace)
  if grep -q -E "^\s*SET " "$file" 2>/dev/null; then
    has_set_statements=true
  fi

  # Check for CREATE or INSERT statements (may have leading whitespace)
  if grep -q -i -E "^\s*(CREATE|INSERT|ALTER|DROP|COPY|SELECT)" "$file" 2>/dev/null; then
    has_create_or_data=true
  fi

  # Count significant SQL statements
  local statement_count=$(grep -c -i -E "^\s*(CREATE|INSERT|ALTER|COPY|DROP|SELECT)" "$file" 2>/dev/null || echo "0")

  # Count semicolons (SQL statement terminators)
  local semicolon_count=$(grep -c ";" "$file" 2>/dev/null || echo "0")

  if [ "$VERBOSE" = true ]; then
    log_info "  - pg_dump markers: $([ "$has_pg_dump" = true ] && echo "found" || echo "not found")"
    log_info "  - SQL comments: $([ "$has_sql_comments" = true ] && echo "found" || echo "not found")"
    log_info "  - SET statements: $([ "$has_set_statements" = true ] && echo "found" || echo "not found")"
    log_info "  - DDL/DML statements: $statement_count found"
    log_info "  - Semicolons: $semicolon_count found"
  fi

  # Validate - more lenient: accept if any SQL indicators found
  if [ "$has_pg_dump" = true ] || [ "$has_create_or_data" = true ] || [ "$has_set_statements" = true ] || [ "$semicolon_count" -gt 5 ]; then
    log_success "SQL content: Valid ($statement_count DDL/DML, $semicolon_count semicolons)"
    return 0
  else
    # Show first few lines to help debug
    log_error "SQL content: Does not appear to be a valid SQL dump"
    log_info "First 10 lines of file:"
    head -10 "$file" | while read -r line; do
      log_info "  > $line"
    done
    exit 1
  fi
}

# Check for common issues
check_common_issues() {
  local file="$1"

  # Check for truncation (incomplete COPY statements)
  if grep -q "^COPY.*FROM stdin;" "$file" 2>/dev/null; then
    # Look for the terminating \. sequence
    local copy_count=$(grep -c "^COPY.*FROM stdin;" "$file" 2>/dev/null || echo "0")
    local term_count=$(grep -c '^\\\.$' "$file" 2>/dev/null || echo "0")

    if [ "$copy_count" -ne "$term_count" ]; then
      log_warning "Possible truncation: COPY statements ($copy_count) don't match terminators ($term_count)"
    else
      log_info "COPY statement count matches terminators: $copy_count"
    fi
  fi

  # Check for encoding issues
  if file "$file" | grep -q "ASCII\|UTF-8\|text"; then
    log_info "Encoding: Text file detected"
  else
    log_warning "Encoding: File may have unusual encoding"
  fi

  return 0
}

# Print summary
print_summary() {
  local file_size=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')

  echo ""
  echo -e "${GREEN}=========================================${NC}"
  echo -e "${GREEN}  BACKUP VERIFICATION PASSED${NC}"
  echo -e "${GREEN}=========================================${NC}"
  echo ""
  log_result "File: $BACKUP_FILE"
  log_result "Size: $file_size"
  echo ""
}

# Main flow
main() {
  echo ""
  log_info "Backup Verification Script"
  log_info "=========================="
  echo ""

  log_info "Verifying: $BACKUP_FILE"
  echo ""

  # Run all checks
  log_info "Running verification checks..."
  echo ""

  # 1. File exists
  check_file_exists

  # 2. File size > 0
  check_file_size

  # 3. Valid format
  check_file_format

  # 4. GPG decryption (if encrypted)
  local working_file="$BACKUP_FILE"
  if [[ "$BACKUP_FILE" == *.gpg ]]; then
    decrypted=$(verify_gpg)
    if [ -n "$decrypted" ]; then
      working_file="$decrypted"
    fi
  fi

  # 5. Gzip integrity (if compressed)
  if [[ "$working_file" == *.gz ]]; then
    decompressed=$(verify_gzip "$working_file")
    if [ -n "$decompressed" ]; then
      working_file="$decompressed"
    fi
  fi

  # 6. SQL content validation
  verify_sql "$working_file"

  # 7. Check for common issues (non-fatal)
  if [ "$VERBOSE" = true ]; then
    echo ""
    log_info "Checking for common issues..."
    check_common_issues "$working_file"
  fi

  # Print summary
  print_summary

  echo "VERIFICATION_STATUS=valid"
  exit 0
}

# Run main function
main
