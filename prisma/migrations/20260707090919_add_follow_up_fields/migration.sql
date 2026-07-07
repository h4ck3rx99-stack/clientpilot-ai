-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'INITIAL',
    "followUpNumber" INTEGER NOT NULL DEFAULT 0,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmailDraft" ("body", "createdAt", "id", "leadId", "sentAt", "status", "subject", "updatedAt") SELECT "body", "createdAt", "id", "leadId", "sentAt", "status", "subject", "updatedAt" FROM "EmailDraft";
DROP TABLE "EmailDraft";
ALTER TABLE "new_EmailDraft" RENAME TO "EmailDraft";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
