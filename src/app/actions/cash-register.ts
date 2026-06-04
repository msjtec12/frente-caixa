"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCurrentCashRegister() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return prisma.cashRegister.findFirst({
    where: {
      userId: session.user.id,
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

export async function openCashRegister(initialAmount: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autenticado");

  const exists = await getCurrentCashRegister();
  if (exists) throw new Error("Já existe um caixa aberto para este usuário.");

  const cashRegister = await prisma.cashRegister.create({
    data: {
      userId: session.user.id,
      initialAmount,
      status: "OPEN",
    }
  });
  revalidatePath("/pdv");
  return cashRegister;
}

export async function closeCashRegister(id: string, finalAmount: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autenticado");

  const cashRegister = await prisma.cashRegister.update({
    where: { id, userId: session.user.id },
    data: {
      status: "CLOSED",
      finalAmount,
      closedAt: new Date(),
    }
  });
  revalidatePath("/pdv");
  return cashRegister;
}
