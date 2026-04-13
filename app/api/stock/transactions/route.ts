// Stock transactions API
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
    const transactionType = searchParams.get("transaction_type");

    const where: any = {};
    if (productId) where.product_id = parseInt(productId);
    if (transactionType) where.transaction_type = transactionType;

    const transactions = await prisma.stock_transactions.findMany({
      where,
      include: {
        products: {
          select: {
            product_code: true,
            product_name: true,
            units: { select: { unit_abbreviation: true } },
          },
        },
        users: { select: { full_name: true } },
      },
      orderBy: { transaction_date: "desc" },
      take: 100,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching stock transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
