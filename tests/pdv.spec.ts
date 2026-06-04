import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Frente de Caixa (PDV)', () => {
  let productName = 'Produto Teste E2E ' + Date.now();

  test.beforeAll(async () => {
    // Garante que a base de teste tenha empresa e o produto
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({ data: { name: 'Empresa Teste' } });
    }

    let category = await prisma.category.findFirst({ where: { companyId: company.id } });
    if (!category) {
      category = await prisma.category.create({ data: { name: 'Categoria E2E', companyId: company.id } });
    }

    await prisma.product.create({
      data: {
        name: productName,
        costPrice: 10,
        sellPrice: 20,
        stock: 100,
        unit: 'UN',
        categoryId: category.id,
        companyId: company.id
      }
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Deve completar o fluxo principal de vendas com atalhos de teclado', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    
    // Aguarda carregar Next.js 
    await page.waitForTimeout(2000); 
    
    await page.getByPlaceholder('admin@konnexy.com.br').fill('admin@konnexy.com.br');
    await page.getByPlaceholder('••••••••').fill('admin');
    await page.click('button:has-text("Entrar")');
    
    // Aguarda o login concluir
    await page.waitForURL('**/dashboard');

    // 3. Acessar PDV
    await page.goto('/pdv');

    // Abre o caixa se estiver fechado
    const btnAbrirCaixa = page.locator('button:has-text("Abrir Caixa")');
    if (await btnAbrirCaixa.isVisible()) {
      await page.fill('input[type="number"]', '100'); // Fundo de troco
      await page.click('button:has-text("Abrir Caixa")');
      await page.waitForSelector('text=Caixa aberto com sucesso!');
    }

    // 4. Buscar Produto com Atalho F2
    await page.keyboard.press('F2');
    await expect(page.locator('#pdv-search-input')).toBeFocused();
    await page.fill('#pdv-search-input', productName);
    
    // Aguarda a lista de busca renderizar (debounce, fetch, etc)
    await page.waitForTimeout(1000);

    // 5. Adicionar ao carrinho (clica no primeiro produto retornado)
    await page.click(`text=${productName}`);
    
    // Verifica se subiu pro carrinho
    await expect(page.locator('text=Pedido Atual')).toBeVisible();

    // 6. Cobrar com Atalho F4
    await page.keyboard.press('F4');
    
    // Verifica se abriu o modal de pagamento
    await expect(page.locator('h2:has-text("Pagamento")')).toBeVisible();

    // 7. Pagar em Dinheiro
    await page.click('button:has-text("Dinheiro")');
    
    // Clica na nota rápida de R$ 50 para garantir que o valor pago cobre o total (R$ 20)
    await page.click('button:has-text("R$ 50")');
    
    // Confirmar Venda
    await page.click('button:has-text("Confirmar Venda")');

    // 8. Verificar Sucesso
    await page.waitForSelector('text=Venda finalizada com sucesso!');
  });
});
