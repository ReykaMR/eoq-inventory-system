// EOQ calculations API
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

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");

    const where: any = {};
    if (productId) where.product_id = parseInt(productId);

    const calculations = await prisma.eoq_calculations.findMany({
      where,
      include: {
        products: {
          select: { product_code: true, product_name: true },
        },
        eoq_parameters: {
          select: {
            annual_demand: true,
            ordering_cost: true,
            holding_cost_per_unit: true,
            effective_date: true,
          },
        },
        users: { select: { full_name: true } },
      },
      orderBy: { calculation_date: "desc" },
    });

    return NextResponse.json(calculations);
  } catch (error) {
    console.error("Error fetching EOQ calculations:", error);
    return NextResponse.json(
      { error: "Failed to fetch EOQ calculations" },
      { status: 500 }
    );
  }
}
