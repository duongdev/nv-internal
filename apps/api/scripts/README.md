# API Scripts

This directory contains utility scripts for database management and maintenance.

## Available Scripts

### clean-task-data.ts

**Purpose**: Clean ALL task-related data from the database while preserving reference data (Users, Customers, GeoLocations).

**Use Case**: Preparing database for fresh screenshot data or resetting task state for testing.

**What it deletes**:
- ✅ All Activities (event logs)
- ✅ All Attachments (photos/files)
- ✅ All Payments
- ✅ All Tasks

**What it preserves**:
- ✓ All Users (authentication accounts)
- ✓ All Customers (reference data)
- ✓ All GeoLocations (reference data)

**Safety Features**:
- Requires explicit `--dry-run` or `--confirm` flag
- Uses database transactions for atomicity
- Respects foreign key constraints (deletion order)
- Provides detailed summary before and after deletion
- Idempotent (safe to run multiple times)

**Usage**:

```bash
# Step 1: Review what would be deleted (ALWAYS do this first!)
npx tsx scripts/clean-task-data.ts --dry-run

# Step 2: Actually delete the data (after reviewing dry-run output)
npx tsx scripts/clean-task-data.ts --confirm
```

**Example Dry-Run Output**:

```
═══════════════════════════════════════════════════════
  TASK DATA CLEANUP SCRIPT
═══════════════════════════════════════════════════════

🔍 DRY RUN MODE - No data will be deleted

📊 Analyzing database...

Records to be deleted:
  📝 Activities:  305
  📎 Attachments: 214
  💰 Payments:    3
  ✅ Tasks:       15

📊 Total records: 537

Records to be PRESERVED:
  👤 Customers:     7
  📍 GeoLocations:  8

═══════════════════════════════════════════════════════
  DRY RUN SUMMARY
═══════════════════════════════════════════════════════

🔍 Would delete:
   ✓ 305 activity records
   ✓ 214 attachments
   ✓ 3 payments
   ✓ 15 tasks

🔒 Would preserve:
   ✓ 7 customers
   ✓ 8 geo locations
   ✓ All user accounts

💡 Run with --confirm to actually delete this data
```

---

### clean-test-data.ts

**Purpose**: Remove only test/dummy data identified by specific patterns (test names, test locations, etc.).

**Use Case**: Cleaning up test data without affecting real production data.

**What it deletes**:
- Test customers (Nguyễn Văn A, Trần Thị B, specific test phone numbers)
- Test geo locations (specific test coordinates)
- Test tasks (with test titles like "Sửa điều hòa", etc.)
- Related activity records, attachments, and payments

**Usage**:

```bash
# Step 1: Check what test data exists
npx tsx scripts/check-test-data.ts

# Step 2: Review what would be deleted
npx tsx scripts/clean-test-data.ts --dry-run

# Step 3: Delete the test data
npx tsx scripts/clean-test-data.ts --confirm
```

---

### check-test-data.ts

**Purpose**: Identify and report test/dummy data in the database without making any changes.

**Usage**:

```bash
npx tsx scripts/check-test-data.ts
```

---

### backfill-searchable-text.ts

**Purpose**: Populate the `searchableText` field for existing records to enable Vietnamese accent-insensitive search.

**Use Case**: After adding search optimization features or when search fields are empty.

**Usage**:

```bash
npx tsx scripts/backfill-searchable-text.ts
```

---

## Best Practices

### Before Running Deletion Scripts

1. **ALWAYS run with `--dry-run` first** to review what will be deleted
2. **Backup your database** if working with production data
3. **Review the output carefully** to ensure you're deleting the right data
4. **Test in development first** before running in production

### After Running Scripts

1. Verify the deletion was successful with a query:
   ```bash
   # Check task count
   npx tsx -e "import {getPrisma} from './src/lib/prisma'; const p = getPrisma(); p.task.count().then(c => console.log('Tasks:', c)).finally(() => p.$disconnect())"
   ```

2. For `clean-task-data.ts`, you may want to rebuild search indexes:
   ```bash
   npx tsx scripts/backfill-searchable-text.ts
   ```

---

## Script Development Guidelines

When creating new scripts:

1. **Use dry-run mode**: Always provide `--dry-run` and `--confirm` flags
2. **Use transactions**: Wrap deletions in `prisma.$transaction()` for atomicity
3. **Respect foreign keys**: Delete in correct order (child → parent)
4. **Clear output**: Use emojis and formatting for readability
5. **Error handling**: Catch errors and disconnect Prisma in `finally` block
6. **Idempotent**: Scripts should be safe to run multiple times

**Template Structure**:

```typescript
import { getPrisma } from '../src/lib/prisma'

const prisma = getPrisma()
const isDryRun = process.argv.includes('--dry-run')
const isConfirmed = process.argv.includes('--confirm')

async function myScript() {
  if (!isDryRun && !isConfirmed) {
    console.error('❌ Error: You must specify either --dry-run or --confirm')
    process.exit(1)
  }

  try {
    // Your logic here
    if (isDryRun) {
      // Show what would happen
    } else {
      await prisma.$transaction(async (tx) => {
        // Actual changes
      })
    }
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

myScript()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## Troubleshooting

### "Connection pool timeout"
- The database connection pool may be exhausted
- Wait a few seconds and try again
- Check Neon connection limits

### "Foreign key constraint failed"
- Check deletion order in the script
- Ensure child records are deleted before parent records

### "Cannot find module"
- Run `pnpm install` in the API directory
- Ensure TypeScript is compiled: `pnpm build`

### Script hangs indefinitely
- Check database connectivity
- Verify environment variables (`DATABASE_URL`)
- Look for open transactions or locks
