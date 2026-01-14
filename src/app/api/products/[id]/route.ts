import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// GET /api/products/[id] - Obter produto específico (PROTEGIDA)
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
    // Buscar produto
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Atualizar produto (PROTEGIDA)
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
    const { name, code, price } = body;

    // Validação básica
    if (!name && !code && price === undefined) {
      return NextResponse.json(
        { error: "Forneça pelo menos um campo para atualizar (name, code ou price)" },
        { status: 400 }
      );
    }

    // Validação de preço se fornecido
    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      return NextResponse.json(
        { error: "Preço deve ser um número positivo" },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o novo código já existe em outro produto
    if (code && code !== existingProduct.code) {
      const [duplicateCode] = await db
        .select()
        .from(products)
        .where(eq(products.code, code))
        .limit(1);

      if (duplicateCode) {
        return NextResponse.json(
          { error: "Código de produto já está em uso" },
          { status: 409 }
        );
      }
    }

    // Atualizar produto
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...(name && { name }),
        ...(code && { code }),
        ...(price !== undefined && { price }),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Registrar atualização no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "UPDATE",
      entityType: "products",
      entityId: id,
      oldData: existingProduct,
      newData: updatedProduct,
      request,
    });

    return NextResponse.json(
      {
        message: "Produto atualizado com sucesso",
        product: updatedProduct,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Deletar produto (PROTEGIDA)
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

    // Verificar se o produto existe
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
// Registrar deleção no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "DELETE",
      entityType: "products",
      entityId: id,
      oldData: existingProduct,
      request,
    });

    
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Deletar produto
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json(
      {
        message: "Produto deletado com sucesso",
        product: existingProduct,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
