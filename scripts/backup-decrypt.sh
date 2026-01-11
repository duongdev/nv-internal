#!/bin/bash

# GPG Decryption Helper Script
# Simplified wrapper for decrypting backup files
#
# Usage: ./scripts/backup-decrypt.sh <input-file.gpg> [options]
# Options:
#   --output     Custom output path (default: removes .gpg extension)
#   --dry-run    Show what would be done without executing
#
# Environment:
#   BACKUP_ENCRYPTION_KEY  Passphrase for decryption (required)
#
# Examples:
#   ./scripts/backup-decrypt.sh backups/database-2024-01-01-120000.sql.gz.gpg
#   ./scripts/backup-decrypt.sh backup.tar.gpg --output /tmp/backup.tar

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INPUT_FILE=""
CUSTOM_OUTPUT=""
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --output)
      CUSTOM_OUTPUT="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 <input-file.gpg> [--output <path>] [--dry-run]"
      exit 1
      ;;
    *)
      if [ -z "$INPUT_FILE" ]; then
        INPUT_FILE="$1"
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

# Check input file argument
check_input() {
  if [ -z "$INPUT_FILE" ]; then
    log_error "No input file specified"
    echo "Usage: $0 <input-file.gpg> [--output <path>] [--dry-run]"
    exit 1
  fi

  if [ ! -f "$INPUT_FILE" ]; then
    log_error "Input file does not exist: $INPUT_FILE"
    exit 1
  fi

  if [[ "$INPUT_FILE" != *.gpg ]]; then
    log_warning "Input file does not have .gpg extension"
  fi

  log_success "Input file: $INPUT_FILE"
}

# Check required environment variables
check_env() {
  if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
    log_error "BACKUP_ENCRYPTION_KEY environment variable is not set"
    log_info "Set the passphrase used during encryption"
    exit 1
  fi

  log_success "Decryption key is configured"
}

# Check GPG is installed
check_gpg() {
  if ! command -v gpg &> /dev/null; then
    log_error "GPG is not installed"
    log_info "Install GPG to use this script:"
    log_info "  macOS: brew install gnupg"
    log_info "  Ubuntu: sudo apt-get install gnupg"
    exit 1
  fi

  local version=$(gpg --version | head -1)
  log_success "GPG available: $version"
}

# Determine output file path
get_output_path() {
  if [ -n "$CUSTOM_OUTPUT" ]; then
    echo "$CUSTOM_OUTPUT"
    return
  fi

  # Remove .gpg extension if present
  if [[ "$INPUT_FILE" == *.gpg ]]; then
    echo "${INPUT_FILE%.gpg}"
  else
    log_error "Cannot determine output filename"
    log_info "Use --output to specify output path, or ensure input has .gpg extension"
    exit 1
  fi
}

# Decrypt file
decrypt_file() {
  local output_file="$1"

  log_info "Decrypting file..."
  log_info "Input: $INPUT_FILE"
  log_info "Output: $output_file"

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN - would execute:"
    log_info "  gpg --decrypt --batch --yes --passphrase-fd 0 -o \"$output_file\" \"$INPUT_FILE\""
    return
  fi

  # Use passphrase from environment variable via stdin
  if echo "$BACKUP_ENCRYPTION_KEY" | gpg \
    --decrypt \
    --batch \
    --yes \
    --passphrase-fd 0 \
    --output "$output_file" \
    "$INPUT_FILE" 2>/dev/null; then

    local input_size=$(ls -lh "$INPUT_FILE" | awk '{print $5}')
    local output_size=$(ls -lh "$output_file" | awk '{print $5}')

    log_success "Decryption completed successfully"
    log_info "Input size: $input_size"
    log_info "Output size: $output_size"

    # Output the file path for downstream scripts
    echo ""
    echo "DECRYPTED_FILE=$output_file"
  else
    log_error "Decryption failed"
    log_info "Check that the encryption key is correct"
    rm -f "$output_file"
    exit 1
  fi
}

# Main flow
main() {
  echo ""
  log_info "GPG Decryption Helper"
  log_info "====================="
  echo ""

  if [ "$DRY_RUN" = true ]; then
    log_warning "Running in DRY RUN mode - no changes will be made"
    echo ""
  fi

  # Pre-flight checks
  log_info "Running pre-flight checks..."
  check_gpg
  check_input
  check_env
  echo ""

  # Get output path
  local output_file=$(get_output_path)

  # Check if output file already exists
  if [ -f "$output_file" ] && [ "$DRY_RUN" != true ]; then
    log_warning "Output file already exists: $output_file"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_warning "Cancelled"
      exit 0
    fi
  fi

  # Run decryption
  decrypt_file "$output_file"
  echo ""

  log_success "Decryption complete!"
}

# Run main function
main
