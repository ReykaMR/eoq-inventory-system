import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch user notifications
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate sample notifications based on system data
    const notifications: any[] = [];

    // Check for low stock products
    const lowStock = await prisma.$queryRaw`
      SELECT p.product_name, p.product_code, s.current_quantity, p.min_stock
      FROM stock s
      INNER JOIN products p ON s.product_id = p.product_id
      WHERE s.current_quantity <= p.min_stock
      LIMIT 5
    `;

    for (const item of lowStock as any[]) {
      notifications.push({
        id: `stock-${item.product_code}`,
        title: "Stok Menipis",
        message: `Stok ${item.product_name} (${item.current_quantity}) sudah di bawah batas minimum (${item.min_stock})`,
        type: "warning" as const,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    // Check pending POs
    const pendingPOs = await prisma.purchase_orders.count({
      where: { status: { in: ["draft", "diajukan"] } },
    });

    if (pendingPOs > 0) {
      notifications.push({
        id: "po-pending",
        title: "Purchase Order Pending",
        message: `Ada ${pendingPOs} Purchase Order yang menunggu persetujuan`,
        type: "info" as const,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    // Check recent stock transactions (last 3)
    const recentTransactions = await prisma.stock_transactions.findMany({
      take: 3,
      orderBy: { transaction_date: "desc" },
      include: { products: true },
    });

    for (const tx of recentTransactions) {
      notifications.push({
        id: `tx-${tx.transaction_id}`,
        title: `Transaksi Stok: ${tx.transaction_type}`,
        message: `${tx.products.product_name} - ${tx.quantity} unit`,
        type: "success" as const,
        is_read: true,
        created_at: tx.transaction_date.toISOString(),
      });
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
