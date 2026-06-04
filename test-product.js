const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = {
    name: "Suco Teste",
    internalCode: "",
    barcode: "",
    description: "",
    costPrice: 0,
    sellPrice: 5,
    stock: 10,
    minStock: 2,
    unit: "UN",
    imageUrl: "",
    categoryId: "cmpzpqzcz0000jv04usy2ezc7", // Bebidas
  };
  
  try {
    const product = await prisma.product.create({ data });
    console.log("Sucesso:", product);
  } catch (err) {
    console.error("Erro Prisma:", err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
