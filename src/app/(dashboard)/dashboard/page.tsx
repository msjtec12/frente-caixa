import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, PackageOpen, Wallet, Percent, Receipt } from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  const role = (session?.user as any)?.role;

  if (!companyId) return <div>Sem permissão</div>;
  if (role === "CASHIER") {
    return <div className="p-10 text-center flex flex-col items-center justify-center">
      <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
      <h2 className="text-2xl font-bold">Acesso Restrito</h2>
      <p className="text-zinc-500 mt-2">Você não tem permissão para visualizar o Dashboard.</p>
    </div>;
  }

  // Configurando datas (Hoje e Ontem para comparação)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  const yesterdayEnd = new Date(todayStart);
  yesterdayEnd.setMilliseconds(yesterdayEnd.getMilliseconds() - 1);

  // 1. Vendas e Faturamento de HOJE
  const todaySales = await prisma.sale.aggregate({
    _count: { id: true },
    _sum: { total: true },
    where: { companyId, createdAt: { gte: todayStart }, status: "COMPLETED" }
  });

  const vendasHoje = todaySales._count.id;
  const faturamentoHoje = todaySales._sum.total || 0;

  // 2. CMV (Custo de Mercadorias Vendidas) HOJE
  const todaySaleItems = await prisma.saleItem.findMany({
    where: { sale: { companyId, createdAt: { gte: todayStart }, status: "COMPLETED" } }
  });
  const custoHoje = todaySaleItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);

  // 3. Despesas de HOJE
  const todayExpenses = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { companyId, date: { gte: todayStart } }
  });
  const despesasHoje = todayExpenses._sum.amount || 0;

  // 4. Lucro Líquido e Margem
  const lucroLiquidoHoje = faturamentoHoje - custoHoje - despesasHoje;
  const margemHoje = faturamentoHoje > 0 ? (lucroLiquidoHoje / faturamentoHoje) * 100 : 0;

  // 5. Produtos com Estoque Baixo
  const estoqueBaixo = await prisma.product.count({
    where: {
      companyId,
      stock: { lte: prisma.product.fields.minStock }
    }
  });

  // 6. Gráfico dos últimos 7 dias
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const salesLast7Days = await prisma.sale.findMany({
    where: { companyId, createdAt: { gte: sevenDaysAgo }, status: "COMPLETED" },
    select: { total: true, createdAt: true }
  });

  // Agrupando por dia (Formato DD/MM)
  const chartDataMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    chartDataMap[dateStr] = 0;
  }

  salesLast7Days.forEach(sale => {
    const dateStr = `${sale.createdAt.getDate().toString().padStart(2, '0')}/${(sale.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
    if (chartDataMap[dateStr] !== undefined) {
      chartDataMap[dateStr] += sale.total;
    }
  });

  const chartData = Object.keys(chartDataMap).map(date => ({
    date,
    total: chartDataMap[date]
  }));

  // 7. Produtos Mais Vendidos
  const recentSaleItems = await prisma.saleItem.findMany({
    where: { sale: { companyId, status: "COMPLETED" } },
    include: { product: { include: { category: true } } }
  });

  const productCountMap: Record<string, { quantity: number, product: any }> = {};
  recentSaleItems.forEach(item => {
    if (!productCountMap[item.productId]) {
      productCountMap[item.productId] = { quantity: 0, product: item.product };
    }
    productCountMap[item.productId].quantity += item.quantity;
  });

  const topProducts = Object.values(productCountMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map(({ quantity, product }) => ({
      name: product?.name || 'Desconhecido',
      category: product?.category?.name || 'Sem Categoria',
      quantity,
      imageUrl: product?.imageUrl
    }));

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
      
      {/* LINHA 1: Visão Financeira Principal */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-zinc-950 border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento (Receita)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {faturamentoHoje.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total vendido hoje ({vendasHoje} vendas)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos e Despesas</CardTitle>
            <Receipt className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">R$ {(custoHoje + despesasHoje).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              CMV: R$ {custoHoje.toFixed(2)} | Desp: R$ {despesasHoje.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className={lucroLiquidoHoje >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <Wallet className={`h-4 w-4 ${lucroLiquidoHoje >= 0 ? "text-green-600" : "text-red-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black ${lucroLiquidoHoje >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {lucroLiquidoHoje.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Receita - Custos - Despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margemHoje >= 0 ? "text-primary" : "text-red-500"}`}>
              {margemHoje.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">% de lucro sobre as vendas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Faturamento (Últimos 7 Dias)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <DashboardCharts data={chartData} />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Produtos Mais Vendidos</span>
              {estoqueBaixo > 0 && (
                <span className="text-xs font-normal flex items-center text-red-500 bg-red-50 dark:bg-red-950 px-2 py-1 rounded-full">
                  <AlertTriangle className="h-3 w-3 mr-1" /> {estoqueBaixo} sem estoque
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                <PackageOpen className="h-10 w-10 mb-2 opacity-20" />
                <p>Nenhuma venda registrada ainda</p>
              </div>
            ) : (
              <div className="space-y-6 mt-2">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center">
                    <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden flex items-center justify-center shrink-0 border">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-zinc-400">{p.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="ml-4 space-y-1 overflow-hidden">
                      <p className="text-sm font-medium leading-none truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.category}
                      </p>
                    </div>
                    <div className="ml-auto font-bold text-sm bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                      {p.quantity} unid
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
