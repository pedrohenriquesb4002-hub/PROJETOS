import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { orders, igrejas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// GET /api/orders/[id] - Obter pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const [order] = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        total: orders.total,
        items: orders.items, // Produtos e quantidades estão aqui
        igrejaId: orders.igrejaId,
        createdAt: orders.createdAt,
        igreja: {
          id: igrejas.id,
          nome: igrejas.nome,
          cnpj: igrejas.cnpj,
        },
      })
      .from(orders)
      .leftJoin(igrejas, eq(orders.igrejaId, igrejas.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT /api/orders/[id] - Atualizar pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { customerName, total, items } = body;

    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        ...(customerName && { customerName }),
        ...(total !== undefined && { total }),
        ...(items && { items }),
      })
      .where(eq(orders.id, id))
      .returning();

    await createAuditLog({
      userId: auth.user!.userId,
      action: "UPDATE",
      entityType: "orders",
      entityId: id,
      oldData: existingOrder,
      newData: updatedOrder,
      request,
    });

    return NextResponse.json({ message: "Pedido atualizado", order: updatedOrder });
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/orders/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    await db.delete(orders).where(eq(orders.id, id));

    await createAuditLog({
      userId: auth.user!.userId,
      action: "DELETE",
      entityType: "orders",
      entityId: id,
      oldData: existingOrder,
      request,
    });

    return NextResponse.json({ message: "Pedido deletado" });
  } catch (error) {
    console.error("Erro ao deletar:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}