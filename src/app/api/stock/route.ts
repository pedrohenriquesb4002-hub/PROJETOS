import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { stock, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

/**
 * @swagger
 * /api/stock:
 *   post:
 *     summary: Criar registro de estoque
 *     description: Cria um novo registro de estoque para um produto (requer autenticação)
 *     tags: [Stock]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do produto
 *               quantity:
 *                 type: integer
 *                 description: Quantidade em estoque
 *     responses:
 *       201:
 *         description: Estoque criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stock:
 *                   $ref: '#/components/schemas/Stock'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Produto não encontrado
 *       409:
 *         description: Já existe registro de estoque para este produto
 */
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
    const { productId, quantity } = body;

    // Validação básica
    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { error: "productId e quantity são obrigatórios" },
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

    // Verificar se o produto existe
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

    // Verificar se já existe registro de estoque para este produto
    const [existingStock] = await db
      .select()
      .from(stock)
      .where(eq(stock.productId, productId))
      .limit(1);

    if (existingStock) {
      return NextResponse.json(
        { error: "Já existe registro de estoque para este produto. Use PUT para atualizar." },
        { status: 409 }
      );
    }

    // Criar registro de estoque
    const [newStock] = await db
      .insert(stock)
      .values({
        productId,
        quantity,
      })
      .returning();

    // Registrar criação no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "CREATE",
      entityType: "stock",
      entityId: newStock.id,
      newData: { ...newStock, productName: product.name },
      request,
    });

    return NextResponse.json(
      {
        message: "Estoque criado com sucesso",
        stock: {
          ...newStock,
          product,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar estoque:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/stock:
 *   get:
 *     summary: Listar todos os estoques
 *     description: Retorna lista de todos os registros de estoque com informações do produto (requer autenticação)
 *     tags: [Stock]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estoques
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stock:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stock'
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

    // Buscar todos os estoques com informações do produto
    const allStock = await db
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
      .leftJoin(products, eq(stock.productId, products.id));

    return NextResponse.json(
      {
        stock: allStock,
        count: allStock.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao listar estoque:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
