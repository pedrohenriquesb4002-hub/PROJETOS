import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { igrejas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// GET /api/igrejas/[id] - Obter igreja específica (PROTEGIDA)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    // Buscar igreja
    const [igreja] = await db
      .select()
      .from(igrejas)
      .where(eq(igrejas.id, id))
      .limit(1);

    if (!igreja) {
      return NextResponse.json(
        { error: "Igreja não encontrada" },
        { status: 404 }
      );
    }

    // Registrar visualização no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "VIEW",
      entityType: "igrejas",
      entityId: id,
      request,
    });

    return NextResponse.json({ igreja }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar igreja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/igrejas/[id] - Atualizar igreja (PROTEGIDA)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const body = await request.json();
    const { name, cnpj, number, street, city, state, zipCode, neighborhood } = body;

    // Validação básica
    if (!name && !cnpj && !number && !street && !city && !state && !zipCode && !neighborhood) {
      return NextResponse.json(
        { error: "Forneça pelo menos um campo para atualizar" },
        { status: 400 }
      );
    }

    // Verificar se a igreja existe
    const [existingIgreja] = await db
      .select()
      .from(igrejas)
      .where(eq(igrejas.id, id))
      .limit(1);

    if (!existingIgreja) {
      return NextResponse.json(
        { error: "Igreja não encontrada" },
        { status: 404 }
      );
    }

    let formattedCnpj = existingIgreja.cnpj;

    // Se CNPJ foi fornecido, validar e formatar
    if (cnpj) {
      const cnpjDigits = (cnpj || "").toString().replace(/\D/g, "");
      if (cnpjDigits.length !== 14) {
        return NextResponse.json(
          { error: "CNPJ deve conter 14 dígitos" },
          { status: 400 }
        );
      }

      formattedCnpj = `${cnpjDigits.slice(0, 2)}.${cnpjDigits.slice(2, 5)}.${cnpjDigits.slice(5, 8)}/${cnpjDigits.slice(8, 12)}-${cnpjDigits.slice(12, 14)}`;

      // Verificar se o novo CNPJ já existe em outra igreja
      if (formattedCnpj !== existingIgreja.cnpj) {
        const [duplicateCnpj] = await db
          .select()
          .from(igrejas)
          .where(eq(igrejas.cnpj, formattedCnpj))
          .limit(1);

        if (duplicateCnpj) {
          return NextResponse.json(
            { error: "CNPJ já está em uso" },
            { status: 409 }
          );
        }
      }
    }

    // Atualizar igreja
    const [updatedIgreja] = await db
      .update(igrejas)
      .set({
        ...(name && { name }),
        ...(cnpj && { cnpj: formattedCnpj }),
        ...(number !== undefined && { number }),
        ...(street && { street }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode && { zipCode }),
        ...(neighborhood && { neighborhood }),
        updatedAt: new Date(),
      })
      .where(eq(igrejas.id, id))
      .returning();

    // Registrar atualização no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "UPDATE",
      entityType: "igrejas",
      entityId: id,
      oldData: existingIgreja,
      newData: updatedIgreja,
      request,
    });

    return NextResponse.json(
      {
        message: "Igreja atualizada com sucesso",
        igreja: updatedIgreja,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar igreja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/igrejas/[id] - Deletar igreja (PROTEGIDA)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    // Verificar se a igreja existe
    const [existingIgreja] = await db
      .select()
      .from(igrejas)
      .where(eq(igrejas.id, id))
      .limit(1);

    if (!existingIgreja) {
      return NextResponse.json(
        { error: "Igreja não encontrada" },
        { status: 404 }
      );
    }

    // Deletar igreja
    await db.delete(igrejas).where(eq(igrejas.id, id));

    // Registrar deleção no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "DELETE",
      entityType: "igrejas",
      entityId: id,
      oldData: existingIgreja,
      request,
    });

    return NextResponse.json(
      {
        message: "Igreja deletada com sucesso",
        igreja: existingIgreja,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar igreja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
