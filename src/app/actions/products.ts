"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) return [];

  return prisma.product.findMany({
    where: { companyId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(data: any) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  // Converter strings vazias para nulo para não quebrar a restrição de "Unique"
  const processedData = {
    ...data,
    companyId,
    internalCode: data.internalCode?.trim() === "" ? null : data.internalCode,
    barcode: data.barcode?.trim() === "" ? null : data.barcode,
    imageUrl: data.imageUrl?.trim() === "" ? null : data.imageUrl,
  };

  const product = await prisma.product.create({ data: processedData });
  revalidatePath("/products");
  return product;
}

export async function updateProduct(id: string, data: any) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const product = await prisma.product.update({
    where: { id, companyId },
    data,
  });
  revalidatePath("/products");
  return product;
}

export async function deleteProduct(id: string) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  await prisma.product.delete({ where: { id, companyId } });
  revalidatePath("/products");
}
