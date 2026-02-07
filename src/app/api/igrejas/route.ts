import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { igrejas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

/**
 * @swagger
 * /api/igrejas:
 * post:
 * summary: Criar nova igreja
 * tags: [Igrejas]
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
    const { name, cnpj, number, street, city, state, zipCode, neighborhood } = body;

    // Validação básica
    if (!name || !cnpj) {
      return NextResponse.json(
        { error: "Nome e CNPJ são obrigatórios" },
        { status: 400 }
      );
    }

    // Sanitizar CNPJ
    const cnpjDigits = (cnpj || "").toString().replace(/\D/g, "");
    const formattedCnpj = `${cnpjDigits.slice(0, 2)}.${cnpjDigits.slice(2, 5)}.${cnpjDigits.slice(5, 8)}/${cnpjDigits.slice(8, 12)}-${cnpjDigits.slice(12, 14)}`;

    // Criar Slug único (obrigatório no novo schema)
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Verificar se o CNPJ já existe
    const existingIgreja = await db
      .select()
      .from(igrejas)
      .where(eq(igrejas.cnpj, formattedCnpj))
      .limit(1);

    if (existingIgreja.length > 0) {
      return NextResponse.json(
        { error: "CNPJ já cadastrado" },
        { status: 409 }
      );
    }

    // Criar igreja (Ajustado para os nomes em PT-BR do schema.ts)
    const [newIgreja] = await db
      .insert(igrejas)
      .values({
        nome: name,         // 'nome' conforme o seu schema.ts atualizado
        slug: slug,         // obrigatório no novo schema
        cnpj: formattedCnpj,
        number: number?.toString(),
        street,
        city,
        state,
        zipCode,
        neighborhood,
      })
      .returning();

    // Registrar criação no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "CREATE",
      entityType: "igrejas",
      entityId: newIgreja.id,
      newData: newIgreja,
      request,
    });

    return NextResponse.json(
      {
        message: "Igreja criada com sucesso",
        igreja: newIgreja,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar igreja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/igrejas:
 * get:
 * summary: Listar todas as igrejas
 * tags: [Igrejas]
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    // Buscar todas as igrejas
    const allIgrejas = await db.select().from(igrejas);

    return NextResponse.json(
      {
        igrejas: allIgrejas,
        count: allIgrejas.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao listar igrejas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}