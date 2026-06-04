"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getExpenses() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId || !session?.user?.id) return [];

  return prisma.expense.findMany({
    where: { companyId, userId: session.user.id },
    orderBy: { date: 'desc' }
  });
}

export async function createExpense(data: { description: string; amount: number; category?: string; date: Date }) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId || !session?.user?.id) throw new Error("Não autenticado");

  const expense = await prisma.expense.create({
    data: {
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: data.date,
      companyId,
      userId: session.user.id,
    }
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return expense;
}

export async function deleteExpense(id: string) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId || !session?.user?.id) throw new Error("Não autenticado");

  await prisma.expense.delete({
    where: { id, companyId, userId: session.user.id }
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
