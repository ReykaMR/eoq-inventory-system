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
    const supplier = await prisma.suppliers.findUnique({
      where: { supplier_id: parseInt(id) },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
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
    const {
      supplier_code,
      supplier_name,
      contact_person,
      phone,
      email,
      address,
      city,
      province,
      postal_code,
      is_active,
    } = body;

    const supplier = await prisma.suppliers.update({
      where: { supplier_id: parseInt(id) },
      data: {
        ...(supplier_code && { supplier_code }),
        ...(supplier_name && { supplier_name }),
        ...(contact_person !== undefined && { contact_person }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(province !== undefined && { province }),
        ...(postal_code !== undefined && { postal_code }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("Error updating supplier:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 },
      );
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Supplier code or name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update supplier" },
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
    await prisma.suppliers.delete({
      where: { supplier_id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting supplier:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 },
    );
  }
}
