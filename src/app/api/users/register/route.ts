import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Capturando o ID da igreja do corpo da requisição
    const { name, email, password, igrejaId } = body;

    if (!name || !email || !password || !igrejaId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, email, password e igrejaId" }, 
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Corrigido de 'igrejald' para 'igrejaId' conforme o erro
    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      igrejaId: igrejaId, 
    }).returning();

    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}