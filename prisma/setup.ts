import prisma from "../lib/prisma";

async function main() {
  console.log("🚀 Setting up EOQ Inventory System...");

  // 1. Create stored procedure sp_calculate_eoq
  console.log("\n1️⃣ Creating stored procedure sp_calculate_eoq...");
  try {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION sp_calculate_eoq(
          p_product_id INT,
          p_parameter_id INT DEFAULT NULL
      )
      RETURNS TABLE (
          eoq_quantity DECIMAL(14,4),
          reorder_point DECIMAL(14,4),
          safety_stock DECIMAL(14,4),
          total_inventory_cost DECIMAL(15,2),
          orders_per_year DECIMAL(10,4),
          order_interval_days DECIMAL(10,2),
          total_ordering_cost DECIMAL(15,2),
          total_holding_cost DECIMAL(15,2)
      )
      LANGUAGE plpgsql
      AS $$
      DECLARE
          v_annual_demand DECIMAL(14,4);
          v_ordering_cost DECIMAL(15,2);
          v_holding_cost DECIMAL(15,4);
          v_working_days INT;
          v_lead_time INT;
          v_eoq DECIMAL(14,4);
          v_daily_demand DECIMAL(14,4);
          v_safety_stock DECIMAL(14,4);
          v_rop DECIMAL(14,4);
          v_orders_per_year DECIMAL(10,4);
          v_order_interval DECIMAL(10,2);
          v_total_ordering_cost DECIMAL(15,2);
          v_total_holding_cost DECIMAL(15,2);
          v_total_cost DECIMAL(15,2);
          v_param_id INT;
      BEGIN
          IF p_parameter_id IS NULL THEN
              SELECT parameter_id INTO v_param_id
              FROM eoq_parameters
              WHERE product_id = p_product_id AND is_active = true
              ORDER BY effective_date DESC
              LIMIT 1;
          ELSE
              v_param_id := p_parameter_id;
          END IF;

          IF v_param_id IS NULL THEN
              RAISE EXCEPTION 'No active EOQ parameters found for product %', p_product_id;
          END IF;

          SELECT 
              annual_demand,
              ordering_cost,
              holding_cost_per_unit,
              working_days_per_year
          INTO 
              v_annual_demand,
              v_ordering_cost,
              v_holding_cost,
              v_working_days
          FROM eoq_parameters
          WHERE parameter_id = v_param_id;

          SELECT COALESCE(lead_time_days, 0) INTO v_lead_time
          FROM product_suppliers
          WHERE product_id = p_product_id AND is_primary = true
          LIMIT 1;

          v_eoq := SQRT((2 * v_annual_demand * v_ordering_cost) / v_holding_cost);
          v_daily_demand := v_annual_demand / v_working_days;
          v_safety_stock := CEIL(v_daily_demand * v_lead_time * 0.1);
          v_rop := CEIL(v_daily_demand * v_lead_time) + v_safety_stock;
          v_orders_per_year := v_annual_demand / v_eoq;
          v_order_interval := v_working_days / v_orders_per_year;
          v_total_ordering_cost := v_orders_per_year * v_ordering_cost;
          v_total_holding_cost := (v_eoq / 2 + v_safety_stock) * v_holding_cost;
          v_total_cost := v_total_ordering_cost + v_total_holding_cost;

          RETURN QUERY SELECT 
              ROUND(v_eoq, 4),
              v_rop,
              v_safety_stock,
              v_total_cost,
              ROUND(v_orders_per_year, 4),
              ROUND(v_order_interval, 2),
              v_total_ordering_cost,
              v_total_holding_cost;
      END;
      $$;
    `);
    console.log("✅ Stored procedure created");
  } catch (error) {
    console.error("❌ Error creating stored procedure:", error);
  }

  // 2. Create views
  console.log("\n2️⃣ Creating views...");
  try {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW v_stock_overview AS
      SELECT 
          p.product_id,
          p.product_code,
          p.product_name,
          c.category_name,
          u.unit_abbreviation,
          COALESCE(s.current_quantity, 0) as current_stock,
          p.min_stock,
          p.max_stock,
          CASE 
              WHEN COALESCE(s.current_quantity, 0) = 0 THEN 'HABIS'
              WHEN COALESCE(s.current_quantity, 0) <= p.min_stock THEN 'REORDER'
              ELSE 'AMAN'
          END as stock_status,
          s.last_updated
      FROM products p
      INNER JOIN categories c ON p.category_id = c.category_id
      INNER JOIN units u ON p.unit_id = u.unit_id
      LEFT JOIN stock s ON p.product_id = s.product_id
      WHERE p.is_active = true;
    `);
    console.log("✅ v_stock_overview created");
  } catch (error) {
    console.error("❌ Error creating views:", error);
  }

  // 3. Create trigger for stock transactions
  console.log("\n3️⃣ Creating stock transaction trigger...");
  try {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION trg_stock_transactions_after_insert()
      RETURNS TRIGGER AS $$
      DECLARE
          v_quantity_before DECIMAL(14,4);
          v_quantity_after DECIMAL(14,4);
          v_current_stock DECIMAL(14,4);
      BEGIN
          SELECT COALESCE(current_quantity, 0) INTO v_current_stock
          FROM stock
          WHERE product_id = NEW.product_id;

          v_quantity_before := v_current_stock;

          IF NEW.transaction_type = 'IN' OR NEW.transaction_type = 'RECEIVE' THEN
              v_quantity_after := v_quantity_before + NEW.quantity;
          ELSIF NEW.transaction_type = 'OUT' THEN
              v_quantity_after := v_quantity_before - NEW.quantity;
          ELSIF NEW.transaction_type = 'ADJUSTMENT' THEN
              v_quantity_after := NEW.quantity;
          ELSE
              v_quantity_after := v_quantity_before;
          END IF;

          INSERT INTO stock (product_id, current_quantity, last_updated)
          VALUES (NEW.product_id, v_quantity_after, NOW())
          ON CONFLICT (product_id) 
          DO UPDATE SET 
              current_quantity = v_quantity_after,
              last_updated = NOW();

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_stock_transactions_after_insert ON stock_transactions;
      CREATE TRIGGER trg_stock_transactions_after_insert
          AFTER INSERT ON stock_transactions
          FOR EACH ROW
          EXECUTE FUNCTION trg_stock_transactions_after_insert();
    `);
    console.log("✅ Stock transaction trigger created");
  } catch (error) {
    console.error("❌ Error creating trigger:", error);
  }

  console.log("\n✅ Setup completed!");
  console.log("\n📝 Next steps:");
  console.log("   1. Run: npm run db:seed");
  console.log("   2. Run: npm run dev");
  console.log("   3. Open: http://localhost:3000");
}

main()
  .catch((e) => {
    console.error("❌ Setup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
