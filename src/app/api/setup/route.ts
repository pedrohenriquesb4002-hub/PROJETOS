import { NextResponse } from "next/server";
import { db } from "@/db/drizzle"; 
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const email = "pedrohenriquesb4002@gmail.com";
    const password = "40028922Pedro.";

    // Deleta o registro antigo para limpar o erro
    await db.delete(users).where(eq(users.email, email));

    // Gera o hash usando o bcryptjs que você subiu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere o usuário oficial novamente
    await db.insert(users).values({
      name: "Pedro Henrique",
      email: email,
      password: hashedPassword,
    });

    return NextResponse.json({ message: "Usuário criado com sucesso pelo sistema!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}