import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { stock, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    
    const { id } = await params;
    const { quantity } = await request.json();

    const [existing] = await db.select().from(stock).where(eq(stock.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const [updated] = await db.update(stock).set({ quantity }).where(eq(stock.id, id)).returning();

    await createAuditLog({
      userId: auth.user!.userId,
      action: "UPDATE",
      entityType: "stock",
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const [existing] = await db.select().from(stock).where(eq(stock.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    await db.delete(stock).where(eq(stock.id, id));

    await createAuditLog({
      userId: auth.user!.userId,
      action: "DELETE",
      entityType: "stock",
      entityId: id,
      oldData: existing,
    });

    return NextResponse.json({ message: "Sucesso" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}