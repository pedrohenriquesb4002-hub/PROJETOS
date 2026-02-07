import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const { name, email, password, igrejaId } = body; // Removidos cpf e phone se não existem no schema

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      igrejaId,
    }).returning();

    await createAuditLog({
      userId: auth.user!.userId,
      action: "CREATE",
      entityType: "users",
      entityId: newUser.id,
      newData: newUser,
      request
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // Selecionando apenas campos que existem (sem updatedAt, cpf ou phone)
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      igrejaId: users.igrejaId,
    }).from(users);

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}