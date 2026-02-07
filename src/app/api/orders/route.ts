import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { orders, products, igrejas } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

/**
 * @swagger
 * /api/orders:
 * post:
 * summary: Criar novo pedido
 * tags: [Orders]
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

    const body = await request.json();
    // Ajustado para os novos campos do schema
    const { customerName, total, items, igrejaId } = body;

    // Validação básica atualizada
    if (!customerName || !total || !items || !igrejaId) {
      return NextResponse.json(
        { error: "customerName, total, items e igrejaId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se a igreja existe
    const [igreja] = await db
      .select()
      .from(igrejas)
      .where(eq(igrejas.id, igrejaId))
      .limit(1);

    if (!igreja) {
      return NextResponse.json(
        { error: "Igreja não encontrada" },
        { status: 404 }
      );
    }

    // Criar pedido no novo formato
    const [newOrder] = await db
      .insert(orders)
      .values({
        customerName,
        total,
        items, // O array de produtos/quantidades entra como JSON aqui
        igrejaId,
      })
      .returning();

    // Registrar criação no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "CREATE",
      entityType: "orders",
      entityId: newOrder.id,
      newData: {
        ...newOrder,
        igrejaNome: igreja.nome,
      },
      request,
    });

    return NextResponse.json(
      {
        message: "Pedido criado com sucesso",
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/orders:
 * get:
 * summary: Listar todos os pedidos
 * tags: [Orders]
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

    // Buscar pedidos com join na igreja (Join no produto agora é feito via lógica de itens JSON)
    const allOrders = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        total: orders.total,
        items: orders.items,
        igrejaId: orders.igrejaId,
        createdAt: orders.createdAt,
        igreja: {
          id: igrejas.id,
          nome: igrejas.nome,
          cnpj: igrejas.cnpj,
          city: igrejas.city,
          state: igrejas.state,
        },
      })
      .from(orders)
      .leftJoin(igrejas, eq(orders.igrejaId, igrejas.id))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json(
      {
        orders: allOrders,
        count: allOrders.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}