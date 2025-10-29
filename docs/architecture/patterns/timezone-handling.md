# Timezone Handling Pattern

When implementing date-based features that need timezone awareness (reports, check-ins, scheduling), use modern date-fns v4+ timezone support.

## Core Principles

- **Use TZDate from @date-fns/tz** for timezone-aware date operations
- Convert user input dates to timezone boundaries before querying
- Store all timestamps in UTC in database
- Display dates in user's local timezone (default: Asia/Ho_Chi_Minh)

## Implementation Pattern

### Converting Date Strings to Timezone Boundaries

```typescript
import { TZDate } from '@date-fns/tz'

// Convert "2025-01-01" to start of day in timezone
const startOfDayInTz = TZDate.tz(timezone, `${dateString}T00:00:00`)

// Convert to end of day in timezone
const endOfDayInTz = TZDate.tz(timezone, `${dateString}T23:59:59.999`)

// These are now UTC Date objects for database queries
const startUtc = startOfDayInTz.toDate()
const endUtc = endOfDayInTz.toDate()
```

### Extracting Days in Timezone

```typescript
import { format } from 'date-fns'
import { TZDate } from '@date-fns/tz'

// Convert UTC timestamps to local days
const uniqueDays = new Set(
  records.map(record => {
    const localDate = TZDate.tz(timezone, record.timestamp)
    return format(localDate, 'yyyy-MM-dd')
  })
)
```

## Supported Timezones

For Southeast Asian applications, limit to common regional timezones:

```typescript
const SUPPORTED_TIMEZONES = [
  'Asia/Ho_Chi_Minh',    // Vietnam (UTC+7) - default
  'Asia/Bangkok',         // Thailand (UTC+7)
  'Asia/Singapore',       // Singapore (UTC+8)
  'Asia/Jakarta',         // Indonesia Western (UTC+7)
  'Asia/Manila',          // Philippines (UTC+8)
  'Asia/Kuala_Lumpur',    // Malaysia (UTC+8)
] as const
```

## Why TZDate over Legacy Functions

**Modern Approach (date-fns v4+):**
```typescript
// Clean, intuitive API
const localTime = TZDate.tz(timezone, dateString)
```

**Legacy Approach (avoid):**
```typescript
// Complex conversions with fromZonedTime/toZonedTime
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
const utc = fromZonedTime(dateString, timezone) // Confusing API
```

## Benefits

- ✅ **Accurate day boundaries** - "January 1st" means January 1st in local time
- ✅ **DST handling** - Automatic daylight saving time adjustments
- ✅ **Small bundle size** - TZDateMini is only 761B
- ✅ **Type safety** - Full TypeScript support
- ✅ **Future-proof** - Official date-fns v4+ approach

## Common Pitfalls

❌ **Don't use simple date string comparison**
```typescript
// Wrong: Compares in UTC, not local timezone
where: { createdAt: { gte: '2025-01-01' } }
```

✅ **Do convert to timezone boundaries first**
```typescript
// Correct: Converts to timezone then queries
const start = TZDate.tz(timezone, '2025-01-01T00:00:00').toDate()
where: { createdAt: { gte: start } }
```

## Testing Timezone Logic

Always test timezone boundaries:

```typescript
describe('timezone boundaries', () => {
  it('should handle Vietnam timezone correctly', () => {
    const start = TZDate.tz('Asia/Ho_Chi_Minh', '2025-01-01T00:00:00')
    // This is midnight Jan 1 in Vietnam (UTC+7)
    // Which is 5 PM Dec 31 in UTC
    expect(start.toISOString()).toBe('2024-12-31T17:00:00.000Z')
  })
})
```

## Reference Implementation

- Employee Reports: `.claude/tasks/20251029-105427-employee-reports-api-implementation.md`
- Report Service: `/apps/api/src/v1/reports/report.service.ts`
- Tests: `/apps/api/src/v1/reports/__tests__/report.service.test.ts`

## Resources

- [date-fns v4.0 release blog](https://blog.date-fns.org/v40-with-time-zone-support/)
- [date-fns/tz documentation](https://github.com/date-fns/tz)