-- AlterTable
ALTER TABLE "EmailDraft" ADD COLUMN "aiModelUsed" TEXT;
ALTER TABLE "EmailDraft" ADD COLUMN "aiProviderUsed" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "aiModelUsed" TEXT;
ALTER TABLE "Lead" ADD COLUMN "aiProviderUsed" TEXT;

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
