import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { stock, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// GET /api/stock/[id] - Obter estoque específico (PROTEGIDA)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    // Buscar estoque com informações do produto
    const [stockItem] = await db
      .select({
        id: stock.id,
        productId: stock.productId,
        quantity: stock.quantity,
        updatedAt: stock.updatedAt,
        createdAt: stock.createdAt,
        product: {
          id: products.id,
          name: products.name,
          code: products.code,
          price: products.price,
        },
      })
      .from(stock)
      .leftJoin(products, eq(stock.productId, products.id))
      .where(eq(stock.id, id))
      .limit(1);

    if (!stockItem) {
      return NextResponse.json(
        { error: "Registro de estoque não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ stock: stockItem }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar estoque:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/stock/[id] - Atualizar estoque (PROTEGIDA)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const body = await request.json();
    const { quantity } = body;

    // Validação básica
    if (quantity === undefined) {
      return NextResponse.json(
        { error: "Quantidade é obrigatória" },
        { status: 400 }
      );
    }

    // Validação de quantidade
    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json(
        { error: "Quantidade deve ser um número positivo ou zero" },
        { status: 400 }
      );
    }

    // Verificar se o estoque existe
    const [existingStock] = await db
      .select()
      .from(stock)
      .where(eq(stock.id, id))
      .limit(1);

    if (!existingStock) {
      return NextResponse.json(
        { error: "Registro de estoque não encontrado" },
        { status: 404 }
      );
    }

    // Buscar informações do produto
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, existingStock.productId))
      .limit(1);

    // Atualizar estoque
    const [updatedStock] = await db
      .update(stock)
      .set({
        quantity,
        updatedAt: new Date(),
      })
      .where(eq(stock.id, id))
      .returning();

    // Registrar atualização no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "UPDATE",
      entityType: "stock",
      entityId: id,
      oldData: { ...existingStock, productName: product?.name },
      newData: { ...updatedStock, productName: product?.name },
      request,
    });

    return NextResponse.json(
      {
        message: "Estoque atualizado com sucesso",
        stock: {
          ...updatedStock,
          product,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/stock/[id] - Deletar registro de estoque (PROTEGIDA)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    // Verificar se o estoque existe
    const [existingStock] = await db
      .select()
      .from(stock)
      .where(eq(stock.id, id))
      .limit(1);

    if (!existingStock) {
      return NextResponse.json(
        { error: "Registro de estoque não encontrado" },
        { status: 404 }
      );
    }

    // Buscar informações do produto
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, existingStock.productId))
      .limit(1);

    // Deletar estoque
    await db.delete(stock).where(eq(stock.id, id));

    // Registrar deleção no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "DELETE",
      entityType: "stock",
      entityId: id,
      oldData: { ...existingStock, productName: product?.name },
      request,
    });

    return NextResponse.json(
      {
        message: "Estoque deletado com sucesso",
        stock: {
          ...existingStock,
          product,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar estoque:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
