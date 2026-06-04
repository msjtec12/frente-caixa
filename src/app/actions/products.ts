"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  internalCode: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  costPrice: z.number().min(0),
  sellPrice: z.number().min(0),
  stock: z.number(),
  minStock: z.number().min(0),
  unit: z.string().default("UN"),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

export async function getProducts() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) return [];

  return prisma.product.findMany({
    where: { companyId, isActive: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(data: unknown) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const parsed = productSchema.parse(data);

  // Converter strings vazias para nulo para não quebrar a restrição de "Unique"
  const processedData = {
    ...parsed,
    companyId,
    internalCode: parsed.internalCode?.trim() === "" ? null : parsed.internalCode,
    barcode: parsed.barcode?.trim() === "" ? null : parsed.barcode,
    imageUrl: parsed.imageUrl?.trim() === "" ? null : parsed.imageUrl,
  };

  const product = await prisma.product.create({ data: processedData });
  revalidatePath("/products");
  return product;
}

export async function updateProduct(id: string, data: unknown) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  const parsed = productSchema.parse(data);

  const processedData = {
    ...parsed,
    internalCode: parsed.internalCode?.trim() === "" ? null : parsed.internalCode,
    barcode: parsed.barcode?.trim() === "" ? null : parsed.barcode,
    imageUrl: parsed.imageUrl?.trim() === "" ? null : parsed.imageUrl,
  };

  const product = await prisma.product.update({
    where: { id, companyId },
    data: processedData,
  });
  revalidatePath("/products");
  return product;
}

export async function deleteProduct(id: string) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) throw new Error("Não autenticado");

  await prisma.product.update({ 
    where: { id, companyId },
    data: { isActive: false }
  });
  revalidatePath("/products");
}
