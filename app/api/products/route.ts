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

    const products = await prisma.products.findMany({
      include: {
        categories: {
          select: { category_name: true },
        },
        units: {
          select: { unit_name: true, unit_abbreviation: true },
        },
        product_suppliers: {
          include: {
            suppliers: {
              select: { supplier_name: true },
            },
          },
        },
        stock: true,
      },
      orderBy: { product_name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      product_code,
      product_name,
      description,
      category_id,
      unit_id,
      purchase_price,
      selling_price,
      min_stock,
      max_stock,
      is_active,
    } = body;

    if (!product_code || !product_name || !category_id || !unit_id) {
      return NextResponse.json(
        { error: "Product code, name, category, and unit are required" },
        { status: 400 },
      );
    }

    const product = await prisma.products.create({
      data: {
        product_code,
        product_name,
        description,
        category_id: parseInt(category_id),
        unit_id: parseInt(unit_id),
        purchase_price: purchase_price || 0,
        selling_price: selling_price || 0,
        min_stock: min_stock || 0,
        max_stock: max_stock || 0,
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Product code already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
