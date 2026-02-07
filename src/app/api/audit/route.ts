import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { audit_log, users } from "@/db/schema"; // Alterado de auditLog para audit_log
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

/**
 * @swagger
 * /api/audit:
 * get:
 * summary: Consultar histórico de auditoria
 * tags: [Audit]
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

    // Parâmetros de busca
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construir query usando audit_log
    let query = db
      .select({
        id: audit_log.id,
        userId: audit_log.userId,
        userName: users.name,
        userEmail: users.email,
        action: audit_log.action,
        entityType: audit_log.entityType,
        entityId: audit_log.entityId,
        oldData: audit_log.oldData,
        newData: audit_log.newData,
        ipAddress: audit_log.ipAddress,
        userAgent: audit_log.userAgent,
        createdAt: audit_log.createdAt,
      })
      .from(audit_log) // Alterado para audit_log
      .leftJoin(users, eq(audit_log.userId, users.id)) // Alterado para audit_log
      .orderBy(desc(audit_log.createdAt))
      .limit(limit)
      .offset(offset);

    // Aplicar filtros usando audit_log
    let logs: any[];
    
    if (userId) {
      logs = await query.where(eq(audit_log.userId, userId));
    } else if (action) {
      logs = await query.where(eq(audit_log.action, action as any));
    } else if (entityType) {
      logs = await query.where(eq(audit_log.entityType, entityType as any));
    } else if (entityId) {
      logs = await query.where(eq(audit_log.entityId, entityId));
    } else {
      logs = await query;
    }

    // Parse JSON fields (Drizzle retorna como objeto se for jsonb, 
    // mas mantemos o parse caso seu banco esteja como texto)
    const parsedLogs = logs.map(log => ({
      ...log,
      oldData: typeof log.oldData === 'string' ? JSON.parse(log.oldData) : log.oldData,
      newData: typeof log.newData === 'string' ? JSON.parse(log.newData) : log.newData,
    }));

    return NextResponse.json(
      {
        logs: parsedLogs,
        count: parsedLogs.length,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}