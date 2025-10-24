-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "expectedCurrency" TEXT NOT NULL DEFAULT 'VND',
ADD COLUMN     "expectedRevenue" DECIMAL(15,4);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" INTEGER NOT NULL,
    "amount" DECIMAL(15,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedBy" TEXT NOT NULL,
    "invoiceAttachmentId" TEXT,
    "notes" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_invoiceAttachmentId_key" ON "Payment"("invoiceAttachmentId");

-- CreateIndex
CREATE INDEX "Payment_taskId_idx" ON "Payment"("taskId");

-- CreateIndex
CREATE INDEX "Payment_collectedBy_idx" ON "Payment"("collectedBy");

-- CreateIndex
CREATE INDEX "Payment_collectedAt_idx" ON "Payment"("collectedAt");

-- CreateIndex
CREATE INDEX "Payment_currency_idx" ON "Payment"("currency");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceAttachmentId_fkey" FOREIGN KEY ("invoiceAttachmentId") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
