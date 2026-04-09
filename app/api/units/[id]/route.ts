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
    const unit = await prisma.units.findUnique({
      where: { unit_id: parseInt(id) },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit" },
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
    const { unit_name, unit_abbreviation } = body;

    const unit = await prisma.units.update({
      where: { unit_id: parseInt(id) },
      data: {
        ...(unit_name && { unit_name }),
        ...(unit_abbreviation && { unit_abbreviation }),
      },
    });

    return NextResponse.json(unit);
  } catch (error: any) {
    console.error("Error updating unit:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Unit name or abbreviation already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update unit" },
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
    await prisma.units.delete({
      where: { unit_id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting unit:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete unit" },
      { status: 500 },
    );
  }
}
