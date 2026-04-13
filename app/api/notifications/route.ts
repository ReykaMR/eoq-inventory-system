// Notifications API - GET all notifications for current user
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch user notifications from database
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Auto-generate system notifications if they don't exist for today
    await generateSystemNotifications(userId);

    // Fetch notifications from database
    const notifications = await prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST - Create a new notification
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, type, link } = body;

    const notification = await prisma.notifications.create({
      data: {
        user_id: parseInt(session.user.id),
        title,
        message,
        type: type || "info",
        link: link || null,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

async function generateSystemNotifications(userId: number) {
  try {
    // Only generate if user has NEVER had any notifications
    // This ensures deleted notifications won't be re-created
    const totalCount = await prisma.notifications.count({
      where: { user_id: userId },
    });

    if (totalCount > 0) return; // User has existing notifications, don't re-generate

    // Check for low stock products
    const lowStock = await prisma.$queryRaw`
      SELECT p.product_name, p.product_code, s.current_quantity, p.min_stock
      FROM stock s
      INNER JOIN products p ON s.product_id = p.product_id
      WHERE s.current_quantity <= p.min_stock
      LIMIT 5
    `;

    for (const item of lowStock as any[]) {
      await prisma.notifications.create({
        data: {
          user_id: userId,
          title: "Stok Menipis",
          message: `Stok ${item.product_name} (${item.current_quantity}) sudah di bawah batas minimum (${item.min_stock})`,
          type: "warning",
          link: "/stock",
        },
      });
    }

    // Check pending POs
    const pendingPOs = await prisma.purchase_orders.count({
      where: { status: { in: ["draft", "diajukan"] } },
    });

    if (pendingPOs > 0) {
      await prisma.notifications.create({
        data: {
          user_id: userId,
          title: "Purchase Order Pending",
          message: `Ada ${pendingPOs} Purchase Order yang menunggu persetujuan`,
          type: "info",
          link: "/purchase-orders",
        },
      });
    }
  } catch (error) {
    console.error("Error generating system notifications:", error);
  }
}
