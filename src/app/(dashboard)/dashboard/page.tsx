import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, PackageOpen } from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
    where: { createdAt: { gte: todayStart }, status: "COMPLETED" }
  });

  const vendasHoje = todaySales._count.id;
  const faturamentoHoje = todaySales._sum.total || 0;
  const ticketMedioHoje = vendasHoje > 0 ? faturamentoHoje / vendasHoje : 0;

  // 2. Vendas e Faturamento de ONTEM (Para percentual)
  const yesterdaySales = await prisma.sale.aggregate({
    _count: { id: true },
    _sum: { total: true },
    where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd }, status: "COMPLETED" }
  });

  const vendasOntem = yesterdaySales._count.id;
  const faturamentoOntem = yesterdaySales._sum.total || 0;

  const percentualVendas = vendasOntem === 0 ? 100 : Math.round(((vendasHoje - vendasOntem) / vendasOntem) * 100);
  const percentualFaturamento = faturamentoOntem === 0 ? 100 : Math.round(((faturamentoHoje - faturamentoOntem) / faturamentoOntem) * 100);

  // 3. Produtos com Estoque Baixo
  const estoqueBaixo = await prisma.product.count({
    where: {
      stock: { lte: prisma.product.fields.minStock }
    }
  });

  // 4. Gráfico dos últimos 7 dias
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const salesLast7Days = await prisma.sale.findMany({
    where: { createdAt: { gte: sevenDaysAgo }, status: "COMPLETED" },
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

  // 5. Produtos Mais Vendidos
  const topItemsRaw = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

  const topProducts = await Promise.all(
    topItemsRaw.map(async (item) => {
      const p = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { category: true }
      });
      return {
        name: p?.name || 'Desconhecido',
        category: p?.category?.name || 'Sem Categoria',
        quantity: item._sum.quantity || 0,
        imageUrl: p?.imageUrl
      };
    })
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas de Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendasHoje}</div>
            <p className={`text-xs ${percentualVendas >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {percentualVendas >= 0 ? '+' : ''}{percentualVendas}% em relação a ontem
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {faturamentoHoje.toFixed(2)}</div>
            <p className={`text-xs ${percentualFaturamento >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {percentualFaturamento >= 0 ? '+' : ''}{percentualFaturamento}% em relação a ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio (Hoje)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {ticketMedioHoje.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Média por venda hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${estoqueBaixo > 0 ? 'text-red-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${estoqueBaixo > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {estoqueBaixo}
            </div>
            <p className="text-xs text-muted-foreground">Produtos precisando de atenção</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Faturamento (Últimos 7 Dias)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <DashboardCharts data={chartData} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
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
