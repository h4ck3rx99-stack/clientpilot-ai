-- CreateTable
CREATE TABLE "UserActionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "UserActionLog_userId_actionType_createdAt_idx" ON "UserActionLog"("userId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "UserActionLog_userId_createdAt_idx" ON "UserActionLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_provider_idx" ON "AIUsageLog"("provider");

-- CreateIndex
CREATE INDEX "AIUsageLog_taskType_idx" ON "AIUsageLog"("taskType");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "Campaign_userId_idx" ON "Campaign"("userId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_createdAt_idx" ON "Campaign"("createdAt");

-- CreateIndex
CREATE INDEX "EmailDraft_userId_idx" ON "EmailDraft"("userId");

-- CreateIndex
CREATE INDEX "EmailDraft_leadId_idx" ON "EmailDraft"("leadId");

-- CreateIndex
CREATE INDEX "EmailDraft_status_idx" ON "EmailDraft"("status");

-- CreateIndex
CREATE INDEX "EmailDraft_type_idx" ON "EmailDraft"("type");

-- CreateIndex
CREATE INDEX "EmailDraft_createdAt_idx" ON "EmailDraft"("createdAt");

-- CreateIndex
CREATE INDEX "EmailSendLog_userId_idx" ON "EmailSendLog"("userId");

-- CreateIndex
CREATE INDEX "EmailSendLog_campaignId_idx" ON "EmailSendLog"("campaignId");

-- CreateIndex
CREATE INDEX "EmailSendLog_status_idx" ON "EmailSendLog"("status");

-- CreateIndex
CREATE INDEX "EmailSendLog_sentAt_idx" ON "EmailSendLog"("sentAt");

-- CreateIndex
CREATE INDEX "EmailSendLog_createdAt_idx" ON "EmailSendLog"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");

-- CreateIndex
CREATE INDEX "Lead_campaignId_idx" ON "Lead"("campaignId");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_pipelineStatus_idx" ON "Lead"("pipelineStatus");

-- CreateIndex
CREATE INDEX "Lead_fitScore_idx" ON "Lead"("fitScore");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "LeadActivity_userId_idx" ON "LeadActivity"("userId");

-- CreateIndex
CREATE INDEX "LeadActivity_campaignId_idx" ON "LeadActivity"("campaignId");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "LeadActivity"("createdAt");

-- CreateIndex
CREATE INDEX "Unsubscribe_userId_idx" ON "Unsubscribe"("userId");

-- CreateIndex
CREATE INDEX "Unsubscribe_email_idx" ON "Unsubscribe"("email");
