import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// PUT - Editar Produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, code, price, igrejaId } = body;

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...(name && { name }),
        ...(code && { code }),
        ...(price && { price }),
        ...(igrejaId && { igrejaId }), // Garante que o vínculo permaneça correto
      })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE - Excluir Produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ message: "Produto excluído com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}