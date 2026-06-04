const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checando categorias...");
  const categories = await prisma.category.findMany();
  console.log("Categorias encontradas:", categories);
  
  console.log("Criando categoria de teste...");
  const cat = await prisma.category.create({
    data: { name: 'Categoria de Teste' }
  });
  console.log("Categoria criada com sucesso:", cat);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
