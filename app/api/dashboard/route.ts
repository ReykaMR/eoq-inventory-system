import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to convert BigInt to Number
const convertBigInt = (obj: any): any => {
  if (typeof obj === "bigint") {
    return Number(obj);
  }
  // Handle Decimal objects from Prisma
  if (
    obj &&
    typeof obj === "object" &&
    obj.s !== undefined &&
    obj.e !== undefined &&
    obj.d !== undefined
  ) {
    return parseFloat(obj.toString());
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigInt);
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertBigInt(value)]),
    );
  }
  return obj;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get dashboard summary from database or calculate manually
    let summary;
    try {
      const summaryResult = await prisma.$queryRaw`
        SELECT * FROM v_dashboard_summary
      `;
      summary = Array.isArray(summaryResult) ? summaryResult[0] : summaryResult;
    } catch (error) {
      // If view doesn't exist, calculate manually
      console.log("Dashboard view not found, calculating manually...");
      const totalStockValue = await prisma.$queryRaw`
        SELECT COALESCE(SUM(s.current_quantity * p.purchase_price), 0) as total
        FROM stock s
        INNER JOIN products p ON s.product_id = p.product_id
      `;

      const productsNeedReorder = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM products p
        LEFT JOIN stock s ON p.product_id = s.product_id
        WHERE p.is_active = true
          AND COALESCE(s.current_quantity, 0) <= p.min_stock
      `;

      const pendingPOValue = await prisma.purchase_orders.aggregate({
        where: { status: { in: ["draft", "diajukan"] } },
        _sum: { total_amount: true },
      });

      const pendingApprovalCount = await prisma.purchase_orders.count({
        where: { status: "diajukan" },
      });

      summary = {
        total_stock_value: (totalStockValue as any)[0]?.total || 0,
        products_need_reorder: (productsNeedReorder as any)[0]?.count || 0,
        pending_po_value: pendingPOValue._sum.total_amount || 0,
        pending_approval_count: pendingApprovalCount,
      };
    }

    // Get products that need reorder
    let productsNeedReorder: any[] = [];
    try {
      productsNeedReorder = (await prisma.$queryRaw`
        SELECT * FROM v_latest_eoq
        WHERE purchase_recommendation = 'PERLU PESAN'
        ORDER BY reorder_point DESC
        LIMIT 10
      `) as any[];
    } catch (error) {
      // Fallback: get products with stock <= min_stock using join
      productsNeedReorder = (await prisma.$queryRaw`
        SELECT 
          p.product_id,
          p.product_code,
          p.product_name,
          c.category_name,
          u.unit_abbreviation,
          COALESCE(s.current_quantity, 0) as current_stock,
          p.min_stock as reorder_point,
          0 as eoq_quantity,
          sp.supplier_name,
          sp.lead_time_days
        FROM products p
        LEFT JOIN stock s ON p.product_id = s.product_id
        INNER JOIN categories c ON p.category_id = c.category_id
        INNER JOIN units u ON p.unit_id = u.unit_id
        LEFT JOIN LATERAL (
          SELECT ps.*, sup.supplier_name
          FROM product_suppliers ps
          INNER JOIN suppliers sup ON ps.supplier_id = sup.supplier_id
          WHERE ps.product_id = p.product_id AND ps.is_primary = true
          LIMIT 1
        ) sp ON true
        WHERE p.is_active = true
          AND COALESCE(s.current_quantity, 0) <= p.min_stock
        ORDER BY p.min_stock DESC
        LIMIT 10
      `) as any[];
    }

    // Get recent stock transactions
    const recentTransactions = await prisma.stock_transactions.findMany({
      take: 5,
      orderBy: { transaction_date: "desc" },
      include: {
        products: {
          select: {
            product_code: true,
            product_name: true,
          },
        },
        users: {
          select: {
            full_name: true,
          },
        },
      },
    });

    // Get recent purchase orders
    const recentPOs = await prisma.purchase_orders.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      include: {
        suppliers: {
          select: { supplier_name: true },
        },
        users_purchase_orders_created_byTousers: {
          select: { full_name: true },
        },
      },
    });

    // Convert BigInt values before sending response
    const responseData = convertBigInt({
      summary,
      productsNeedReorder,
      recentTransactions,
      recentPOs,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
