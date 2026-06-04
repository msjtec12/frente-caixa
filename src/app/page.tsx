import { prisma } from "@/lib/prisma";
import { CatalogClient } from "./catalog-client";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  // Fetch público de categorias e produtos
  // No futuro, podemos filtrar apenas produtos com "isVisible: true"
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });

  return <CatalogClient products={products} categories={categories} />;
}
