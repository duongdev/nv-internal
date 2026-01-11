# Backup Repository Setup

This directory contains setup instructions and configuration files for the NV Internal backup repository.

## Overview

The backup repository is a **private** GitHub repository that stores encrypted backups of:
- PostgreSQL database dumps
- Vercel Blob storage files
- Environment variables

## Quick Setup

### 1. Create the Repository

```bash
# Using GitHub CLI
gh repo create nv-internal-backups --private --description "Encrypted backups for NV Internal production"

# Or via GitHub web interface:
# 1. Go to https://github.com/new
# 2. Name: nv-internal-backups
# 3. Visibility: Private
# 4. Click "Create repository"
```

### 2. Initialize Git LFS

```bash
# Clone the repository
git clone https://github.com/YOUR_ORG/nv-internal-backups.git
cd nv-internal-backups

# Install and initialize Git LFS
git lfs install

# Create .gitattributes file
cat > .gitattributes << 'EOF'
# Track encrypted backup files with Git LFS
# These files can be large and are binary, so LFS is more efficient
*.gpg filter=lfs diff=lfs merge=lfs -text
*.sql.gz filter=lfs diff=lfs merge=lfs -text
*.tar filter=lfs diff=lfs merge=lfs -text
*.tar.gz filter=lfs diff=lfs merge=lfs -text
EOF

# Commit the configuration
git add .gitattributes
git commit -m "Configure Git LFS for backup files"
git push origin main
```

### 3. Create Backup Directory Structure

```bash
# Create the backups directory
mkdir -p backups
touch backups/.gitkeep

git add backups/.gitkeep
git commit -m "Initialize backups directory"
git push origin main
```

### 4. Create Personal Access Token (PAT)

1. Go to GitHub Settings > Developer Settings > Personal Access Tokens > Tokens (classic)
2. Click "Generate new token (classic)"
3. Configure:
   - **Note**: `nv-internal-backup-automation`
   - **Expiration**: 1 year (or as per your security policy)
   - **Scopes**: Check `repo` (Full control of private repositories)
4. Click "Generate token"
5. **Copy the token immediately** (it won't be shown again)

### 5. Configure GitHub Secrets

In the main NV Internal repository (Settings > Secrets and variables > Actions):

| Secret | Value |
|--------|-------|
| `BACKUP_REPO` | `YOUR_ORG/nv-internal-backups` |
| `BACKUP_REPO_TOKEN` | The PAT you created in step 4 |

## Repository Structure

After backups start running, the structure will look like:

```
nv-internal-backups/
├── .gitattributes          # Git LFS configuration
├── backups/
│   ├── 20260111020000/     # Backup at 2 AM UTC
│   │   ├── database-20260111020000.sql.gz.gpg
│   │   ├── blobs-20260111020000.tar.gpg
│   │   └── env-20260111020000.txt.gpg
│   ├── 20260111140000/     # Backup at 2 PM UTC
│   │   └── ...
│   └── ...
└── README.md               # Optional: documentation
```

## Git LFS Configuration

### Why Git LFS?

- Backup files (especially blobs) can be large (100MB+)
- Git LFS stores large files efficiently
- Reduces repository clone time
- Keeps Git history clean

### Required `.gitattributes`

```gitattributes
# Track encrypted backup files with Git LFS
*.gpg filter=lfs diff=lfs merge=lfs -text
*.sql.gz filter=lfs diff=lfs merge=lfs -text
*.tar filter=lfs diff=lfs merge=lfs -text
*.tar.gz filter=lfs diff=lfs merge=lfs -text
```

### Verifying LFS is Working

```bash
# Check tracked file types
git lfs track

# Check LFS status
git lfs status

# List LFS files
git lfs ls-files
```

## Maintenance

### Checking Repository Size

```bash
# Clone with LFS files
git clone https://github.com/YOUR_ORG/nv-internal-backups.git
cd nv-internal-backups
git lfs pull

# Check size
du -sh .
du -sh backups/
```

### Cleaning Old Backups

To implement retention policy, periodically remove old backups:

```bash
# List backups older than 30 days
find backups/ -maxdepth 1 -type d -mtime +30 -ls

# Remove old backups (be careful!)
find backups/ -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \;

# Commit the cleanup
git add -A
git commit -m "Clean up backups older than 30 days"
git push origin main

# Prune LFS objects no longer referenced
git lfs prune
```

### LFS Quota Management

GitHub has LFS storage and bandwidth quotas. Monitor usage:

1. Go to repository Settings > Billing
2. Check "Git LFS Data" usage

If approaching limits:
- Clean up old backups
- Consider archiving old backups elsewhere
- Upgrade GitHub plan if needed

## Security Considerations

### Repository Access

- Keep the repository **private**
- Limit collaborators to essential personnel only
- Use branch protection rules if needed

### Token Management

- Rotate the PAT annually
- Use the minimum required permissions
- Monitor token usage in GitHub audit logs

### Encryption

- All backup files are encrypted with GPG AES-256
- The encryption key is stored in GitHub Secrets
- Never store the encryption key in the backup repository

## Troubleshooting

### "LFS objects not found"

```bash
# Ensure LFS is installed
git lfs install

# Pull all LFS files
git lfs pull
```

### "Push rejected due to large files"

```bash
# Ensure .gitattributes is committed first
git add .gitattributes
git commit -m "Configure Git LFS"
git push

# Then add and push the large files
git add backups/
git commit -m "Add backup"
git push
```

### "Authentication failed"

- Verify the PAT is still valid
- Check the token has `repo` scope
- Regenerate the token if needed

## Related Files

- Main documentation: `docs/deployment/backup-restore.md`
- Backup workflow: `.github/workflows/backup-production.yml`
- Restore workflow: `.github/workflows/restore-production.yml`

---

**Last Updated:** 2025-01-11
