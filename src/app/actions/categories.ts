"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  description: z.string().optional(),
});

export async function getCategories() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) return [];

  return prisma.category.findMany({
    where: { companyId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const parsed = categorySchema.parse(data);

  const category = await prisma.category.create({ 
    data: { ...parsed, companyId } 
  });
  revalidatePath("/categories");
  return category;
}

export async function updateCategory(id: string, data: z.infer<typeof categorySchema>) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const parsed = categorySchema.parse(data);

  const category = await prisma.category.update({
    where: { id, companyId },
    data: parsed,
  });
  revalidatePath("/categories");
  return category;
}

export async function deleteCategory(id: string) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  await prisma.category.update({ 
    where: { id, companyId },
    data: { isActive: false }
  });
  revalidatePath("/categories");
}
