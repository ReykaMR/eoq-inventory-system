// Seed data untuk EOQ Inventory System

import prisma from "../lib/prisma";
import * as bcrypt from "bcrypt";

async function main() {
  console.log("🌱 Starting seed...");

  // Hash password untuk semua user
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create Users
  const users = await Promise.all([
    prisma.users.create({
      data: {
        username: "admin",
        password_hash: hashedPassword,
        full_name: "System Administrator",
        email: "admin@eoq.local",
        role: "admin",
      },
    }),
    prisma.users.create({
      data: {
        username: "manager",
        password_hash: hashedPassword,
        full_name: "Manager Purchase",
        email: "manager@eoq.local",
        role: "manager",
      },
    }),
    prisma.users.create({
      data: {
        username: "staff_beli",
        password_hash: hashedPassword,
        full_name: "Staff Pembelian",
        email: "staff.beli@eoq.local",
        role: "staff_pembelian",
      },
    }),
    prisma.users.create({
      data: {
        username: "staff_gudang",
        password_hash: hashedPassword,
        full_name: "Staff Gudang",
        email: "staff.gudang@eoq.local",
        role: "staff_gudang",
      },
    }),
  ]);
  console.log("✅ Users created");

  // 2. Create Categories
  const categories = await Promise.all([
    prisma.categories.create({
      data: {
        category_code: "RAW",
        category_name: "Bahan Baku",
        description: "Bahan baku produksi",
      },
    }),
    prisma.categories.create({
      data: {
        category_code: "FINISH",
        category_name: "Barang Jadi",
        description: "Produk jadi siap jual",
      },
    }),
    prisma.categories.create({
      data: {
        category_code: "PACK",
        category_name: "Material Kemasan",
        description: "Kemasan dan packaging",
      },
    }),
  ]);
  console.log("✅ Categories created");

  // 3. Create Units
  const units = await Promise.all([
    prisma.units.create({
      data: {
        unit_name: "Kilogram",
        unit_abbreviation: "kg",
      },
    }),
    prisma.units.create({
      data: {
        unit_name: "Liter",
        unit_abbreviation: "L",
      },
    }),
    prisma.units.create({
      data: {
        unit_name: "Unit",
        unit_abbreviation: "unit",
      },
    }),
    prisma.units.create({
      data: {
        unit_name: "Piece",
        unit_abbreviation: "pcs",
      },
    }),
    prisma.units.create({
      data: {
        unit_name: "Box",
        unit_abbreviation: "box",
      },
    }),
  ]);
  console.log("✅ Units created");

  // 4. Create Suppliers
  const suppliers = await Promise.all([
    prisma.suppliers.create({
      data: {
        supplier_code: "SUP001",
        supplier_name: "PT. Supplier Utama",
        contact_person: "Budi Santoso",
        phone: "021-12345678",
        email: "info@supplierutama.com",
        address: "Jl. Industri Raya No. 123",
        city: "Jakarta",
        province: "DKI Jakarta",
        postal_code: "12345",
      },
    }),
    prisma.suppliers.create({
      data: {
        supplier_code: "SUP002",
        supplier_name: "CV. Mitra Supply",
        contact_person: "Siti Aminah",
        phone: "021-87654321",
        email: "contact@mitrasupply.com",
        address: "Jl. Pabrik No. 45",
        city: "Tangerang",
        province: "Banten",
        postal_code: "54321",
      },
    }),
    prisma.suppliers.create({
      data: {
        supplier_code: "SUP003",
        supplier_name: "UD. Sumber Rejeki",
        contact_person: "Ahmad Hidayat",
        phone: "031-11122233",
        email: "info@sumberrejeki.com",
        address: "Jl. Gudang Besar No. 78",
        city: "Surabaya",
        province: "Jawa Timur",
        postal_code: "67890",
      },
    }),
  ]);
  console.log("✅ Suppliers created");

  // 5. Create Products
  const products = await Promise.all([
    prisma.products.create({
      data: {
        product_code: "RAW-001",
        product_name: "Bahan A Premium",
        description: "Bahan baku utama kualitas premium",
        category_id: categories[0].category_id,
        unit_id: units[0].unit_id,
        purchase_price: 50000,
        selling_price: 75000,
        min_stock: 100,
        max_stock: 1000,
      },
    }),
    prisma.products.create({
      data: {
        product_code: "RAW-002",
        product_name: "Bahan B Standar",
        description: "Bahan baku sekunder kualitas standar",
        category_id: categories[0].category_id,
        unit_id: units[1].unit_id,
        purchase_price: 30000,
        selling_price: 45000,
        min_stock: 200,
        max_stock: 2000,
      },
    }),
    prisma.products.create({
      data: {
        product_code: "FIN-001",
        product_name: "Produk Jadi X",
        description: "Produk jadi tipe X siap jual",
        category_id: categories[1].category_id,
        unit_id: units[3].unit_id,
        purchase_price: 100000,
        selling_price: 150000,
        min_stock: 50,
        max_stock: 500,
      },
    }),
    prisma.products.create({
      data: {
        product_code: "PACK-001",
        product_name: "Kemasan Box Besar",
        description: "Kemasan ukuran besar untuk produk",
        category_id: categories[2].category_id,
        unit_id: units[4].unit_id,
        purchase_price: 5000,
        selling_price: 7500,
        min_stock: 500,
        max_stock: 5000,
      },
    }),
  ]);
  console.log("✅ Products created");

  // 6. Create Product-Supplier Relationships
  await Promise.all([
    prisma.product_suppliers.create({
      data: {
        product_id: products[0].product_id,
        supplier_id: suppliers[0].supplier_id,
        lead_time_days: 7,
        min_order_qty: 50,
        supplier_price: 48000,
        is_primary: true,
      },
    }),
    prisma.product_suppliers.create({
      data: {
        product_id: products[1].product_id,
        supplier_id: suppliers[1].supplier_id,
        lead_time_days: 5,
        min_order_qty: 100,
        supplier_price: 28000,
        is_primary: true,
      },
    }),
    prisma.product_suppliers.create({
      data: {
        product_id: products[2].product_id,
        supplier_id: suppliers[0].supplier_id,
        lead_time_days: 10,
        min_order_qty: 20,
        supplier_price: 95000,
        is_primary: true,
      },
    }),
    prisma.product_suppliers.create({
      data: {
        product_id: products[3].product_id,
        supplier_id: suppliers[2].supplier_id,
        lead_time_days: 3,
        min_order_qty: 100,
        supplier_price: 4500,
        is_primary: true,
      },
    }),
  ]);
  console.log("✅ Product-Supplier relationships created");

  // 7. Create Initial Stock
  await Promise.all([
    prisma.stock.create({
      data: {
        product_id: products[0].product_id,
        current_quantity: 250,
      },
    }),
    prisma.stock.create({
      data: {
        product_id: products[1].product_id,
        current_quantity: 150,
      },
    }),
    prisma.stock.create({
      data: {
        product_id: products[2].product_id,
        current_quantity: 80,
      },
    }),
    prisma.stock.create({
      data: {
        product_id: products[3].product_id,
        current_quantity: 600,
      },
    }),
  ]);
  console.log("✅ Initial stock created");

  // 8. Create EOQ Parameters
  await Promise.all([
    prisma.eoq_parameters.create({
      data: {
        product_id: products[0].product_id,
        annual_demand: 1200,
        ordering_cost: 150000,
        holding_cost_per_unit: 5000,
        working_days_per_year: 300,
        effective_date: new Date(),
        is_active: true,
        created_by: users[1].user_id,
      },
    }),
    prisma.eoq_parameters.create({
      data: {
        product_id: products[1].product_id,
        annual_demand: 2400,
        ordering_cost: 100000,
        holding_cost_per_unit: 3000,
        working_days_per_year: 300,
        effective_date: new Date(),
        is_active: true,
        created_by: users[1].user_id,
      },
    }),
    prisma.eoq_parameters.create({
      data: {
        product_id: products[2].product_id,
        annual_demand: 600,
        ordering_cost: 200000,
        holding_cost_per_unit: 10000,
        working_days_per_year: 300,
        effective_date: new Date(),
        is_active: true,
        created_by: users[1].user_id,
      },
    }),
    prisma.eoq_parameters.create({
      data: {
        product_id: products[3].product_id,
        annual_demand: 6000,
        ordering_cost: 75000,
        holding_cost_per_unit: 500,
        working_days_per_year: 300,
        effective_date: new Date(),
        is_active: true,
        created_by: users[1].user_id,
      },
    }),
  ]);
  console.log("✅ EOQ Parameters created");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
