# Activity-Based Event Pattern

When implementing task events (check-in/out, comments, status changes), leverage the existing Activity model.

## Core Principles

- **Reuse existing Activity model** for all event logging - zero DB changes needed
- Store event-specific data in flexible JSON payload field
- Upload attachments via existing `uploadTaskAttachments` service
- Create abstracted service functions for maximum code reuse (85% typical)
- All events appear in unified activity feed automatically

## Example Event Payloads

### Check-in/out Events
```typescript
{
  type: 'CHECK_IN' | 'CHECK_OUT',
  geoLocation: { id, lat, lng },
  distanceFromTask: number,
  attachments: [{ id, mimeType, originalFilename }],
  notes?: string,
  warnings?: string[]
}
```

### Comment Events
```typescript
{
  type: 'COMMENT',
  comment: 'Máy lạnh đã được vệ sinh',
  attachments?: [{ id, mimeType, originalFilename }],
  mentionedUsers?: ['usr_xxx'] // Future enhancement
}
```

## Benefits

- ✅ **Zero migrations** for new event types
- ✅ **85% code reuse** between different events
- ✅ Unified feed (all events chronological)
- ✅ Built-in indexing (topic, userId, createdAt)
- ✅ Flexible payload evolves without schema changes

## Reference Implementations

- Check-in/out: `.claude/tasks/20251022-211855-implement-checkin-checkout-system.md`
- Comments: `.claude/tasks/20251023-050349-implement-task-comments.md`
