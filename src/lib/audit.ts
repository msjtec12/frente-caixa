import { prisma } from "@/lib/prisma";

type AuditAction = 
  | "CREATE_PRODUCT" | "UPDATE_PRODUCT" | "DELETE_PRODUCT"
  | "OPEN_REGISTER" | "CLOSE_REGISTER" | "CASH_MOVEMENT"
  | "CREATE_SALE" | "CANCEL_SALE"
  | "CREATE_CUSTOMER" | "UPDATE_CUSTOMER" | "DELETE_CUSTOMER"
  | "CREATE_CATEGORY" | "UPDATE_CATEGORY" | "DELETE_CATEGORY";

interface AuditLogParams {
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: string | Record<string, any>;
  companyId: string;
  userId: string;
  tx?: any; // Prisma transaction object if running inside a transaction
}

export async function logAuditAction(params: AuditLogParams) {
  const { action, entity, entityId, details, companyId, userId, tx } = params;
  
  const prismaClient = tx || prisma;
  
  const detailsStr = typeof details === "object" ? JSON.stringify(details) : (details || null);

  await prismaClient.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      details: detailsStr,
      companyId,
      userId,
    }
  });
}
