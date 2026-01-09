import { db } from "@/db/drizzle";
import { auditLog } from "@/db/schema";
import { NextRequest } from "next/server";

export type AuditAction = 
  | "CREATE" 
  | "UPDATE" 
  | "DELETE" 
  | "LOGIN" 
  | "LOGOUT" 
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGE"
  | "VIEW";

export type EntityType = 
  | "users" 
  | "products" 
  | "orders" 
  | "igrejas" 
  | "stock" 
  | "password_resets";

interface CreateAuditLogParams {
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  request?: NextRequest;
}

/**
 * Registra uma ação no histórico de auditoria
 */
export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  oldData,
  newData,
  request,
}: CreateAuditLogParams) {
  try {
    // Extrair IP e User Agent da requisição se disponível
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (request) {
      ipAddress = request.headers.get("x-forwarded-for") || 
                  request.headers.get("x-real-ip") || 
                  undefined;
      userAgent = request.headers.get("user-agent") || undefined;
    }

    await db.insert(auditLog).values({
      userId,
      action,
      entityType,
      entityId: entityId || null,
      oldData: oldData ? JSON.stringify(oldData) : null,
      newData: newData ? JSON.stringify(newData) : null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    console.log(`[AUDIT] ${action} on ${entityType} by user ${userId}`);
  } catch (error) {
    // Log do erro mas não falha a operação principal
    console.error("Erro ao criar log de auditoria:", error);
  }
}

/**
 * Helper para remover campos sensíveis dos dados de auditoria
 */
export function sanitizeDataForAudit(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  
  // Remover campos sensíveis
  delete sanitized.password;
  
  return sanitized;
}
