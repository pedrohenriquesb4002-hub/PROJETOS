import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, password, igrejaId, cpf, phone } = await req.json();

    // Validação de campos obrigatórios
    if (!name || !email || !password || !igrejaId || !cpf || !phone) {
      return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      igrejaId, // Certifique-se que o nome no schema.ts é igrejaId
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