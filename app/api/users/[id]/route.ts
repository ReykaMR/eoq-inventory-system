import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcrypt";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(id) },
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
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
    const { username, password, full_name, email, role, is_active } = body;

    const updateData: any = {
      updated_at: new Date(),
    };

    if (username) updateData.username = username;
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Hash password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.users.update({
      where: { user_id: parseInt(id) },
      data: updateData,
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error updating user:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update user" },
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
    await prisma.users.delete({
      where: { user_id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
