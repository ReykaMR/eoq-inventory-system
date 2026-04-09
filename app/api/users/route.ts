import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcrypt";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.users.findMany({
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        last_login: true,
        created_at: true,
      },
      orderBy: { full_name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
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
    const { username, password, full_name, email, role, is_active } = body;

    if (!username || !password || !full_name || !email || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        username,
        password_hash: hashedPassword,
        full_name,
        email,
        role,
        is_active: is_active !== undefined ? is_active : true,
      },
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
