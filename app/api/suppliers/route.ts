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

    const suppliers = await prisma.suppliers.findMany({
      orderBy: { supplier_name: "asc" },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
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

    if (!supplier_code || !supplier_name) {
      return NextResponse.json(
        { error: "Supplier code and name are required" },
        { status: 400 },
      );
    }

    const supplier = await prisma.suppliers.create({
      data: {
        supplier_code,
        supplier_name,
        contact_person: contact_person || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        province: province || null,
        postal_code: postal_code || null,
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supplier:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Supplier code or name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 },
    );
  }
}
