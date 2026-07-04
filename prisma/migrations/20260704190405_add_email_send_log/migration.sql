-- CreateTable
CREATE TABLE "EmailSendLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailDraftId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "reason" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailSendLog_emailDraftId_fkey" FOREIGN KEY ("emailDraftId") REFERENCES "EmailDraft" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailSendLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailSendLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
