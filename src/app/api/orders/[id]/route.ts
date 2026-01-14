import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { orders, products, igrejas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// GET /api/orders/[id] - Obter pedido específico (PROTEGIDA)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

    const { id } = await params;
    // Buscar pedido com informações do produto e igreja
    const [order] = await db
      .select({
        id: orders.id,
        productId: orders.productId,
        quantity: orders.quantity,
        igrejaId: orders.igrejaId,
        updatedAt: orders.updatedAt,
        createdAt: orders.createdAt,
        product: {
          id: products.id,
          name: products.name,
          code: products.code,
          price: products.price,
        },
        igreja: {
          id: igrejas.id,
          name: igrejas.name,
          cnpj: igrejas.cnpj,
          number: igrejas.number,
          street: igrejas.street,
          city: igrejas.city,
          state: igrejas.state,
          zipCode: igrejas.zipCode,
          neighborhood: igrejas.neighborhood,
        },
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(igrejas, eq(orders.igrejaId, igrejas.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Atualizar pedido (PROTEGIDA)
export async function PUT(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { productId, quantity, igrejaId } = body;

    // Validação básica
    if (!productId && !quantity && !igrejaId) {
      return NextResponse.json(
        { error: "Forneça pelo menos um campo para atualizar" },
        { status: 400 }
      );
    }

    // Validação de quantidade se fornecida
    if (quantity !== undefined && (typeof quantity !== "number" || quantity <= 0)) {
      return NextResponse.json(
        { error: "Quantidade deve ser um número maior que zero" },
        { status: 400 }
      );
    }

    // Verificar se o pedido existe
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Se productId foi fornecido, verificar se o produto existe
    if (productId) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) {
        return NextResponse.json(
          { error: "Produto não encontrado" },
          { status: 404 }
        );
      }
    }

    // Se igrejaId foi fornecido, verificar se a igreja existe
    if (igrejaId) {
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
    }

    // Atualizar pedido
    const [updatedOrder] = await db
      .update(orders)
      .set({
        ...(productId && { productId }),
        ...(quantity !== undefined && { quantity }),
        ...(igrejaId && { igrejaId }),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    // Buscar dados completos para o histórico
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, updatedOrder.productId))
      .limit(1);

    const [igreja] = await db
      .select()
      .from(igrejas)
      .where(eq(igrejas.id, updatedOrder.igrejaId))
      .limit(1);

    // Registrar atualização no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "UPDATE",
      entityType: "orders",
      entityId: id,
      oldData: existingOrder,
      newData: {
        ...updatedOrder,
        productName: product?.name,
        igrejaName: igreja?.name,
      },
      request,
    });

    return NextResponse.json(
      {
        message: "Pedido atualizado com sucesso",
        order: {
          ...updatedOrder,
          product,
          igreja,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Deletar pedido (PROTEGIDA)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

   const { id } = await params;
    // Verificar se o pedido existe
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Buscar informações do produto e igreja
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, existingOrder.productId))
      .limit(1);

    const [igreja] = await db
      .select()
      .from(igrejas)
      .where(eq(igrejas.id, existingOrder.igrejaId))
      .limit(1);

    // Deletar pedido
    await db.delete(orders).where(eq(orders.id, id));

    // Registrar deleção no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "DELETE",
      entityType: "orders",
      entityId: id,
      oldData: {
        ...existingOrder,
        productName: product?.name,
        igrejaName: igreja?.name,
      },
      request,
    });

    return NextResponse.json(
      {
        message: "Pedido deletado com sucesso",
        order: {
          ...existingOrder,
          product,
          igreja,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
