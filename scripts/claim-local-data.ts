import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Claim Local Data ===\n");

  const existingUser = await prisma.user.findUnique({
    where: { email: "dev@clientpilot.local" },
  });

  if (existingUser) {
    console.log("Dev user already exists:");
    console.log("  Email: dev@clientpilot.local");
    console.log("  Password: password123");
    console.log("  ID:", existingUser.id);
    console.log();
  } else {
    const hash = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        email: "dev@clientpilot.local",
        name: "Dev User",
        passwordHash: hash,
      },
    });
    console.log("Created dev user:");
    console.log("  Email: dev@clientpilot.local");
    console.log("  Password: password123");
    console.log("  ID:", user.id);
    console.log();
  }

  const devUser = await prisma.user.findUnique({
    where: { email: "dev@clientpilot.local" },
  });
  if (!devUser) {
    console.error("Failed to get dev user");
    return;
  }

  const userId = devUser.id;
  let claimed = 0;

  const profileCount = await prisma.userProfile.count({ where: { userId: null } });
  if (profileCount > 0) {
    await prisma.userProfile.updateMany({ where: { userId: null }, data: { userId } });
    claimed += profileCount;
    console.log(`  UserProfile: ${profileCount}`);
  }

  const campaignCount = await prisma.campaign.count({ where: { userId: null } });
  if (campaignCount > 0) {
    await prisma.campaign.updateMany({ where: { userId: null }, data: { userId } });
    claimed += campaignCount;
    console.log(`  Campaign: ${campaignCount}`);
  }

  const leadCount = await prisma.lead.count({ where: { userId: null } });
  if (leadCount > 0) {
    await prisma.lead.updateMany({ where: { userId: null }, data: { userId } });
    claimed += leadCount;
    console.log(`  Lead: ${leadCount}`);
  }

  const draftCount = await prisma.emailDraft.count({ where: { userId: null } });
  if (draftCount > 0) {
    await prisma.emailDraft.updateMany({ where: { userId: null }, data: { userId } });
    claimed += draftCount;
    console.log(`  EmailDraft: ${draftCount}`);
  }

  const logCount = await prisma.emailSendLog.count({ where: { userId: null } });
  if (logCount > 0) {
    await prisma.emailSendLog.updateMany({ where: { userId: null }, data: { userId } });
    claimed += logCount;
    console.log(`  EmailSendLog: ${logCount}`);
  }

  const activityCount = await prisma.leadActivity.count({ where: { userId: null } });
  if (activityCount > 0) {
    await prisma.leadActivity.updateMany({ where: { userId: null }, data: { userId } });
    claimed += activityCount;
    console.log(`  LeadActivity: ${activityCount}`);
  }

  const aiLogCount = await prisma.aIUsageLog.count({ where: { userId: null } });
  if (aiLogCount > 0) {
    await prisma.aIUsageLog.updateMany({ where: { userId: null }, data: { userId } });
    claimed += aiLogCount;
    console.log(`  AIUsageLog: ${aiLogCount}`);
  }

  const unsubCount = await prisma.unsubscribe.count({ where: { userId: null } });
  if (unsubCount > 0) {
    await prisma.unsubscribe.updateMany({ where: { userId: null }, data: { userId } });
    claimed += unsubCount;
    console.log(`  Unsubscribe: ${unsubCount}`);
  }

  console.log();
  if (claimed > 0) {
    console.log(`Claimed ${claimed} orphan records.`);
  } else {
    console.log("No orphan records to claim.");
  }
  console.log("\nLogin at http://localhost:3000/login");
  console.log("  Email: dev@clientpilot.local");
  console.log("  Password: password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
