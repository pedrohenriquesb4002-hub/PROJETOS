import { db } from "@/db/drizzle";
// Ajustado para os nomes reais do seu schema
import { igrejas, products, stock } from "@/db/schema"; 
import { count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Total de Igrejas (usando a tabela 'igrejas')
    const churchCount = await db.select({ value: count() }).from(igrejas);
    
    // 2. Total de Produtos
    const productCount = await db.select({ value: count() }).from(products);
    
    // 3. Valor em Estoque
    // No seu schema, o preço está em 'products' e a quantidade está em 'stock'
    const stockValue = await db.select({
      total: sql<number>`sum(${products.price} * ${stock.quantity})`
    })
    .from(stock)
    .innerJoin(products, sql`${stock.productId} = ${products.id}`);

    return NextResponse.json({
      totalIgrejas: churchCount[0].value,
      totalProdutos: productCount[0].value,
      valorEstoque: stockValue[0].total || 0
    });
  } catch (error) {
    console.error("Erro na API de Stats:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}