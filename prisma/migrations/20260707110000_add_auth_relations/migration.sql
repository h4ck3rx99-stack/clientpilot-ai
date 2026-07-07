-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AIUsageLog" ("createdAt", "errorMessage", "id", "model", "provider", "success", "taskType") SELECT "createdAt", "errorMessage", "id", "model", "provider", "success", "taskType" FROM "AIUsageLog";
DROP TABLE "AIUsageLog";
ALTER TABLE "new_AIUsageLog" RENAME TO "AIUsageLog";
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "serviceToPitch" TEXT NOT NULL,
    "targetNiche" TEXT NOT NULL,
    "targetLocation" TEXT NOT NULL,
    "offer" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "dailySendLimit" INTEGER NOT NULL DEFAULT 20,
    "minimumFitScore" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("createdAt", "cta", "dailySendLimit", "id", "minimumFitScore", "name", "offer", "serviceToPitch", "status", "targetLocation", "targetNiche", "updatedAt") SELECT "createdAt", "cta", "dailySendLimit", "id", "minimumFitScore", "name", "offer", "serviceToPitch", "status", "targetLocation", "targetNiche", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE TABLE "new_EmailDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'INITIAL',
    "followUpNumber" INTEGER NOT NULL DEFAULT 0,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "aiProviderUsed" TEXT,
    "aiModelUsed" TEXT,
    CONSTRAINT "EmailDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EmailDraft" ("aiModelUsed", "aiProviderUsed", "body", "createdAt", "followUpNumber", "id", "leadId", "sentAt", "status", "subject", "type", "updatedAt") SELECT "aiModelUsed", "aiProviderUsed", "body", "createdAt", "followUpNumber", "id", "leadId", "sentAt", "status", "subject", "type", "updatedAt" FROM "EmailDraft";
DROP TABLE "EmailDraft";
ALTER TABLE "new_EmailDraft" RENAME TO "EmailDraft";
CREATE TABLE "new_EmailSendLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailDraftId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
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
    CONSTRAINT "EmailSendLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailSendLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EmailSendLog" ("campaignId", "createdAt", "emailDraftId", "id", "leadId", "messageId", "provider", "realSend", "reason", "recipientEmail", "sentAt", "simulated", "status", "subject") SELECT "campaignId", "createdAt", "emailDraftId", "id", "leadId", "messageId", "provider", "realSend", "reason", "recipientEmail", "sentAt", "simulated", "status", "subject" FROM "EmailSendLog";
DROP TABLE "EmailSendLog";
ALTER TABLE "new_EmailSendLog" RENAME TO "EmailSendLog";
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "email" TEXT,
    "sourceUrl" TEXT,
    "industry" TEXT,
    "painPoint" TEXT,
    "offerAngle" TEXT,
    "personalizationLine" TEXT,
    "fitScore" INTEGER NOT NULL DEFAULT 0,
    "scoreBreakdown" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "pipelineStatus" TEXT NOT NULL DEFAULT 'NOT_CONTACTED',
    "lastContactedAt" DATETIME,
    "repliedAt" DATETIME,
    "nextFollowUpAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "aiProviderUsed" TEXT,
    "aiModelUsed" TEXT,
    "discoverySource" TEXT,
    "extractionConfidence" INTEGER,
    "extractionNotes" TEXT,
    CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("aiModelUsed", "aiProviderUsed", "campaignId", "companyName", "createdAt", "discoverySource", "email", "extractionConfidence", "extractionNotes", "fitScore", "id", "industry", "lastContactedAt", "nextFollowUpAt", "notes", "offerAngle", "painPoint", "personalizationLine", "pipelineStatus", "repliedAt", "scoreBreakdown", "sourceUrl", "status", "updatedAt", "website") SELECT "aiModelUsed", "aiProviderUsed", "campaignId", "companyName", "createdAt", "discoverySource", "email", "extractionConfidence", "extractionNotes", "fitScore", "id", "industry", "lastContactedAt", "nextFollowUpAt", "notes", "offerAngle", "painPoint", "personalizationLine", "pipelineStatus", "repliedAt", "scoreBreakdown", "sourceUrl", "status", "updatedAt", "website" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE TABLE "new_LeadActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadActivity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LeadActivity" ("campaignId", "createdAt", "id", "leadId", "message", "type") SELECT "campaignId", "createdAt", "id", "leadId", "message", "type" FROM "LeadActivity";
DROP TABLE "LeadActivity";
ALTER TABLE "new_LeadActivity" RENAME TO "LeadActivity";
CREATE TABLE "new_Unsubscribe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "reason" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Unsubscribe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Unsubscribe" ("createdAt", "email", "id", "reason") SELECT "createdAt", "email", "id", "reason" FROM "Unsubscribe";
DROP TABLE "Unsubscribe";
ALTER TABLE "new_Unsubscribe" RENAME TO "Unsubscribe";
CREATE UNIQUE INDEX "Unsubscribe_email_key" ON "Unsubscribe"("email");
CREATE TABLE "new_UnsubscribeToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "campaignId" TEXT,
    "leadId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnsubscribeToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UnsubscribeToken" ("campaignId", "createdAt", "email", "id", "leadId", "token") SELECT "campaignId", "createdAt", "email", "id", "leadId", "token" FROM "UnsubscribeToken";
DROP TABLE "UnsubscribeToken";
ALTER TABLE "new_UnsubscribeToken" RENAME TO "UnsubscribeToken";
CREATE UNIQUE INDEX "UnsubscribeToken_token_key" ON "UnsubscribeToken"("token");
CREATE TABLE "new_UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "businessName" TEXT,
    "senderName" TEXT,
    "senderEmail" TEXT,
    "services" TEXT,
    "proof" TEXT,
    "tone" TEXT,
    "defaultCTA" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserProfile" ("businessName", "createdAt", "defaultCTA", "id", "proof", "senderEmail", "senderName", "services", "tone", "updatedAt") SELECT "businessName", "createdAt", "defaultCTA", "id", "proof", "senderEmail", "senderName", "services", "tone", "updatedAt" FROM "UserProfile";
DROP TABLE "UserProfile";
ALTER TABLE "new_UserProfile" RENAME TO "UserProfile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
