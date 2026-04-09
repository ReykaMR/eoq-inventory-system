import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const po = await prisma.purchase_orders.findUnique({
      where: { po_id: parseInt(id) },
      include: {
        suppliers: true,
        users_purchase_orders_created_byTousers: {
          select: { full_name: true },
        },
        users_purchase_orders_approved_byTousers: {
          select: { full_name: true },
        },
        purchase_order_items: {
          include: {
            products: true,
          },
        },
      },
    });

    if (!po) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(po);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase order" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, action } = body;

    // Check role upfront for all actions
    const allowedRoles = [
      "admin",
      "staff_pembelian",
      "manager",
      "staff_gudang",
    ];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle status changes
    if (action === "submit") {
      // Change from draft to submitted
      if (
        session.user.role !== "staff_pembelian" &&
        session.user.role !== "admin"
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const po = await prisma.purchase_orders.update({
        where: { po_id: parseInt(id) },
        data: { status: "diajukan" },
      });

      return NextResponse.json(po);
    }

    if (action === "approve") {
      // Change from submitted to approved
      if (session.user.role !== "manager" && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const po = await prisma.purchase_orders.update({
        where: { po_id: parseInt(id) },
        data: {
          status: "disetujui",
          approved_by: parseInt(session.user.id),
          approved_at: new Date(),
        },
      });

      return NextResponse.json(po);
    }

    if (action === "receive") {
      // Mark as received
      if (
        session.user.role !== "staff_gudang" &&
        session.user.role !== "admin"
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { items } = body;
      if (!items || !Array.isArray(items)) {
        return NextResponse.json(
          { error: "Items with received quantities are required" },
          { status: 400 },
        );
      }

      // Update PO items received quantities
      for (const item of items) {
        await prisma.purchase_order_items.update({
          where: {
            po_id_product_id: {
              po_id: parseInt(id),
              product_id: parseInt(item.product_id),
            },
          },
          data: {
            quantity_received: item.quantity_received,
          },
        });
      }

      // Update PO status
      const po = await prisma.purchase_orders.update({
        where: { po_id: parseInt(id) },
        data: {
          status: "diterima",
          actual_delivery_date: new Date(),
        },
      });

      return NextResponse.json(po);
    }

    // Regular update - only admin and staff_pembelian can update PO details
    if (
      session.user.role !== "admin" &&
      session.user.role !== "staff_pembelian"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const po = await prisma.purchase_orders.update({
      where: { po_id: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(body.expected_delivery_date && {
          expected_delivery_date: new Date(body.expected_delivery_date),
        }),
        ...(body.notes !== undefined && { notes: body.notes }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(po);
  } catch (error: any) {
    console.error("Error updating purchase order:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update purchase order" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.purchase_orders.delete({
      where: { po_id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting purchase order:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Failed to delete purchase order" },
      { status: 500 },
    );
  }
}
