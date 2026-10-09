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

  const leadCount = await prisma.lead.count({ where: { userId: "" } });
  if (leadCount > 0) {
    await prisma.lead.updateMany({ where: { userId: "" }, data: { userId } });
    claimed += leadCount;
    console.log(`  Lead: ${leadCount}`);
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
