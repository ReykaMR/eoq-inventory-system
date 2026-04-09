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

    const units = await prisma.units.findMany({
      orderBy: { unit_name: "asc" },
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
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
    const { unit_name, unit_abbreviation } = body;

    if (!unit_name || !unit_abbreviation) {
      return NextResponse.json(
        { error: "Unit name and abbreviation are required" },
        { status: 400 },
      );
    }

    const unit = await prisma.units.create({
      data: {
        unit_name,
        unit_abbreviation,
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error: any) {
    console.error("Error creating unit:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Unit name or abbreviation already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 },
    );
  }
}
