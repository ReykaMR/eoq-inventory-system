import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(session.user.id) },
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        last_login: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, email } = body;

    if (!full_name || !email) {
      return NextResponse.json(
        { error: "Full name and email are required" },
        { status: 400 },
      );
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.users.findFirst({
      where: {
        email,
        user_id: { not: parseInt(session.user.id) },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }

    const user = await prisma.users.update({
      where: { user_id: parseInt(session.user.id) },
      data: {
        full_name,
        email,
        updated_at: new Date(),
      },
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        last_login: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
