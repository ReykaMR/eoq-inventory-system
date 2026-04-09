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

    const params = await prisma.eoq_parameters.findMany({
      include: {
        products: {
          select: {
            product_id: true,
            product_code: true,
            product_name: true,
          },
        },
        users: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
      },
      orderBy: { effective_date: "desc" },
    });

    return NextResponse.json(params);
  } catch (error) {
    console.error("Error fetching EOQ parameters:", error);
    return NextResponse.json(
      { error: "Failed to fetch EOQ parameters" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "manager")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      product_id,
      annual_demand,
      ordering_cost,
      holding_cost_per_unit,
      working_days_per_year,
      effective_date,
      notes,
    } = body;

    if (
      !product_id ||
      annual_demand === undefined ||
      ordering_cost === undefined ||
      holding_cost_per_unit === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Product, annual demand, ordering cost, and holding cost are required",
        },
        { status: 400 },
      );
    }

    // Deactivate previous parameters for this product
    await prisma.eoq_parameters.updateMany({
      where: { product_id: parseInt(product_id), is_active: true },
      data: { is_active: false },
    });

    const param = await prisma.eoq_parameters.create({
      data: {
        product_id: parseInt(product_id),
        annual_demand,
        ordering_cost,
        holding_cost_per_unit,
        working_days_per_year: working_days_per_year || 300,
        effective_date: effective_date ? new Date(effective_date) : new Date(),
        notes,
        created_by: parseInt(session.user.id),
      },
    });

    // Auto calculate EOQ
    await calculateEOQ(param.parameter_id);

    return NextResponse.json(param, { status: 201 });
  } catch (error: any) {
    console.error("Error creating EOQ parameter:", error);
    return NextResponse.json(
      { error: "Failed to create EOQ parameter" },
      { status: 500 },
    );
  }
}

// Helper function to call the stored procedure
async function calculateEOQ(parameterId: number) {
  // Get the parameter
  const param = await prisma.eoq_parameters.findUnique({
    where: { parameter_id: parameterId },
    include: {
      products: {
        include: {
          product_suppliers: {
            where: { is_primary: true },
          },
        },
      },
    },
  });

  if (!param) {
    throw new Error("EOQ parameter not found");
  }

  // Call the stored procedure
  const result = await prisma.$queryRaw`
    SELECT * FROM sp_calculate_eoq(${param.product_id}, ${param.parameter_id})
  `;

  const eoqResult = Array.isArray(result) ? result[0] : result;

  if (!eoqResult) {
    throw new Error("EOQ calculation returned no results");
  }

  // Save EOQ calculation
  await prisma.eoq_calculations.create({
    data: {
      parameter_id: parameterId,
      product_id: param.product_id,
      eoq_quantity: eoqResult.eoq_quantity,
      reorder_point: eoqResult.reorder_point,
      safety_stock: eoqResult.safety_stock,
      total_inventory_cost: eoqResult.total_inventory_cost,
      orders_per_year: eoqResult.orders_per_year,
      order_interval_days: eoqResult.order_interval_days,
      total_ordering_cost: eoqResult.total_ordering_cost,
      total_holding_cost: eoqResult.total_holding_cost,
      lead_time_days: param.products.product_suppliers[0]?.lead_time_days || 0,
      calculated_by: param.created_by,
    },
  });

  return eoqResult;
}

// API endpoint to manually trigger EOQ calculation
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "manager")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { product_id, parameter_id } = await request.json();

    if (!product_id && !parameter_id) {
      return NextResponse.json(
        { error: "Product ID or Parameter ID is required" },
        { status: 400 },
      );
    }

    let paramId = parameter_id;

    if (!paramId) {
      // Get latest active parameter
      const param = await prisma.eoq_parameters.findFirst({
        where: {
          product_id: parseInt(product_id),
          is_active: true,
        },
        orderBy: { effective_date: "desc" },
      });

      if (!param) {
        return NextResponse.json(
          { error: "No active EOQ parameters found for this product" },
          { status: 404 },
        );
      }

      paramId = param.parameter_id;
    }

    await calculateEOQ(paramId);

    return NextResponse.json({
      success: true,
      message: "EOQ calculation completed",
    });
  } catch (error: any) {
    console.error("Error triggering EOQ calculation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate EOQ" },
      { status: 500 },
    );
  }
}
