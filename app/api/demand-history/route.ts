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

    const demandHistory = await prisma.demand_history.findMany({
      include: {
        products: {
          select: {
            product_code: true,
            product_name: true,
          },
        },
        users: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: [{ period_year: "desc" }, { period_month: "desc" }],
    });

    return NextResponse.json(demandHistory);
  } catch (error) {
    console.error("Error fetching demand history:", error);
    return NextResponse.json(
      { error: "Failed to fetch demand history" },
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
        session.user.role !== "staff_pembelian" &&
        session.user.role !== "manager")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { product_id, period_year, period_month, demand_quantity, notes } =
      body;

    if (
      !product_id ||
      period_year === undefined ||
      period_month === undefined ||
      demand_quantity === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Product, period year, period month, and demand quantity are required",
        },
        { status: 400 },
      );
    }

    const demand = await prisma.demand_history.upsert({
      where: {
        product_id_period_year_period_month: {
          product_id: parseInt(product_id),
          period_year: parseInt(period_year),
          period_month: parseInt(period_month),
        },
      },
      create: {
        product_id: parseInt(product_id),
        period_year: parseInt(period_year),
        period_month: parseInt(period_month),
        demand_quantity: demand_quantity,
        notes,
        recorded_by: parseInt(session.user.id),
      },
      update: {
        demand_quantity: demand_quantity,
        notes,
        recorded_by: parseInt(session.user.id),
      },
    });

    return NextResponse.json(demand, { status: 201 });
  } catch (error: any) {
    console.error("Error creating demand history:", error);
    return NextResponse.json(
      { error: "Failed to create demand history" },
      { status: 500 },
    );
  }
}
