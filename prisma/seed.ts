import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seed do banco de dados...');

  // Verifica se já existe uma empresa, senão cria
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Minha Empresa',
        theme: 'light',
      },
    });
    console.log('Empresa inicial criada.');
  }

  // Verifica se já existe o admin, senão cria
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@admin.com',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company.id,
      },
    });
    console.log('Usuário admin criado (admin@admin.com / admin123).');
  } else {
    console.log('Usuário admin já existe.');
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
