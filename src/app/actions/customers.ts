"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) return [];

  return prisma.customer.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomer(data: any) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const customer = await prisma.customer.create({ 
    data: { ...data, companyId } 
  });
  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: string, data: any) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const customer = await prisma.customer.update({
    where: { id, companyId },
    data,
  });
  revalidatePath("/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  await prisma.customer.delete({ where: { id, companyId } });
  revalidatePath("/customers");
}
