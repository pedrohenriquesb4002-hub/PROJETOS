import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, code, price } = body;

    // Validação básica
    if (!name || !code || price === undefined) {
      return NextResponse.json(
        { error: "Nome, código e preço são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de preço
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json(
        { error: "Preço deve ser um número positivo" },
        { status: 400 }
      );
    }

    // Verificar se o código já existe
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.code, code))
      .limit(1);

    if (existingProduct.length > 0) {
      return NextResponse.json(
        { error: "Código de produto já cadastrado" },
        { status: 409 }
      );
    }

    // Criar produto
    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        code,
        price,
      })
      .returning();

    // Registrar criação no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "CREATE",
      entityType: "products",
      entityId: newProduct.id,
      newData: newProduct,
      request,
    });

    return NextResponse.json(
      {
        message: "Produto criado com sucesso",
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar todos os produtos
 *     description: Retorna lista de todos os produtos (requer autenticação)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

    // Buscar todos os produtos
    const allProducts = await db.select().from(products);

    return NextResponse.json(
      {
        products: allProducts,
        count: allProducts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
