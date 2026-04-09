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
    const category = await prisma.categories.findUnique({
      where: { category_id: parseInt(id) },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
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
    const { category_code, category_name, description, is_active } = body;

    const category = await prisma.categories.update({
      where: { category_id: parseInt(id) },
      data: {
        ...(category_code && { category_code }),
        ...(category_name && { category_name }),
        ...(description !== undefined && { description }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Error updating category:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Category code or name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update category" },
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
    await prisma.categories.delete({
      where: { category_id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
