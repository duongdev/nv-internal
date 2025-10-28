# Payment System Transaction Pattern

When implementing checkout with payment collection, follow this critical pattern to prevent serverless timeouts.

## The Problem

Uploading files inside Prisma transactions can cause timeout (Vercel limit: 10s hobby, 60s pro).

## The Solution

Upload files BEFORE transaction, then perform atomic database operations:

```typescript
// ✅ CORRECT: Upload files BEFORE transaction
export async function checkOutWithPayment({
  taskId, userId, checkoutFiles, invoiceFile, storage
}) {
  // Step 1: Upload files BEFORE transaction (prevents timeout)
  const checkoutAttachments = checkoutFiles
    ? await uploadTaskAttachments({
        taskId, files: checkoutFiles, storage, userId, category: 'CHECKOUT'
      })
    : []

  const invoiceAttachment = invoiceFile
    ? (await uploadTaskAttachments({
        taskId, files: [invoiceFile], storage, userId, category: 'INVOICE'
      }))[0]
    : null  // Invoice is OPTIONAL

  // Step 2: Atomic transaction with timeout configuration
  const result = await prisma.$transaction(async (tx) => {
    // Atomic status update - prevents race conditions
    const task = await tx.task.update({
      where: {
        id: taskId,
        status: 'IN_PROGRESS'  // Condition prevents concurrent checkout
      },
      data: { status: 'COMPLETED', completedAt: new Date() }
    })

    if (!task) {
      throw new HTTPException(409, {
        message: 'Công việc đã được checkout bởi người khác',
        cause: 'CONCURRENT_CHECKOUT'
      })
    }

    // Create payment if collected (using pre-uploaded attachment IDs)
    if (paymentData.paymentCollected) {
      const payment = await tx.payment.create({
        data: {
          taskId,
          amount: paymentData.paymentAmount,
          invoiceAttachmentId: invoiceAttachment?.id,  // OPTIONAL
          // ... other fields
        }
      })

      // Log payment activity
      await createActivity({
        action: 'PAYMENT_COLLECTED',
        payload: { hasInvoice: !!invoiceAttachment }
      }, tx)
    }

    return { task, payment }
  }, {
    timeout: 10000,   // 10s for serverless environment
    maxWait: 5000,    // Max 5s wait for lock
  })
}
```

## Anti-pattern

```typescript
// ❌ WRONG: Uploading files inside transaction causes timeout
await prisma.$transaction(async (tx) => {
  const attachments = await uploadTaskAttachments(...)  // TIMEOUT RISK!
  await tx.payment.create({ invoiceAttachmentId: attachments[0].id })
})
```

## Key Implementation Requirements

- ✅ Upload files before transaction (prevents timeout)
- ✅ Atomic task status update with conditional `where` clause (prevents race conditions)
- ✅ Use pre-uploaded attachment IDs inside transaction
- ✅ Configure transaction timeout (10s for serverless)
- ✅ Invoice attachment is nullable/optional (trust workers)
- ✅ Activity logging includes audit trail with change history

## Database Schema

```prisma
model Payment {
  id                  String      @id @default(cuid())
  amount              Decimal     @db.Decimal(15, 4)  // GAAP-compliant precision
  currency            String      @default("VND")     // ISO 4217 code
  invoiceAttachmentId String?                         // OPTIONAL invoice
  invoiceAttachment   Attachment? @relation(...)
  // ... other fields
}

model Task {
  expectedRevenue  Decimal?  @db.Decimal(15, 4)  // Admin sets expected amount
  expectedCurrency String    @default("VND")
  payments         Payment[]                      // Auto-created at checkout
}
```

## Race Condition Prevention

The atomic status update ensures only one worker can complete the checkout:

```typescript
// First worker: succeeds
const task = await tx.task.update({
  where: { id: 123, status: 'IN_PROGRESS' },
  data: { status: 'COMPLETED' }
})  // ✅ Returns updated task

// Second worker (concurrent): fails
const task = await tx.task.update({
  where: { id: 123, status: 'IN_PROGRESS' },  // No longer IN_PROGRESS!
  data: { status: 'COMPLETED' }
})  // ❌ Returns null, throw 409 Conflict
```

## Reference

See implementation: `.claude/plans/v1/01-payment-system.md`
