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
    const product = await prisma.products.findUnique({
      where: { product_id: parseInt(id) },
      include: {
        categories: true,
        units: true,
        product_suppliers: {
          include: {
            suppliers: true,
          },
        },
        stock: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
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
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const product = await prisma.products.update({
      where: { product_id: parseInt(id) },
      data: {
        ...(body.product_code && { product_code: body.product_code }),
        ...(body.product_name && { product_name: body.product_name }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.category_id && { category_id: parseInt(body.category_id) }),
        ...(body.unit_id && { unit_id: parseInt(body.unit_id) }),
        ...(body.purchase_price !== undefined && {
          purchase_price: body.purchase_price,
        }),
        ...(body.selling_price !== undefined && {
          selling_price: body.selling_price,
        }),
        ...(body.min_stock !== undefined && { min_stock: body.min_stock }),
        ...(body.max_stock !== undefined && { max_stock: body.max_stock }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error updating product:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Product code already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update product" },
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
    await prisma.products.delete({
      where: { product_id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
