import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchaseOrders = await prisma.purchase_orders.findMany({
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
            products: {
              select: {
                product_code: true,
                product_name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "staff_pembelian")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { supplier_id, order_date, expected_delivery_date, items, notes } =
      body;

    if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Supplier and items are required" },
        { status: 400 },
      );
    }

    // Generate PO number
    const count = await prisma.purchase_orders.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Create PO
    const po = await prisma.purchase_orders.create({
      data: {
        supplier_id: parseInt(supplier_id),
        po_number: poNumber,
        order_date: order_date ? new Date(order_date) : new Date(),
        expected_delivery_date: expected_delivery_date
          ? new Date(expected_delivery_date)
          : null,
        notes,
        created_by: parseInt(session.user.id),
        status: "draft",
        total_amount: 0, // Will be updated by trigger
      },
    });

    // Create PO items and calculate subtotal
    let totalAmount = 0;
    for (const item of items) {
      const quantity = parseFloat(item.quantity_ordered);
      const unitPrice = parseFloat(item.unit_price);
      const subtotal = quantity * unitPrice;

      await prisma.purchase_order_items.create({
        data: {
          po_id: po.po_id,
          product_id: parseInt(item.product_id),
          quantity_ordered: quantity,
          unit_price: unitPrice,
          subtotal: subtotal,
          notes: item.notes,
        },
      });

      totalAmount += subtotal;
    }

    // Update PO total amount
    await prisma.purchase_orders.update({
      where: { po_id: po.po_id },
      data: { total_amount: totalAmount },
    });

    // Fetch complete PO
    const completePO = await prisma.purchase_orders.findUnique({
      where: { po_id: po.po_id },
      include: {
        purchase_order_items: {
          include: {
            products: true,
          },
        },
        suppliers: true,
      },
    });

    return NextResponse.json(completePO, { status: 201 });
  } catch (error: any) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 },
    );
  }
}
