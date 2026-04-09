import prisma from "../lib/prisma";
import * as bcrypt from "bcrypt";

async function main() {
  console.log("🔍 Checking users in database...");

  const users = await prisma.users.findMany();

  if (users.length === 0) {
    console.log("⚠️ No users found! Running seed...");
    console.log("Please run: npm run db:seed");
    return;
  }

  console.log(`\n📋 Found ${users.length} users:\n`);

  for (const user of users) {
    console.log(`Username: ${user.username}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Active: ${user.is_active}`);
    console.log(
      `  Hash starts with: ${user.password_hash.substring(0, 20)}...`,
    );

    // Test password
    const isValid = await bcrypt.compare("password123", user.password_hash);
    console.log(
      `  Password "password123" valid: ${isValid ? "✅ YES" : "❌ NO"}`,
    );
    console.log("");
  }

  // If any user has invalid password, fix it
  const testUser = users.find((u) => u.username === "admin");
  if (testUser) {
    const isValid = await bcrypt.compare("password123", testUser.password_hash);
    if (!isValid) {
      console.log("🔧 Fixing admin password...");
      const hashedPassword = await bcrypt.hash("password123", 10);
      await prisma.users.update({
        where: { user_id: testUser.user_id },
        data: { password_hash: hashedPassword },
      });
      console.log("✅ Admin password fixed!");

      // Verify fix
      const updatedUser = await prisma.users.findUnique({
        where: { user_id: testUser.user_id },
      });
      const isNowValid = await bcrypt.compare(
        "password123",
        updatedUser!.password_hash,
      );
      console.log(
        `Verification: ${isNowValid ? "✅ VALID" : "❌ STILL INVALID"}`,
      );
    }
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
