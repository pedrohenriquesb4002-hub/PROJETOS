import { db } from "@/db/drizzle";
import { igrejas, users } from "@/db/schema";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Criar a Igreja Sede
    const [novaIgreja] = await db.insert(igrejas).values({
      nome: "SETOR OESTE CENTRAL",
      slug: "sede-principal",
    }).returning();

    // 2. Criar seu usuário Admin
    const hashedPassword = await hash("40028922Pedro.", 10); // ESCOLHA SUA SENHA AQUI
    
    await db.insert(users).values({
      name: "Pedro Henrique",
      email: "pedrohenriquesb4002@gmail.com", // ESCOLHA SEU EMAIL AQUI
      password: hashedPassword,
      igrejaId: novaIgreja.id,
      role: "admin",
      cpf: "09761633144", // CPF que agora é obrigatório
      phone: "61999527477",  // Telefone que agora é obrigatório
    });

    return NextResponse.json({ message: "Admin criado com sucesso!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar setup" }, { status: 500 });
  }
}