-- CreateTable
CREATE TABLE "TestEmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "provider" TEXT,
    "reason" TEXT,
    "realSend" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestEmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TestEmailLog_userId_idx" ON "TestEmailLog"("userId");

-- CreateIndex
CREATE INDEX "TestEmailLog_createdAt_idx" ON "TestEmailLog"("createdAt");
