# GPS Verification Pattern

When implementing location-based features, use accurate distance calculations.

## Implementation Guidelines

- Use Haversine formula for distance calculation (see `apps/api/src/lib/geo.ts`)
- Store coordinates in GeoLocation model
- Set configurable threshold via environment variable (default 100m)
- Return warnings instead of hard failures for UX
- Example: Check-in system allows 100m threshold with warnings

## Correct Implementation

```typescript
// ✅ Good - Haversine formula
import { calculateDistance } from '@/lib/geo'
const distance = calculateDistance(lat1, lon1, lat2, lon2)
```

## Anti-pattern

```typescript
// ❌ Bad - Simple subtraction (inaccurate!)
const distance = Math.sqrt((lat2-lat1)**2 + (lon2-lon1)**2)
```

**Why it's wrong**: Simple lat/lng subtraction doesn't account for Earth's curvature and provides inaccurate results.
