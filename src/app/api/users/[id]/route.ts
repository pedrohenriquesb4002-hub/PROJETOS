import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const { name, email, password, igrejald } = await request.json();

    // 1. Verificar se o usuário existe
    const [existingUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existingUser) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // 2. Montar objeto de atualização apenas com campos que existem no banco
    // Removidos 'cpf', 'phone' e 'updatedAt' conforme os erros na imagem
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password; // Lembre-se de usar bcrypt se for mudar a senha
    if (igrejald) updateData.igrejald = igrejald;

    // 3. Executar atualização
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    // 4. Registrar auditoria (agora aceitando o campo 'request')
    await createAuditLog({
      userId: auth.user!.userId,
      action: "UPDATE",
      entityType: "users",
      entityId: id,
      oldData: existingUser,
      newData: updatedUser,
      request
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const [existingUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!existingUser) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    await db.delete(users).where(eq(users.id, id));

    await createAuditLog({
      userId: auth.user!.userId,
      action: "DELETE",
      entityType: "users",
      entityId: id,
      oldData: existingUser,
      request
    });

    return NextResponse.json({ message: "Usuário removido" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao remover usuário" }, { status: 500 });
  }
}