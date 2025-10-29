-- CreateIndex
CREATE INDEX "Activity_action_userId_createdAt_idx" ON "Activity"("action", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_status_completedAt_idx" ON "Task"("status", "completedAt");

-- CreateIndex
CREATE INDEX "Task_assigneeIds_idx" ON "Task"("assigneeIds");
