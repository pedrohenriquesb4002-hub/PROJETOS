import { db } from "@/db/drizzle";
import { audit_log } from "@/db/schema";

interface AuditLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  request?: any; 
}

export async function createAuditLog({
  userId, action, entityType, entityId, oldData, newData
}: AuditLogParams) {
  try {
    await db.insert(audit_log).values({
      userId,
      action,
      entityType,
      entityId,
      oldData,
      newData,
    });
  } catch (error) {
    console.error("Erro no log de auditoria:", error);
  }
}