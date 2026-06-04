"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) return [];

  return prisma.category.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCategory(data: { name: string; description?: string }) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const category = await prisma.category.create({ 
    data: { ...data, companyId } 
  });
  revalidatePath("/categories");
  return category;
}

export async function updateCategory(id: string, data: { name: string; description?: string }) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const category = await prisma.category.update({
    where: { id, companyId },
    data,
  });
  revalidatePath("/categories");
  return category;
}

export async function deleteCategory(id: string) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  await prisma.category.delete({ where: { id, companyId } });
  revalidatePath("/categories");
}
