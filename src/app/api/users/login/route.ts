import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs"; // Alterado de 'bcrypt' para 'bcryptjs' para garantir compatibilidade
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas" }, // Erro retornado quando o e-mail não existe
        { status: 401 }
      );
    }

    // O bcryptjs agora conseguirá comparar corretamente o hash gerado no registro
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" }, // Erro retornado quando a senha não bate
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || "seu-secret-super-seguro-aqui";
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      entityType: "users",
      entityId: user.id,
      request,
    });

    return NextResponse.json(
      {
        message: "Login realizado com sucesso",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}