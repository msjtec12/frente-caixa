import { prisma } from "@/lib/prisma";
import { CatalogClient } from "./catalog-client";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const firstCompany = await prisma.company.findFirst();
  const companyId = firstCompany?.id;

  if (!companyId) {
    return <div className="p-20 text-center">Nenhuma loja configurada.</div>;
  }

  const categories = await prisma.category.findMany({
    where: { companyId },
    orderBy: { name: 'asc' }
  });

  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { name: 'asc' }
  });

  return <CatalogClient products={products} categories={categories} />;
}
