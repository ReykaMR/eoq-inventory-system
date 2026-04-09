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

    const categories = await prisma.categories.findMany({
      orderBy: { category_name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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
    const { category_code, category_name, description, is_active } = body;

    if (!category_code || !category_name) {
      return NextResponse.json(
        { error: "Category code and name are required" },
        { status: 400 },
      );
    }

    const category = await prisma.categories.create({
      data: {
        category_code,
        category_name,
        description,
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Category code or name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
