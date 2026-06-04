"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  document: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function getCustomers() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) return [];

  return prisma.customer.findMany({
    where: { companyId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomer(data: unknown) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const parsed = customerSchema.parse(data);
  const processedData = {
    ...parsed,
    document: parsed.document?.trim() === "" ? null : parsed.document,
    email: parsed.email?.trim() === "" ? null : parsed.email,
  };

  const customer = await prisma.customer.create({ 
    data: { ...processedData, companyId } 
  });
  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: string, data: unknown) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const parsed = customerSchema.parse(data);
  const processedData = {
    ...parsed,
    document: parsed.document?.trim() === "" ? null : parsed.document,
    email: parsed.email?.trim() === "" ? null : parsed.email,
  };

  const customer = await prisma.customer.update({
    where: { id, companyId },
    data: processedData,
  });
  revalidatePath("/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  await prisma.customer.update({ 
    where: { id, companyId },
    data: { isActive: false }
  });
  revalidatePath("/customers");
}
