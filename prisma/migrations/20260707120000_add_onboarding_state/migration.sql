-- CreateTable
CREATE TABLE "OnboardingState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "firstCampaignCreated" BOOLEAN NOT NULL DEFAULT false,
    "firstLeadsAdded" BOOLEAN NOT NULL DEFAULT false,
    "firstLeadsAnalyzed" BOOLEAN NOT NULL DEFAULT false,
    "firstDraftGenerated" BOOLEAN NOT NULL DEFAULT false,
    "firstDraftQueued" BOOLEAN NOT NULL DEFAULT false,
    "firstSendCompleted" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OnboardingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingState_userId_key" ON "OnboardingState"("userId");
