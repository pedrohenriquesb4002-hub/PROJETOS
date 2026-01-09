import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { igrejas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

/**
 * @swagger
 * /api/igrejas:
 *   post:
 *     summary: Criar nova igreja
 *     description: Cria uma nova igreja no sistema (requer autenticação)
 *     tags: [Igrejas]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cnpj
 *               - number
 *               - street
 *               - city
 *               - state
 *               - zipCode
 *               - neighborhood
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome da igreja
 *               cnpj:
 *                 type: string
 *                 description: CNPJ da igreja (14 dígitos)
 *               number:
 *                 type: integer
 *                 description: Número do endereço
 *               street:
 *                 type: string
 *                 description: Rua
 *               city:
 *                 type: string
 *                 description: Cidade
 *               state:
 *                 type: string
 *                 description: Estado
 *               zipCode:
 *                 type: string
 *                 description: CEP
 *               neighborhood:
 *                 type: string
 *                 description: Bairro
 *     responses:
 *       201:
 *         description: Igreja criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 igreja:
 *                   $ref: '#/components/schemas/Igreja'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       409:
 *         description: CNPJ já cadastrado
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
    if (!name || !cnpj || !number || !street || !city || !state || !zipCode || !neighborhood) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Sanitizar CNPJ: aceitar apenas dígitos
    const cnpjDigits = (cnpj || "").toString().replace(/\D/g, "");
    if (cnpjDigits.length !== 14) {
      return NextResponse.json(
        { error: "CNPJ deve conter 14 dígitos" },
        { status: 400 }
      );
    }

    // Formatar CNPJ para 00.000.000/0000-00
    const formattedCnpj = `${cnpjDigits.slice(0, 2)}.${cnpjDigits.slice(2, 5)}.${cnpjDigits.slice(5, 8)}/${cnpjDigits.slice(8, 12)}-${cnpjDigits.slice(12, 14)}`;

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

    // Criar igreja
    const [newIgreja] = await db
      .insert(igrejas)
      .values({
        name,
        cnpj: formattedCnpj,
        number,
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
 *   get:
 *     summary: Listar todas as igrejas
 *     description: Retorna lista de todas as igrejas (requer autenticação)
 *     tags: [Igrejas]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de igrejas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 igrejas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Igreja'
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
