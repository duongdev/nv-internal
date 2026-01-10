# Production Backup & Restore System

Comprehensive guide for the automated backup and restore system for NV Internal production environment.

---

## Overview

The backup system automatically creates encrypted backups of all production data and stores them in a private GitHub repository.

### What Gets Backed Up

| Component | Description | Backup Script |
|-----------|-------------|---------------|
| **Database** | Full PostgreSQL dump (Neon) | `scripts/backup-database.sh` |
| **Blob Storage** | All files from Vercel Blob | `scripts/backup-blobs.ts` |
| **Environment Variables** | Vercel project env vars | `scripts/backup-env.sh` |

### Backup Schedule

Backups run automatically twice daily via GitHub Actions:

- **2:00 AM UTC** (9:00 AM Vietnam time)
- **2:00 PM UTC** (9:00 PM Vietnam time)

### Storage Location

Backups are stored in a **private GitHub repository** configured via `BACKUP_REPO` secret. Each backup is organized by date:

```
backups/
  2024-01-15/
    database-2024-01-15.sql.gz.gpg
    blobs.tar.gpg
    env-2024-01-15.txt.gpg
  2024-01-16/
    ...
```

### Encryption

All backup files are encrypted using **GPG symmetric encryption** with AES-256 cipher:

- Encryption key is stored in `BACKUP_ENCRYPTION_KEY` GitHub secret
- Use a strong passphrase (minimum 16 characters recommended)
- Same key is used for both encryption and decryption

---

## Setup

### Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings > Secrets and variables > Actions):

| Secret | Description | How to Get |
|--------|-------------|------------|
| `DATABASE_URL` | PostgreSQL connection string | Neon dashboard > Connection Details |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Vercel Dashboard > Storage > Blob > Tokens |
| `VERCEL_TOKEN` | Vercel API token | Vercel Dashboard > Account Settings > Tokens |
| `BACKUP_ENCRYPTION_KEY` | GPG encryption passphrase | Generate a strong passphrase (32+ chars) |
| `BACKUP_REPO` | Backup repository path | Format: `owner/repo-name` (e.g., `duongdev/nv-internal-backups`) |
| `BACKUP_REPO_TOKEN` | GitHub PAT with repo access | GitHub Settings > Developer Settings > Personal Access Tokens |

### Creating the Backup Repository

1. Create a **private** GitHub repository for backups:
   ```bash
   gh repo create nv-internal-backups --private
   ```

2. Clone and initialize Git LFS:
   ```bash
   git clone https://github.com/your-org/nv-internal-backups.git
   cd nv-internal-backups
   git lfs install
   ```

3. Configure `.gitattributes` for large files:
   ```bash
   cat > .gitattributes << 'EOF'
   # Track encrypted backup files with Git LFS
   *.gpg filter=lfs diff=lfs merge=lfs -text
   *.sql.gz filter=lfs diff=lfs merge=lfs -text
   *.tar filter=lfs diff=lfs merge=lfs -text
   EOF
   git add .gitattributes
   git commit -m "Configure Git LFS for backup files"
   git push origin main
   ```

4. Create a Personal Access Token (PAT) with `repo` scope:
   - Go to GitHub Settings > Developer Settings > Personal Access Tokens > Tokens (classic)
   - Generate new token with `repo` scope
   - Copy token and add as `BACKUP_REPO_TOKEN` secret

### Testing the Setup

Run a manual backup with dry-run mode:

1. Go to **Actions** > **Production Backup**
2. Click **Run workflow**
3. Check **Dry run - don't push to backup repo**
4. Click **Run workflow**

Review the workflow output to ensure all components work correctly.

---

## Scripts Reference

### Backup Scripts

#### `scripts/backup-database.sh`

Creates a gzipped PostgreSQL dump.

```bash
# Basic usage
./scripts/backup-database.sh

# Custom output path
./scripts/backup-database.sh --output /path/to/backup.sql.gz

# Dry run (show what would be done)
./scripts/backup-database.sh --dry-run
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (required)

#### `scripts/backup-blobs.ts`

Downloads all blobs from Vercel Blob storage with manifest.

```bash
# Basic usage
pnpm tsx scripts/backup-blobs.ts

# Custom output directory
pnpm tsx scripts/backup-blobs.ts --output /path/to/blobs

# Dry run
pnpm tsx scripts/backup-blobs.ts --dry-run
```

**Environment Variables:**
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token (required)

#### `scripts/backup-env.sh`

Exports Vercel environment variables.

```bash
# Basic usage (names only, values redacted)
./scripts/backup-env.sh

# Include actual values (for secure backup)
./scripts/backup-env.sh --include-values

# Specific environment
./scripts/backup-env.sh --environment staging

# Dry run
./scripts/backup-env.sh --dry-run
```

**Environment Variables:**
- `VERCEL_TOKEN` - Vercel API token (required)

#### `scripts/backup-encrypt.sh`

Encrypts files using GPG AES-256.

```bash
# Encrypt a file
./scripts/backup-encrypt.sh backup.sql.gz

# Decrypt a file
./scripts/backup-encrypt.sh backup.sql.gz.gpg --decrypt

# Custom output
./scripts/backup-encrypt.sh backup.sql.gz --output /tmp/encrypted.gpg
```

**Environment Variables:**
- `BACKUP_ENCRYPTION_KEY` - Encryption passphrase (required)

### Verification Scripts

#### `scripts/backup-verify.sh`

Validates backup file integrity.

```bash
# Basic verification
./scripts/backup-verify.sh backups/database-2024-01-15.sql.gz.gpg

# Verbose output
./scripts/backup-verify.sh backups/database-2024-01-15.sql.gz.gpg --verbose
```

**Environment Variables:**
- `BACKUP_ENCRYPTION_KEY` - Required for `.gpg` files

**Exit Codes:**
- `0` - Backup is valid
- `1` - Backup is invalid or verification failed

### Restore Scripts

#### `scripts/restore-database.sh`

Restores PostgreSQL database from backup.

```bash
# Restore (requires --confirm flag)
./scripts/restore-database.sh backup.sql.gz --confirm

# Dry run first
./scripts/restore-database.sh backup.sql.gz --dry-run

# Merge restore (skip dropping existing tables)
./scripts/restore-database.sh backup.sql.gz --confirm --no-drop
```

**Environment Variables:**
- `DATABASE_URL` - Target database (required)
- `BACKUP_ENCRYPTION_KEY` - Required for `.gpg` files

#### `scripts/restore-blobs.ts`

Restores blobs to Vercel Blob storage.

```bash
# Restore (requires --confirm flag)
pnpm tsx scripts/restore-blobs.ts --confirm

# Custom input directory
pnpm tsx scripts/restore-blobs.ts --input /path/to/blobs --confirm

# Skip existing blobs
pnpm tsx scripts/restore-blobs.ts --confirm --skip-existing

# Dry run
pnpm tsx scripts/restore-blobs.ts --dry-run
```

**Environment Variables:**
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token (required)

#### `scripts/backup-decrypt.sh`

Decrypts GPG-encrypted backup files.

```bash
# Decrypt a file
./scripts/backup-decrypt.sh backup.sql.gz.gpg

# Custom output
./scripts/backup-decrypt.sh backup.sql.gz.gpg --output /tmp/decrypted.sql.gz
```

**Environment Variables:**
- `BACKUP_ENCRYPTION_KEY` - Decryption passphrase (required)

---

## GitHub Actions Workflows

### `backup-production.yml`

**Triggers:**
- Schedule: 2 AM and 2 PM UTC daily
- Manual: workflow_dispatch

**Inputs (Manual):**
| Input | Description | Default |
|-------|-------------|---------|
| `skip_blobs` | Skip blob backup (faster for testing) | `false` |
| `dry_run` | Don't push to backup repo | `false` |

**Jobs:**
1. **backup-database** - Dumps PostgreSQL database
2. **backup-blobs** - Downloads all blobs (parallel)
3. **backup-env** - Exports environment variables (parallel)
4. **encrypt** - Encrypts all backup files
5. **verify** - Validates encrypted backups
6. **upload** - Pushes to backup repository

### `restore-production.yml`

**Triggers:**
- Manual only (workflow_dispatch)

**Inputs (Required):**
| Input | Description |
|-------|-------------|
| `backup_date` | Backup date in YYYY-MM-DD format |
| `restore_database` | Restore database (boolean) |
| `restore_blobs` | Restore blob storage (boolean) |
| `confirm_restore` | **Must be checked** to proceed |
| `target_environment` | `staging` or `production` |

**Jobs:**
1. **validate** - Validates inputs and confirmation
2. **download** - Clones backup repo, decrypts files
3. **restore-database** - Restores PostgreSQL (conditional)
4. **restore-blobs** - Restores Vercel Blobs (conditional)
5. **verify** - Final verification

**Safety Requirements:**
- User must explicitly check confirmation checkbox
- `target_environment` uses GitHub environment protection rules
- Production restores require additional approval (if configured)

---

## Manual Operations

### Running Backup Locally

1. Export required environment variables:
   ```bash
   export DATABASE_URL="postgresql://..."
   export BLOB_READ_WRITE_TOKEN="vercel_blob_..."
   export VERCEL_TOKEN="..."
   export BACKUP_ENCRYPTION_KEY="your-strong-passphrase"
   ```

2. Create backup directory:
   ```bash
   mkdir -p backups
   ```

3. Run individual backups:
   ```bash
   # Database
   ./scripts/backup-database.sh --output backups/database.sql.gz

   # Blobs
   pnpm tsx scripts/backup-blobs.ts --output backups/blobs

   # Environment
   ./scripts/backup-env.sh --include-values --output backups/env.txt
   ```

4. Encrypt backups:
   ```bash
   ./scripts/backup-encrypt.sh backups/database.sql.gz
   ./scripts/backup-encrypt.sh backups/env.txt
   tar -cvf backups/blobs.tar backups/blobs/
   ./scripts/backup-encrypt.sh backups/blobs.tar
   ```

### Restoring Locally

1. Decrypt backup files:
   ```bash
   export BACKUP_ENCRYPTION_KEY="your-strong-passphrase"
   ./scripts/backup-decrypt.sh backups/database.sql.gz.gpg
   ```

2. Restore database:
   ```bash
   export DATABASE_URL="postgresql://..."  # Target database
   ./scripts/restore-database.sh backups/database.sql.gz --confirm
   ```

3. Restore blobs:
   ```bash
   tar -xvf backups/blobs.tar
   export BLOB_READ_WRITE_TOKEN="vercel_blob_..."
   pnpm tsx scripts/restore-blobs.ts --input backups/blobs --confirm
   ```

### Verifying Backup Integrity

```bash
export BACKUP_ENCRYPTION_KEY="your-strong-passphrase"
./scripts/backup-verify.sh backups/database.sql.gz.gpg --verbose
```

This checks:
- File exists and has content
- GPG decryption succeeds
- Gzip integrity is valid
- SQL content is valid (contains PostgreSQL dump markers)

---

## Emergency Procedures

### Quick Restore Checklist

If you need to restore production immediately:

1. [ ] Go to **Actions** > **Production Restore**
2. [ ] Enter the backup date (YYYY-MM-DD format)
3. [ ] Select what to restore (database and/or blobs)
4. [ ] Set target environment to `production`
5. [ ] Check **"I understand this will OVERWRITE production data"**
6. [ ] Click **Run workflow**
7. [ ] Monitor workflow progress
8. [ ] Verify application functionality after restore

### Finding Available Backups

Via GitHub CLI:
```bash
gh repo view your-org/nv-internal-backups
# Or clone and check
git clone https://github.com/your-org/nv-internal-backups.git
ls backups/
```

Via GitHub Actions logs:
- Check previous **Production Backup** workflow runs
- Each run shows the backup date in the summary

### Troubleshooting Common Issues

#### "Backup not found for date"

**Cause:** No backup exists for the specified date.

**Solution:**
1. Check available backups in the backup repository
2. Use a different date that has a backup
3. If no recent backups, investigate why scheduled backups are failing

#### "Decryption failed"

**Cause:** Wrong encryption key or corrupted file.

**Solution:**
1. Verify `BACKUP_ENCRYPTION_KEY` secret is correct
2. Try re-downloading the backup file
3. Check if Git LFS files were properly pulled

#### "Database connection failed"

**Cause:** Invalid `DATABASE_URL` or network issues.

**Solution:**
1. Verify the connection string in secrets
2. Check if database is accessible from GitHub Actions
3. Ensure IP allowlisting if required

#### "Blob upload failed"

**Cause:** Invalid token or rate limiting.

**Solution:**
1. Regenerate `BLOB_READ_WRITE_TOKEN`
2. Wait and retry if rate limited
3. Use `--skip-existing` to resume partial restore

### Contact Information

For production emergencies:

- **On-call:** [Configure your contact]
- **Escalation:** [Configure escalation path]
- **Runbook:** This document

---

## Retention Policy

### Current Policy

- **Daily backups:** Kept for 30 days
- **Weekly backups:** First backup of each week kept for 90 days
- **Monthly backups:** First backup of each month kept for 1 year

### Cleaning Old Backups

Manual cleanup (run in backup repository):

```bash
# List backups older than 30 days
find backups/ -maxdepth 1 -type d -mtime +30

# Delete old backups (be careful!)
# Keep at least one backup per week/month according to policy
```

Automated cleanup can be configured via GitHub Actions if needed.

### Storage Considerations

- Each daily backup is approximately 10-100 MB (depending on data size)
- Git LFS is used to handle large files efficiently
- Monitor backup repository size periodically

---

## Security Considerations

### Encryption

- All backups are encrypted with AES-256 (GPG symmetric)
- Never store the encryption key in the repository
- Rotate encryption key annually (requires re-encrypting old backups)

### Access Control

- Backup repository should be **private**
- Use minimal PAT permissions (only `repo` scope)
- Limit who has access to backup secrets
- Enable GitHub environment protection for production restores

### Audit Trail

- All backup/restore operations are logged in GitHub Actions
- Review workflow runs periodically
- Monitor for unexpected manual restores

---

## Related Documentation

- [EAS Build & Submit](./eas-build-submit.md) - Mobile app deployment
- [Environment Setup](../development/environment-setup.md) - Local development
- [Database Patterns](../architecture/database-patterns.md) - Database design

---

**Last Updated:** 2025-01-11
**Version:** 1.0.0
