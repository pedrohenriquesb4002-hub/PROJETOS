import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { audit_log } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.success) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const logs = await db
      .select({
        id: audit_log.id,
        userId: audit_log.userId,
        action: audit_log.action,
        entityType: audit_log.entityType,
        entityId: audit_log.entityId,
        oldData: audit_log.oldData,
        newData: audit_log.newData,
        createdAt: audit_log.createdAt,
      })
      .from(audit_log)
      .orderBy(desc(audit_log.createdAt))
      .limit(100);

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}