import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get products where current stock <= ROP (need to reorder)
    const recommendations = await prisma.$queryRaw`
      SELECT 
        p.product_id,
        p.product_code,
        p.product_name,
        c.category_name,
        u.unit_abbreviation,
        COALESCE(s.current_quantity, 0) as current_stock,
        ec.eoq_quantity,
        ec.reorder_point,
        ec.safety_stock,
        ec.total_inventory_cost,
        ps.lead_time_days,
        ps.supplier_id,
        sup.supplier_name,
        ps.supplier_price,
        CASE 
          WHEN COALESCE(s.current_quantity, 0) <= ec.reorder_point THEN 'PERLU PESAN'
          ELSE 'TIDAK PERLU'
        END as purchase_recommendation
      FROM products p
      INNER JOIN categories c ON p.category_id = c.category_id
      INNER JOIN units u ON p.unit_id = u.unit_id
      LEFT JOIN stock s ON p.product_id = s.product_id
      LEFT JOIN LATERAL (
        SELECT * FROM eoq_calculations 
        WHERE product_id = p.product_id 
        ORDER BY calculation_date DESC 
        LIMIT 1
      ) ec ON true
      LEFT JOIN LATERAL (
        SELECT * FROM product_suppliers 
        WHERE product_id = p.product_id AND is_primary = true 
        LIMIT 1
      ) ps ON true
      LEFT JOIN suppliers sup ON ps.supplier_id = sup.supplier_id
      WHERE p.is_active = true
        AND ec.calculation_id IS NOT NULL
        AND COALESCE(s.current_quantity, 0) <= ec.reorder_point
      ORDER BY (ec.reorder_point - COALESCE(s.current_quantity, 0)) DESC
    `;

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error fetching EOQ recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch EOQ recommendations" },
      { status: 500 },
    );
  }
}
