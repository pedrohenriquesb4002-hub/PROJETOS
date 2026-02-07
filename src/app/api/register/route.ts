import { db } from "@/db/drizzle"; // Caminho corrigido conforme sua pasta src/db
import { churches, users } from "@/db/schema";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { churchName, adminName, email, password } = await req.json();

    // Cria o slug (ex: "Igreja Central" vira "igreja-central")
    const slug = churchName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Usamos tx: any para o TypeScript parar de reclamar
    const result = await db.transaction(async (tx: any) => {
      // 1. Cadastra a Igreja
      const [newChurch] = await tx.insert(churches).values({
        name: churchName,
        slug: slug,
      }).returning();

      // 2. Protege a senha
      const hashedPassword = await hash(password, 10);

      // 3. Cadastra o Usuário vinculado àquela Igreja
      const [newUser] = await tx.insert(users).values({
        name: adminName,
        email: email,
        password: hashedPassword,
        churchId: newChurch.id,
        role: "admin",
      }).returning();

      return { church: newChurch, user: newUser };
    });

    return NextResponse.json({ message: "Cadastro concluído!", result }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao cadastrar. Verifique os dados." }, { status: 500 });
  }
}