import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// GET /api/products - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const igrejaId = searchParams.get("igrejaId");

    // Filtrar por igreja se o ID for fornecido
    const query = db.select().from(products).orderBy(desc(products.createdAt));
    
    const allProducts = igrejaId 
      ? await query.where(eq(products.igrejaId, igrejaId))
      : await query;

    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/products - Criar produto
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, price, igrejaId } = body; // igrejaId adicionado aqui

    // Validação: igrejaId agora é obrigatório
    if (!name || !code || !price || !igrejaId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, code, price e igrejaId" },
        { status: 400 }
      );
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        code,
        price,
        igrejaId, // Inserindo o vínculo obrigatório
      })
      .returning();

    // Registrar no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "CREATE",
      entityType: "products",
      entityId: newProduct.id,
      newData: newProduct,
      request,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}