import prisma from "../lib/prisma";
import * as bcrypt from "bcrypt";

async function main() {
  console.log("🧪 Testing login...\n");

  const testCases = [
    { username: "admin", password: "password123" },
    { username: "manager", password: "password123" },
    { username: "staff_beli", password: "password123" },
    { username: "staff_gudang", password: "password123" },
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.username}`);

    const user = await prisma.users.findUnique({
      where: { username: testCase.username },
    });

    if (!user) {
      console.log(`  ❌ User not found\n`);
      continue;
    }

    console.log(`  ✅ User found (ID: ${user.user_id})`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Active: ${user.is_active}`);

    const isValid = await bcrypt.compare(testCase.password, user.password_hash);

    if (isValid) {
      console.log(`  ✅ Password valid`);
      console.log(`  ✅ LOGIN SUCCESSFUL for ${testCase.username}\n`);
    } else {
      console.log(`  ❌ Password INVALID\n`);
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
