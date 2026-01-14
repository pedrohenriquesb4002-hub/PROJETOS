import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { orders, products, igrejas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Criar novo pedido
 *     description: Cria um novo pedido no sistema (requer autenticação)
 *     tags: [Orders]
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
 *               - igrejaId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do produto
 *               quantity:
 *                 type: integer
 *                 description: Quantidade do pedido
 *               igrejaId:
 *                 type: string
 *                 format: uuid
 *                 description: ID da igreja
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Produto ou igreja não encontrados
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
    const { productId, quantity, igrejaId } = body;

    // Validação básica
    if (!productId || !quantity || !igrejaId) {
      return NextResponse.json(
        { error: "productId, quantity e igrejaId são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de quantidade
    if (typeof quantity !== "number" || quantity <= 0) {
      return NextResponse.json(
        { error: "Quantidade deve ser um número maior que zero" },
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

    // Criar pedido
    const [newOrder] = await db
      .insert(orders)
      .values({
        productId,
        quantity,
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
        productName: product.name,
        igrejaName: igreja.name,
      },
      request,
    });

    return NextResponse.json(
      {
        message: "Pedido criado com sucesso",
        order: {
          ...newOrder,
          product,
          igreja,
        },
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
 *   get:
 *     summary: Listar todos os pedidos
 *     description: Retorna lista de todos os pedidos com informações de produto e igreja (requer autenticação)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
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

    // Buscar todos os pedidos com informações do produto e igreja
    const allOrders = await db
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
          city: igrejas.city,
          state: igrejas.state,
        },
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(igrejas, eq(orders.igrejaId, igrejas.id));

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
//force update orders api
