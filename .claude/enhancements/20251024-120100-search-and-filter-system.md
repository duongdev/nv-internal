# Task Search and Filter System

## Overview

Implement comprehensive search and filtering capabilities for tasks in both admin and worker interfaces, enabling users to quickly find specific tasks among potentially hundreds of entries.

## Status

⏳ **Not Started**

## Problem Analysis

### Current Limitations

1. **No Search Capability**
   - Users must scroll through entire task list
   - Cannot search by customer name, address, or description
   - Cannot search by task ID
   - No full-text search capability

2. **No Filtering Options**
   - Cannot filter by status (PREPARING, READY, IN_PROGRESS, etc.)
   - Cannot filter by date range
   - Cannot filter by assigned worker
   - Cannot filter by payment status
   - Cannot filter by location/area

3. **Scale Issues**
   - As task count grows, finding specific tasks becomes difficult
   - Pagination helps but doesn't solve findability
   - Admin needs to quickly locate tasks for support
   - Workers need to find their next task efficiently

### User Scenarios

**Admin Scenarios:**
- Customer calls about their task - need to search by name/phone
- Review all completed tasks for a date range
- Check all unpaid tasks
- Monitor specific worker's tasks
- Find tasks in specific area/district

**Worker Scenarios:**
- Find today's tasks quickly
- Search for specific customer address
- Filter to see only assigned tasks
- Find tasks near current location

## Proposed Solution

### 1. Backend API Enhancements

#### Search Endpoint
```typescript
// GET /v1/tasks/search
interface TaskSearchParams {
  // Text search
  q?: string;              // Search in customer name, address, description

  // Filters
  status?: TaskStatus[];   // Multiple statuses
  assignedTo?: string[];   // User IDs
  dateFrom?: string;       // ISO date
  dateTo?: string;        // ISO date
  hasPayment?: boolean;   // true/false/undefined
  paymentStatus?: 'collected' | 'not_collected' | 'mismatch';

  // Location filters
  district?: string;      // District name
  nearLat?: number;       // Latitude for proximity search
  nearLng?: number;      // Longitude for proximity search
  radius?: number;       // Radius in meters

  // Pagination
  cursor?: string;
  limit?: number;

  // Sorting
  orderBy?: 'createdAt' | 'scheduledAt' | 'distance' | 'status';
  order?: 'asc' | 'desc';
}
```

#### Implementation with Prisma
```typescript
async function searchTasks(params: TaskSearchParams) {
  const where: Prisma.TaskWhereInput = {};

  // Text search using Prisma full-text search or ILIKE
  if (params.q) {
    where.OR = [
      { customer: { name: { contains: params.q, mode: 'insensitive' } } },
      { customer: { phoneNumber: { contains: params.q } } },
      { address: { contains: params.q, mode: 'insensitive' } },
      { description: { contains: params.q, mode: 'insensitive' } },
    ];
  }

  // Status filter
  if (params.status?.length) {
    where.status = { in: params.status };
  }

  // Date range filter
  if (params.dateFrom || params.dateTo) {
    where.scheduledAt = {
      gte: params.dateFrom ? new Date(params.dateFrom) : undefined,
      lte: params.dateTo ? new Date(params.dateTo) : undefined,
    };
  }

  // Payment filter
  if (params.hasPayment !== undefined) {
    where.payments = params.hasPayment
      ? { some: {} }  // Has at least one payment
      : { none: {} }; // No payments
  }

  // Location-based filtering (if near coordinates provided)
  let tasks = await prisma.task.findMany({
    where,
    include: {
      customer: true,
      assignedUsers: true,
      location: true,
      payments: true,
    },
    orderBy: getOrderBy(params.orderBy, params.order),
    take: params.limit || 20,
    cursor: params.cursor ? { id: params.cursor } : undefined,
  });

  // Post-process for distance filtering if needed
  if (params.nearLat && params.nearLng && params.radius) {
    tasks = tasks.filter(task => {
      if (!task.location) return false;
      const distance = calculateDistance(
        params.nearLat!,
        params.nearLng!,
        task.location.latitude,
        task.location.longitude
      );
      return distance <= params.radius!;
    });
  }

  return tasks;
}
```

### 2. Mobile UI Components

#### Search Bar Component
```tsx
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export function TaskSearchBar({ value, onChangeText, onSubmit }: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-muted rounded-lg px-3 py-2 mx-4">
      <Search className="w-5 h-5 text-muted-foreground mr-2" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Tìm kiếm công việc..."
        className="flex-1 text-base"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <X className="w-5 h-5 text-muted-foreground" />
        </TouchableOpacity>
      )}
    </View>
  );
}
```

#### Filter Chips Component
```tsx
interface FilterChip {
  label: string;
  value: string;
  active: boolean;
}

export function FilterChips({
  filters,
  activeFilters,
  onToggle
}: {
  filters: FilterChip[];
  activeFilters: Set<string>;
  onToggle: (value: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2 px-4 py-2">
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.value}
            onPress={() => onToggle(filter.value)}
            className={cn(
              "px-3 py-1.5 rounded-full border",
              activeFilters.has(filter.value)
                ? "bg-primary border-primary"
                : "bg-background border-border"
            )}
          >
            <Text className={cn(
              "text-sm",
              activeFilters.has(filter.value)
                ? "text-primary-foreground"
                : "text-foreground"
            )}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
```

#### Advanced Filter Modal
```tsx
export function TaskFilterModal({
  visible,
  onClose,
  onApply,
  currentFilters
}: FilterModalProps) {
  // Modal with:
  // - Status multi-select
  // - Date range picker
  // - Assigned worker select (admin only)
  // - Payment status select
  // - District/area select
  // - Reset all button
  // - Apply button
}
```

### 3. Integration with Task List

```tsx
export function TaskListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({});
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tasks', 'search', searchQuery, filters],
    queryFn: () => api.tasks.search({ q: searchQuery, ...filters }),
    debounce: 500, // Debounce search input
  });

  return (
    <View className="flex-1">
      {/* Search Bar */}
      <TaskSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={refetch}
      />

      {/* Quick Filters */}
      <FilterChips
        filters={quickFilters}
        activeFilters={new Set(filters.status || [])}
        onToggle={(status) => {
          // Toggle status filter
        }}
      />

      {/* Advanced Filter Button */}
      <TouchableOpacity
        onPress={() => setShowFilterModal(true)}
        className="flex-row items-center px-4 py-2"
      >
        <Filter className="w-4 h-4 mr-2" />
        <Text>Bộ lọc nâng cao</Text>
        {hasActiveFilters && (
          <Badge count={activeFilterCount} />
        )}
      </TouchableOpacity>

      {/* Task List */}
      <FlatList
        data={data?.tasks || []}
        renderItem={({ item }) => <TaskCard task={item} />}
        // ... other props
      />

      {/* Filter Modal */}
      <TaskFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={setFilters}
        currentFilters={filters}
      />
    </View>
  );
}
```

## Implementation Plan

### Phase 1: Backend API (2 days)
- [ ] Create search endpoint with query parameters
- [ ] Implement Prisma search queries with proper indexing
- [ ] Add full-text search support (PostgreSQL)
- [ ] Implement filtering logic
- [ ] Add sorting options
- [ ] Create search validation schema
- [ ] Write comprehensive tests

### Phase 2: Basic Search UI (1 day)
- [ ] Create SearchBar component
- [ ] Integrate with task list
- [ ] Implement search debouncing
- [ ] Add loading states
- [ ] Handle empty search results

### Phase 3: Quick Filters (1 day)
- [ ] Create FilterChips component
- [ ] Implement status filters
- [ ] Add "My Tasks" filter for workers
- [ ] Add "Today's Tasks" filter
- [ ] Persist filter preferences

### Phase 4: Advanced Filters (2 days)
- [ ] Create FilterModal component
- [ ] Implement date range picker
- [ ] Add worker selection (admin)
- [ ] Add payment status filter
- [ ] Add location/district filter
- [ ] Implement filter reset

### Phase 5: Polish & Optimization (1 day)
- [ ] Add search history/suggestions
- [ ] Optimize database queries
- [ ] Add proper indexes
- [ ] Implement result caching
- [ ] Add analytics tracking
- [ ] Test performance with large datasets

## Benefits

### User Benefits
- **Efficiency**: Find tasks in seconds, not minutes
- **Productivity**: Less time searching, more time working
- **Better Planning**: Easy to see tasks by date/status
- **Customer Service**: Quickly find customer tasks during calls

### Business Benefits
- **Scalability**: System remains usable with hundreds of tasks
- **Better Oversight**: Admin can easily monitor specific criteria
- **Data Insights**: Search patterns reveal operational insights

### Technical Benefits
- **Performance**: Indexed searches are fast
- **Flexibility**: Easy to add new filter criteria
- **Reusability**: Components can be used elsewhere

## Technical Considerations

### Database
- Add indexes for commonly searched fields
- Consider PostgreSQL full-text search
- May need to add search-specific views
- Monitor query performance

### Performance
- Debounce search input (500ms)
- Cache recent searches
- Implement pagination properly
- Consider Elasticsearch for scale

### UX Considerations
- Show search suggestions
- Persist recent searches
- Clear indication of active filters
- Smooth animations and transitions

## Estimated Effort

**Total Estimate**: 7-8 days

### Breakdown
- Backend API: 2 days
- Basic search: 1 day
- Quick filters: 1 day
- Advanced filters: 2 days
- Testing & polish: 1-2 days

## Priority

**High** - Essential for scalability and daily operations. As task volume grows, this becomes critical for usability.

## Dependencies

- Existing task list implementation
- TanStack Query for data fetching
- Database indexes for performance
- May need PostgreSQL extensions for full-text search

## Related Items

- Offline search capability (future)
- Search analytics dashboard (future)
- Saved searches/filters (future)
- Export search results (future)

## Success Metrics

- Search results return in <500ms
- Users can find any task in <10 seconds
- 90% of searches successful on first try
- Reduced support calls about finding tasks
- Positive user feedback on search functionality

## Open Questions

1. **Search Scope**: Should search include completed tasks by default?
2. **Permissions**: Should workers see all tasks in search or only assigned?
3. **History**: How long to keep search history?
4. **Suggestions**: Show popular searches or personalized suggestions?
5. **Export**: Should search results be exportable?

## Notes

- Consider implementing search analytics to understand user needs
- May want to add "smart search" with natural language processing later
- Could add voice search for hands-free operation
- Search indexing strategy needs careful planning for performance
- Consider adding search shortcuts (e.g., "t:today" for today's tasks)