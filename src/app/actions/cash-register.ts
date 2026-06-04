"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCurrentCashRegister() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  const userId = session?.user?.id;
  
  if (!companyId || !userId) return null;

  return prisma.cashRegister.findFirst({
    where: {
      companyId,
      userId,
      status: "OPEN"
    },
    include: {
      sales: {
        include: {
          payments: true
        }
      }
    }
  });
}

import { logAuditAction } from "@/lib/audit";

export async function openCashRegister(initialAmount: number) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  const userId = session?.user?.id;
  
  if (!companyId || !userId) throw new Error("Não autenticado");

  const exists = await getCurrentCashRegister();
  if (exists) throw new Error("Já existe um caixa aberto para este usuário.");

  const cashRegister = await prisma.cashRegister.create({
    data: {
      companyId,
      userId,
      initialAmount,
      status: "OPEN",
    }
  });

  await logAuditAction({
    action: "OPEN_REGISTER",
    entity: "CashRegister",
    entityId: cashRegister.id,
    details: { initialAmount },
    companyId,
    userId,
  });

  revalidatePath("/pdv");
  return cashRegister;
}

export async function closeCashRegister(id: string, finalAmount: number) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  const userId = session?.user?.id;
  
  if (!companyId || !userId) throw new Error("Não autenticado");

  const cashRegister = await prisma.cashRegister.update({
    where: { id, companyId, userId },
    data: {
      status: "CLOSED",
      finalAmount,
      closedAt: new Date(),
    }
  });

  await logAuditAction({
    action: "CLOSE_REGISTER",
    entity: "CashRegister",
    entityId: cashRegister.id,
    details: { finalAmount, initialAmount: cashRegister.initialAmount },
    companyId,
    userId,
  });

  revalidatePath("/pdv");
  return cashRegister;
}

export async function createCashMovement(cashRegisterId: string, type: "SANGRIA" | "SUPRIMENTO", amount: number, reason: string) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  const userId = session?.user?.id;
  
  if (!companyId || !userId) throw new Error("Não autenticado");
  if (!reason || reason.trim() === "") throw new Error("Motivo é obrigatório para esta operação.");

  const movement = await prisma.cashMovement.create({
    data: {
      cashRegisterId,
      companyId,
      type,
      amount,
      reason,
    }
  });

  await logAuditAction({
    action: "CASH_MOVEMENT",
    entity: "CashMovement",
    entityId: movement.id,
    details: { type, amount, reason },
    companyId,
    userId,
  });

  revalidatePath("/pdv");
  return movement;
}
