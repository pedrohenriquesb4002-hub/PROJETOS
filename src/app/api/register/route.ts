import { db } from "@/db/drizzle";
import { igrejas, users } from "@/db/schema"; // Agora usando 'igrejas'
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { churchName, adminName, email, password } = await req.json();
    const slug = churchName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const result = await db.transaction(async (tx: any) => {
      // 1. Criar a Igreja
      const [novaIgreja] = await tx.insert(igrejas).values({
        nome: churchName,
        slug: slug,
      }).returning();

      // 2. Criar o Usuário vinculado àquela Igreja
      const hashedPassword = await hash(password, 10);
      const [novoUsuario] = await tx.insert(users).values({
        name: adminName,
        email: email,
        password: hashedPassword,
        igrejaId: novaIgreja.id,
        role: "admin",
      }).returning();

      return { igreja: novaIgreja, usuario: novoUsuario };
    });

    return NextResponse.json({ message: "Sucesso!", result }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao registrar." }, { status: 500 });
  }
}