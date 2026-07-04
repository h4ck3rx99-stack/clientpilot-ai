-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadActivity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
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
    CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("campaignId", "companyName", "createdAt", "email", "fitScore", "id", "industry", "offerAngle", "painPoint", "personalizationLine", "scoreBreakdown", "sourceUrl", "status", "updatedAt", "website") SELECT "campaignId", "companyName", "createdAt", "email", "fitScore", "id", "industry", "offerAngle", "painPoint", "personalizationLine", "scoreBreakdown", "sourceUrl", "status", "updatedAt", "website" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
