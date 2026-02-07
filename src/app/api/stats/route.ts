import { db } from "@/db/drizzle";
import { igrejas, products, stock, orders } from "@/db/schema"; 
import { count, sql, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const igrejaId = searchParams.get("igrejaId");

    // 1. Total de Igrejas
    const churchCount = await db.select({ value: count() }).from(igrejas);
    
    // 2. Total de Produtos (Filtrado por igreja se houver)
    let productQuery = db.select({ value: count() }).from(products);
    if (igrejaId) productQuery.where(eq(products.igrejaId, igrejaId));
    const productCount = await productQuery;
    
    // 3. Valor Total em Estoque (Soma de Preço x Quantidade)
    // Fazemos o Join entre Stock e Products
    const stockValue = await db.select({
      total: sql<number>`sum(${products.price} * ${stock.quantity})`
    })
    .from(stock)
    .innerJoin(products, eq(stock.productId, products.id))
    .where(igrejaId ? eq(stock.igrejaId, igrejaId) : undefined);

    // 4. Ticket Médio (Exemplo baseado no campo total de orders)
    const averageOrder = await db.select({
      avg: sql<number>`avg(${orders.total})`
    })
    .from(orders)
    .where(igrejaId ? eq(orders.igrejaId, igrejaId) : undefined);

    return NextResponse.json({
      totalIgrejas: churchCount[0].value,
      totalProdutos: productCount[0].value,
      valorEstoque: Number(stockValue[0].total) || 0,
      ticketMedio: Number(averageOrder[0].avg) || 0
    });
  } catch (error) {
    console.error("Erro na API de Stats:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}