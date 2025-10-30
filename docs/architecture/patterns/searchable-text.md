# SearchableText Pattern

## Problem Statement

Multi-field search in database applications presents several challenges:

1. **Complex Query Construction**: Searching across multiple fields requires complex OR conditions with nested relations
2. **Performance Issues**: Multiple JOINs and OR conditions degrade query performance
3. **Text Normalization**: Vietnamese text requires accent removal and whitespace normalization
4. **Pagination Accuracy**: Post-query filtering breaks database pagination
5. **Maintenance Burden**: Adding new searchable fields requires updating multiple code locations

### Example of the Problem

Traditional approach with 7 searchable fields:

```typescript
// Complex OR query construction (~50 lines)
const searchConditions = [
  { id: { equals: searchAsNumber } },
  { title: { contains: search } },
  { description: { contains: search } },
  { customer: { name: { contains: search } } },
  { customer: { phone: { contains: search } } },
  { geoLocation: { address: { contains: search } } },
  { geoLocation: { name: { contains: search } } },
]

// Post-processing filter required (~90 lines)
const filteredResults = results.filter(item => {
  // Normalize each field for comparison
  if (normalizeForSearch(item.title).includes(normalizedSearch)) return true
  if (normalizeForSearch(item.description).includes(normalizedSearch)) return true
  // ... 5 more field checks
})

// Result: Broken pagination, poor performance, 140+ lines of code
```

## Solution: Pre-computed SearchableText Field

The SearchableText pattern solves these issues by pre-computing a normalized, searchable text field at write time.

### Architecture

```prisma
model Task {
  id              Int       @id @default(autoincrement())
  title           String?
  description     String?
  searchableText  String?   @db.Text  // Pre-computed search field
  // ... other fields

  @@index([searchableText])  // Indexed for performance
}
```

### Building SearchableText

```typescript
/**
 * Builds a normalized searchable text field from multiple source fields
 * Combines all searchable content into a single, normalized string
 */
function buildSearchableText(record: {
  id: number
  title?: string | null
  description?: string | null
  customer?: { name?: string | null; phone?: string | null } | null
  geoLocation?: { address?: string | null; name?: string | null } | null
}): string {
  // Collect all searchable fields
  const parts: string[] = [
    record.id.toString(),
    record.title,
    record.description,
    record.customer?.name,
    record.customer?.phone,
    record.geoLocation?.address,
    record.geoLocation?.name,
  ].filter(Boolean) as string[]

  // Normalize: lowercase, remove accents, normalize whitespace
  return parts
    .map(part => normalizeForSearch(part.trim().replace(/\s+/g, ' ')))
    .join(' ')
}

/**
 * Vietnamese text normalization utility
 */
function normalizeForSearch(text: string): string {
  return removeVietnameseAccents(text.toLowerCase())
    .replace(/\s+/g, ' ')
    .trim()
}
```

### Querying with SearchableText

```typescript
// Simple, performant query
export async function searchTasks(searchQuery: string) {
  const normalizedSearch = normalizeForSearch(searchQuery)

  return await prisma.task.findMany({
    where: {
      searchableText: {
        contains: normalizedSearch,
        mode: 'insensitive'
      }
    },
    // Pagination works correctly - no post-processing needed
    skip: offset,
    take: limit,
  })
}
```

## Implementation Guide

### 1. Schema Migration

```sql
-- Add searchableText field
ALTER TABLE "Task" ADD COLUMN "searchableText" TEXT;

-- Create index for performance (use GIN for better text search)
CREATE INDEX CONCURRENTLY "Task_searchableText_idx"
  ON "Task" ("searchableText");
```

### 2. Service Layer Updates

```typescript
// Creating records
async function createTask(data: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      ...data,
      searchableText: buildSearchableText({
        id: generatedId,
        title: data.title,
        description: data.description,
        customer: data.customer,
        geoLocation: data.geoLocation,
      })
    }
  })
  return task
}

// Updating records
async function updateTask(id: number, data: UpdateTaskInput) {
  // Fetch current data if needed for rebuilding searchableText
  const current = await prisma.task.findUnique({
    where: { id },
    include: { customer: true, geoLocation: true }
  })

  return await prisma.task.update({
    where: { id },
    data: {
      ...data,
      searchableText: buildSearchableText({
        ...current,
        ...data,
      })
    }
  })
}
```

### 3. Backfilling Existing Data

```typescript
async function backfillSearchableText() {
  const batchSize = 100
  let cursor: number | undefined

  while (true) {
    const records = await prisma.task.findMany({
      where: {
        searchableText: null,
        ...(cursor ? { id: { gt: cursor } } : {})
      },
      include: { customer: true, geoLocation: true },
      take: batchSize,
      orderBy: { id: 'asc' }
    })

    if (records.length === 0) break

    // Update in parallel for performance
    await Promise.all(
      records.map(record =>
        prisma.task.update({
          where: { id: record.id },
          data: {
            searchableText: buildSearchableText(record)
          }
        })
      )
    )

    cursor = records[records.length - 1].id
    console.log(`Processed ${records.length} records...`)
  }
}
```

## Performance Benefits

### Metrics Comparison

| Metric | Traditional Approach | SearchableText | Improvement |
|--------|---------------------|----------------|-------------|
| **Code Complexity** | ~140 lines | ~50 lines | 64% reduction |
| **Query Performance** | Multiple JOINs | Single field | 2-3x faster |
| **Post-Processing** | O(n*m) complexity | None needed | Eliminated |
| **Memory Usage** | Load all, then filter | Direct results | Optimal |
| **Pagination** | Broken | Perfect | 100% accurate |

### Benchmark Results

With 1,000 records:
- **Before**: ~200-250ms (query + post-processing)
- **After**: ~60-80ms (query only)
- **Improvement**: 2.5-3x faster

With 10,000 records:
- **Before**: ~700ms (query + post-processing)
- **After**: ~150ms (query only)
- **Improvement**: 4.5x faster

## When to Use This Pattern

### Good Fit ✅

Use SearchableText when:
- Searching across multiple fields (3+)
- Need text normalization (accents, case, whitespace)
- Performance is critical
- Pagination accuracy is important
- Search is a primary feature
- Using SQL database with indexes

### Not Recommended ❌

Avoid SearchableText when:
- Only searching 1-2 fields
- No text normalization needed
- Using NoSQL database
- Storage space is extremely limited
- Real-time field updates with high frequency
- Need weighted/ranked search results

## Variations and Extensions

### 1. Weighted Search

Include field names for better matching:

```typescript
function buildWeightedSearchableText(record: Task): string {
  return [
    `id:${record.id}`,
    `title:${record.title}`,
    `customer:${record.customer?.name}`,
    // ... other fields
  ].filter(Boolean).join(' ')
}
```

### 2. Multi-language Support

```typescript
function buildMultilingualSearchableText(record: Task): string {
  const vietnamese = normalizeVietnamese(record.title)
  const english = normalizeEnglish(record.title)
  return `${vietnamese} ${english}`
}
```

### 3. Search Ranking

Store search relevance score:

```typescript
model Task {
  searchableText    String?
  searchRelevance   Float?  // Calculated based on field importance
}
```

## Common Pitfalls

### 1. Forgetting to Update on Changes ❌

```typescript
// Wrong - searchableText becomes stale
await prisma.task.update({
  where: { id },
  data: { title: newTitle }  // searchableText not updated!
})
```

### 2. Including Sensitive Data ❌

```typescript
// Wrong - exposing private information
const searchableText = [
  record.title,
  record.internalNotes,  // Should not be searchable
  record.privateData,    // Security risk
].join(' ')
```

### 3. Not Normalizing Consistently ❌

```typescript
// Wrong - inconsistent normalization
// Write time: lowercase only
const searchableText = record.title.toLowerCase()

// Query time: lowercase + accent removal
const search = removeAccents(query.toLowerCase())  // Won't match!
```

## Best Practices

1. **Always Normalize Consistently**: Use the same normalization at write and query time
2. **Include Related Data**: Eagerly include related fields that users expect to search
3. **Exclude Sensitive Data**: Never include private or security-sensitive information
4. **Use Database Indexes**: Always index the searchableText field for performance
5. **Batch Backfills**: When backfilling, use batches to avoid timeouts
6. **Test Edge Cases**: Test with special characters, long text, null values
7. **Monitor Performance**: Track query times and optimize index strategy

## Implementation Checklist

- [ ] Add searchableText field to schema
- [ ] Create database index
- [ ] Implement buildSearchableText function
- [ ] Update create operations
- [ ] Update update operations
- [ ] Backfill existing records
- [ ] Update search queries
- [ ] Remove old search code
- [ ] Add tests for edge cases
- [ ] Document in API docs
- [ ] Monitor performance metrics

## References

- Original implementation: `.claude/tasks/20251030-094500-implement-searchable-text-field.md`
- Task search service: `apps/api/src/v1/task/task.service.ts`
- Vietnamese normalization: `apps/api/src/lib/text-utils.ts`
- Performance analysis: `.claude/tasks/20251030-110000-complete-phase3-phase4-search-filter-ui.md`

## Related Patterns

- [Vietnamese Search](./vietnamese-search.md) - Accent-insensitive search for Vietnamese text
- [Cache Invalidation](./cache-invalidation.md) - Keeping searchableText up-to-date
- [Activity Event](./activity-event.md) - Logging searchableText updates