import prisma from "../lib/prisma";

async function main() {
  console.log("🔄 Resetting all tables...");

  // Disable foreign key constraints temporarily
  await prisma.$executeRawUnsafe(`
    SET session_replication_role = 'replica';
  `);

  // Truncate all tables and reset sequences
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      notifications,
      stock_transactions,
      purchase_order_items,
      purchase_orders,
      eoq_calculations,
      eoq_parameters,
      product_suppliers,
      stock,
      demand_history,
      products,
      categories,
      units,
      suppliers,
      users
    RESTART IDENTITY CASCADE;
  `);

  // Re-enable foreign key constraints
  await prisma.$executeRawUnsafe(`
    SET session_replication_role = 'origin';
  `);

  console.log("✅ All tables truncated and sequences reset to 1");
}

main()
  .catch((e) => {
    console.error("❌ Reset failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
