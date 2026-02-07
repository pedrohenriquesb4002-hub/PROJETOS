import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Você precisa receber cpf e phone do corpo da requisição
    const { name, email, password, igrejaId, cpf, phone } = body; 

    if (!name || !email || !password || !igrejaId || !cpf || !phone) {
      return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      igrejaId,
      cpf,   // ADICIONADO PARA RESOLVER O ERRO
      phone, // ADICIONADO PARA RESOLVER O ERRO
    }).returning();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}