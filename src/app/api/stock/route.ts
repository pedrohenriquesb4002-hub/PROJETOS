import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { stock, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    // Ajuste o nome da variável conforme o que o seu frontend envia
    const { productId, quantity, igrejaId } = body; 

    if (!productId || quantity === undefined || !igrejaId) {
      return NextResponse.json({ error: "Campos obrigatórios: productId, quantity e igrejaId" }, { status: 400 });
    }

    // O erro na imagem indica que 'igrejald' não existe no banco.
    // Verifique no seu schema.ts se o nome correto é 'igrejaId'.
    const [newStock] = await db.insert(stock).values({
      productId,
      quantity,
      igrejaId: igrejaId, // Mudei de igrejald para igrejaId
    }).returning();

    await createAuditLog({
      userId: auth.user!.userId,
      action: "CREATE",
      entityType: "stock",
      entityId: newStock.id,
      newData: newStock,
      request
    });

    return NextResponse.json(newStock, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar estoque" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const items = await db
      .select({
        id: stock.id,
        productId: stock.productId,
        quantity: stock.quantity,
        igrejaId: stock.igrejaId, // Ajustado aqui também
        createdAt: stock.createdAt,
        product: {
          name: products.name,
          price: products.price
        }
      })
      .from(stock)
      .leftJoin(products, eq(stock.productId, products.id));

    return NextResponse.json({ stock: items });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao listar estoque" }, { status: 500 });
  }
}