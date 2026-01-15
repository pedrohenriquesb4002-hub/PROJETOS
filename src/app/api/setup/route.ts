import { NextResponse } from "next/server";
import { db } from "@/db/drizzle"; // Caminho baseado na sua estrutura
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const email = "pedrohenriquesb4002@gmail.com";
    const password = "40028922Pedro.";

    // 1. Remove o usuário antigo para evitar duplicidade
    await db.delete(users).where(eq(users.email, email));

    // 2. Gera o hash usando o motor do próprio site (bcryptjs)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insere o usuário oficial
    await db.insert(users).values({
      name: "Pedro Henrique",
      email: email,
      password: hashedPassword,
    });

    return NextResponse.json({ 
      message: "Usuário mestre criado com sucesso pelo sistema!",
      email: email
    });
  } catch (error: any) {
    console.error("Erro no setup:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}