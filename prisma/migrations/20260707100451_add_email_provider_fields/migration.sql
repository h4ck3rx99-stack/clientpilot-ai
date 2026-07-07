-- CreateTable
CREATE TABLE "UnsubscribeToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "campaignId" TEXT,
    "leadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailSendLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailDraftId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "reason" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "realSend" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT,
    "messageId" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailSendLog_emailDraftId_fkey" FOREIGN KEY ("emailDraftId") REFERENCES "EmailDraft" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailSendLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailSendLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmailSendLog" ("campaignId", "createdAt", "emailDraftId", "id", "leadId", "reason", "recipientEmail", "sentAt", "simulated", "status", "subject") SELECT "campaignId", "createdAt", "emailDraftId", "id", "leadId", "reason", "recipientEmail", "sentAt", "simulated", "status", "subject" FROM "EmailSendLog";
DROP TABLE "EmailSendLog";
ALTER TABLE "new_EmailSendLog" RENAME TO "EmailSendLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UnsubscribeToken_token_key" ON "UnsubscribeToken"("token");
