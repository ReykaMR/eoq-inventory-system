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

    const stock = await prisma.stock.findMany({
      include: {
        products: {
          include: {
            categories: { select: { category_name: true } },
            units: { select: { unit_name: true, unit_abbreviation: true } },
          },
        },
      },
      orderBy: {
        products: { product_name: "asc" },
      },
    });

    return NextResponse.json(stock);
  } catch (error) {
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "admin" &&
        session.user.role !== "staff_gudang" &&
        session.user.role !== "manager")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      product_id,
      transaction_type,
      quantity,
      notes,
      reference_type,
      reference_id,
    } = body;

    if (!product_id || !transaction_type || quantity === undefined) {
      return NextResponse.json(
        { error: "Product, transaction type, and quantity are required" },
        { status: 400 },
      );
    }

    // Validate quantity is positive
    const qty = parseFloat(quantity);
    if (qty <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 },
      );
    }

    // Get current stock
    const currentStock = await prisma.stock.findUnique({
      where: { product_id: parseInt(product_id) },
    });

    const quantityBefore = Number(currentStock?.current_quantity || 0);
    let quantityAfter = quantityBefore;

    if (transaction_type === "IN" || transaction_type === "RECEIVE") {
      quantityAfter = quantityBefore + qty;
    } else if (transaction_type === "OUT") {
      quantityAfter = quantityBefore - qty;
      if (quantityAfter < 0) {
        return NextResponse.json(
          { error: "Insufficient stock" },
          { status: 400 },
        );
      }
    } else if (transaction_type === "ADJUSTMENT") {
      quantityAfter = qty;
    } else {
      return NextResponse.json(
        {
          error:
            "Invalid transaction type. Must be IN, OUT, RECEIVE, or ADJUSTMENT",
        },
        { status: 400 },
      );
    }

    // Create stock transaction
    const transaction = await prisma.stock_transactions.create({
      data: {
        product_id: parseInt(product_id),
        transaction_type,
        quantity: qty,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        reference_type,
        reference_id: reference_id ? parseInt(reference_id) : null,
        notes,
        created_by: parseInt(session.user.id),
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error("Error creating stock transaction:", error);
    return NextResponse.json(
      { error: "Failed to create stock transaction" },
      { status: 500 },
    );
  }
}
