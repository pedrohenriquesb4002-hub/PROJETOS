import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { hash } from "bcryptjs"; // Importado como 'hash'
import { NextRequest, NextResponse } from "next/server"; // Importado NextRequest aqui

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, igrejaId, cpf, phone } = body;

    if (!name || !email || !password || !igrejaId || !cpf || !phone) {
      return NextResponse.json(
        { error: "Todos os campos (incluindo CPF e Telefone) são obrigatórios" }, 
        { status: 400 }
      );
    }

    // Usando a função 'hash' que foi importada corretamente
    const hashedPassword = await hash(password, 10);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      igrejaId,
      cpf,
      phone,
      role: "admin",
    }).returning();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao registrar usuário" }, { status: 500 });
  }
}