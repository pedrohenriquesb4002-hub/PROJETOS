import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../../db/drizzle"; 
import { users } from "../../../../db/schema";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Gera o hash compatível com o seu sistema de login
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      id: crypto.randomUUID(),
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ message: "Cadastrado com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json({ error: "Erro ao cadastrar" }, { status: 500 });
  }
}

//atualização do banco de dados