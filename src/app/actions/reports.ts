"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getGeneralReports() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId) return { sales: [], cashRegisters: [], products: [] };

  const sales = await prisma.sale.findMany({
    where: { companyId, status: "COMPLETED" },
    include: { 
      items: { include: { product: true } },
      payments: true,
      customer: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const cashRegisters = await prisma.cashRegister.findMany({
    where: { companyId },
    include: { user: true },
    orderBy: { openedAt: "desc" }
  });

  const products = await prisma.product.findMany({
    where: { companyId },
    include: { category: true }
  });

  return {
    sales,
    cashRegisters,
    products
  };
}
