import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { auditLog, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Consultar histórico de auditoria
 *     description: Retorna o histórico de auditoria do sistema com filtros opcionais (requer autenticação)
 *     tags: [Audit]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID do usuário
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrar por ação (CREATE, UPDATE, DELETE, LOGIN)
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de entidade (users, products, orders, etc)
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID da entidade
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de registros a retornar
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de registros a pular
 *     responses:
 *       200:
 *         description: Lista de logs de auditoria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 count:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
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

    // Parâmetros de busca
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construir query
    let query = db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        userName: users.name,
        userEmail: users.email,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        oldData: auditLog.oldData,
        newData: auditLog.newData,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Aplicar filtros
    let logs: any[];
    
    if (userId) {
      logs = await query.where(eq(auditLog.userId, userId));
    } else if (action) {
      logs = await query.where(eq(auditLog.action, action as any));
    } else if (entityType) {
      logs = await query.where(eq(auditLog.entityType, entityType as any));
    } else if (entityId) {
      logs = await query.where(eq(auditLog.entityId, entityId));
    } else {
      logs = await query;
    }

    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      ...log,
      oldData: log.oldData ? JSON.parse(log.oldData) : null,
      newData: log.newData ? JSON.parse(log.newData) : null,
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
