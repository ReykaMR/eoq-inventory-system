-- Migration: Add EOQ stored procedures, views, and triggers

-- ==========================================
-- 1. STORED PROCEDURE: sp_calculate_eoq
-- ==========================================
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
    -- Get parameter_id if not provided
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

    -- Get EOQ parameters
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

    -- Get lead time from product_suppliers
    SELECT COALESCE(lead_time_days, 0) INTO v_lead_time
    FROM product_suppliers
    WHERE product_id = p_product_id AND is_primary = true
    LIMIT 1;

    -- Calculate EOQ: Q* = √(2DS/H)
    v_eoq := SQRT((2 * v_annual_demand * v_ordering_cost) / v_holding_cost);

    -- Calculate daily demand
    v_daily_demand := v_annual_demand / v_working_days;

    -- Safety stock (simplified: 10% of demand during lead time)
    v_safety_stock := CEIL(v_daily_demand * v_lead_time * 0.1);

    -- Reorder Point: ROP = daily_demand * lead_time + safety_stock
    v_rop := CEIL(v_daily_demand * v_lead_time) + v_safety_stock;

    -- Orders per year
    v_orders_per_year := v_annual_demand / v_eoq;

    -- Order interval in days
    v_order_interval := v_working_days / v_orders_per_year;

    -- Total ordering cost
    v_total_ordering_cost := v_orders_per_year * v_ordering_cost;

    -- Total holding cost (average inventory = Q/2 + safety_stock)
    v_total_holding_cost := (v_eoq / 2 + v_safety_stock) * v_holding_cost;

    -- Total inventory cost
    v_total_cost := v_total_ordering_cost + v_total_holding_cost;

    -- Return results
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

-- ==========================================
-- 2. VIEW: v_stock_overview
-- ==========================================
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

-- ==========================================
-- 3. VIEW: v_latest_eoq
-- ==========================================
CREATE OR REPLACE VIEW v_latest_eoq AS
SELECT DISTINCT ON (p.product_id)
    p.product_id,
    p.product_code,
    p.product_name,
    c.category_name,
    u.unit_abbreviation,
    COALESCE(s.current_quantity, 0) as current_stock,
    ep.parameter_id,
    ep.annual_demand,
    ep.ordering_cost,
    ep.holding_cost_per_unit,
    ep.working_days_per_year,
    ps.lead_time_days,
    ps.supplier_id,
    sup.supplier_name,
    ps.supplier_price,
    ec.calculation_id,
    ec.eoq_quantity,
    ec.reorder_point,
    ec.safety_stock,
    ec.total_inventory_cost,
    ec.calculation_date,
    CASE 
        WHEN COALESCE(s.current_quantity, 0) <= ec.reorder_point THEN 'PERLU PESAN'
        ELSE 'TIDAK PERLU'
    END as purchase_recommendation
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
INNER JOIN units u ON p.unit_id = u.unit_id
LEFT JOIN stock s ON p.product_id = s.product_id
LEFT JOIN LATERAL (
    SELECT * FROM eoq_parameters 
    WHERE product_id = p.product_id AND is_active = true 
    ORDER BY effective_date DESC 
    LIMIT 1
) ep ON true
LEFT JOIN LATERAL (
    SELECT * FROM product_suppliers 
    WHERE product_id = p.product_id AND is_primary = true 
    LIMIT 1
) ps ON true
LEFT JOIN suppliers sup ON ps.supplier_id = sup.supplier_id
LEFT JOIN LATERAL (
    SELECT * FROM eoq_calculations 
    WHERE product_id = p.product_id 
    ORDER BY calculation_date DESC 
    LIMIT 1
) ec ON true
WHERE p.is_active = true
ORDER BY p.product_id, ec.calculation_date DESC NULLS LAST;

-- ==========================================
-- 4. VIEW: v_demand_summary
-- ==========================================
CREATE OR REPLACE VIEW v_demand_summary AS
SELECT 
    p.product_id,
    p.product_code,
    p.product_name,
    c.category_name,
    dh.period_year,
    dh.period_month,
    dh.demand_quantity,
    dh.notes,
    u.full_name as recorded_by_name,
    dh.created_at,
    dh.updated_at
FROM demand_history dh
INNER JOIN products p ON dh.product_id = p.product_id
INNER JOIN categories c ON p.category_id = c.category_id
LEFT JOIN users u ON dh.recorded_by = u.user_id
ORDER BY dh.period_year DESC, dh.period_month DESC;

-- ==========================================
-- 5. VIEW: v_dashboard_summary
-- ==========================================
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT 
    (SELECT COALESCE(SUM(s.current_quantity * p.purchase_price), 0) 
     FROM stock s 
     INNER JOIN products p ON s.product_id = p.product_id) as total_stock_value,
    (SELECT COUNT(*) 
     FROM v_latest_eoq 
     WHERE purchase_recommendation = 'PERLU PESAN') as products_need_reorder,
    (SELECT COALESCE(SUM(total_amount), 0) 
     FROM purchase_orders 
     WHERE status IN ('draft', 'diajukan')) as pending_po_value,
    (SELECT COUNT(*) 
     FROM purchase_orders 
     WHERE status = 'diajukan') as pending_approval_count;

-- ==========================================
-- 6. TRIGGER FUNCTION: trg_stock_transactions_after_insert
-- ==========================================
CREATE OR REPLACE FUNCTION trg_stock_transactions_after_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_quantity_before DECIMAL(14,4);
    v_quantity_after DECIMAL(14,4);
    v_current_stock DECIMAL(14,4);
BEGIN
    -- Get current stock
    SELECT COALESCE(current_quantity, 0) INTO v_current_stock
    FROM stock
    WHERE product_id = NEW.product_id;

    v_quantity_before := v_current_stock;

    -- Update stock based on transaction type
    IF NEW.transaction_type = 'IN' OR NEW.transaction_type = 'RECEIVE' THEN
        v_quantity_after := v_quantity_before + NEW.quantity;
    ELSIF NEW.transaction_type = 'OUT' THEN
        v_quantity_after := v_quantity_before - NEW.quantity;
    ELSIF NEW.transaction_type = 'ADJUSTMENT' THEN
        v_quantity_after := NEW.quantity; -- Direct adjustment
    ELSE
        v_quantity_after := v_quantity_before;
    END IF;

    -- Update stock table
    INSERT INTO stock (product_id, current_quantity, last_updated)
    VALUES (NEW.product_id, v_quantity_after, NOW())
    ON CONFLICT (product_id) 
    DO UPDATE SET 
        current_quantity = v_quantity_after,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_stock_transactions_after_insert ON stock_transactions;
CREATE TRIGGER trg_stock_transactions_after_insert
    AFTER INSERT ON stock_transactions
    FOR EACH ROW
    EXECUTE FUNCTION trg_stock_transactions_after_insert();

-- ==========================================
-- 7. TRIGGER FUNCTION: Update PO total amount
-- ==========================================
CREATE OR REPLACE FUNCTION trg_update_po_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE purchase_orders
    SET 
        total_amount = (
            SELECT COALESCE(SUM(subtotal), 0)
            FROM purchase_order_items
            WHERE po_id = NEW.po_id
        ),
        updated_at = NOW()
    WHERE po_id = NEW.po_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for PO items
DROP TRIGGER IF EXISTS trg_po_items_after_insert ON purchase_order_items;
CREATE TRIGGER trg_po_items_after_insert
    AFTER INSERT ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_po_total();

DROP TRIGGER IF EXISTS trg_po_items_after_update ON purchase_order_items;
CREATE TRIGGER trg_po_items_after_update
    AFTER UPDATE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_po_total();

-- ==========================================
-- 8. TRIGGER FUNCTION: Auto receive stock when PO status changes
-- ==========================================
CREATE OR REPLACE FUNCTION trg_po_receive_stock()
RETURNS TRIGGER AS $$
DECLARE
    po_item RECORD;
BEGIN
    -- When PO status changes to 'diterima', create stock transactions
    IF OLD.status != 'diterima' AND NEW.status = 'diterima' THEN
        FOR po_item IN 
            SELECT * FROM purchase_order_items WHERE po_id = NEW.po_id
        LOOP
            -- Insert stock transaction for each item
            INSERT INTO stock_transactions (
                product_id,
                transaction_type,
                quantity,
                quantity_before,
                quantity_after,
                reference_type,
                reference_id,
                notes,
                created_by
            )
            SELECT 
                po_item.product_id,
                'RECEIVE',
                po_item.quantity_received,
                COALESCE(s.current_quantity, 0),
                COALESCE(s.current_quantity, 0) + po_item.quantity_received,
                'PURCHASE_ORDER',
                NEW.po_id,
                'Penerimaan PO: ' || NEW.po_number,
                NEW.approved_by
            FROM stock s
            WHERE s.product_id = po_item.product_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_po_receive_stock ON purchase_orders;
CREATE TRIGGER trg_po_receive_stock
    AFTER UPDATE ON purchase_orders
    FOR EACH ROW
    WHEN (OLD.status != 'diterima' AND NEW.status = 'diterima')
    EXECUTE FUNCTION trg_po_receive_stock();
