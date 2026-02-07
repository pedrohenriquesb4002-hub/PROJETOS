import { db } from "@/db/drizzle";
import { igrejas, users } from "@/db/schema";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { churchName, adminName, email, password, cpf, phone } = await req.json();

    if (!churchName || !adminName || !email || !password || !cpf || !phone) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    const slug = churchName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const result = await db.transaction(async (tx) => {
      const [novaIgreja] = await tx.insert(igrejas).values({
        nome: churchName,
        slug: slug,
      }).returning();

      const hashedPassword = await hash(password, 10);
      
      const [novoUsuario] = await tx.insert(users).values({
        name: adminName,
        email: email,
        password: hashedPassword,
        igrejaId: novaIgreja.id, // Nome corrigido conforme schema
        role: "admin",
        cpf: cpf,     // Agora o schema aceita
        phone: phone, // Agora o schema aceita
      }).returning();

      return { igreja: novaIgreja, usuario: novoUsuario };
    });

    return NextResponse.json({ message: "Sucesso!", result }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao registrar. Verifique CPF/Email." }, { status: 500 });
  }
}