import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function CashRegisterPage() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  const role = (session?.user as any)?.role;
  
  if (!companyId) return <div>Acesso negado.</div>;
  if (role === "CASHIER") {
    return <div className="p-10 text-center flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-red-600">Acesso Restrito</h2>
      <p className="text-zinc-500 mt-2">Você não tem permissão para gerenciar os caixas.</p>
    </div>;
  }

  const registers = await prisma.cashRegister.findMany({
    where: { companyId },
    include: { user: true, sales: true },
    orderBy: { openedAt: "desc" },
    take: 30
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Controle de Caixa</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Caixas (Últimos 30)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operador</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fundo Inicial</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Saldo Gaveta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registers.map((reg) => {
                const totalVendas = reg.sales.reduce((acc, s) => acc + s.total, 0);
                const saldoEsperado = reg.initialAmount + totalVendas;
                const diferenca = reg.finalAmount !== null ? reg.finalAmount - saldoEsperado : null;

                return (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.user.name}</TableCell>
                    <TableCell>{format(new Date(reg.openedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>
                      {reg.closedAt ? format(new Date(reg.closedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full font-bold ${reg.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-700'}`}>
                        {reg.status === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                      </span>
                    </TableCell>
                    <TableCell>R$ {reg.initialAmount.toFixed(2)}</TableCell>
                    <TableCell>R$ {totalVendas.toFixed(2)}</TableCell>
                    <TableCell>
                      {reg.finalAmount !== null ? (
                        <div className="flex flex-col">
                          <span>R$ {reg.finalAmount.toFixed(2)}</span>
                          {diferenca !== 0 && (
                            <span className={`text-xs ${diferenca !== null && diferenca > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {diferenca !== null && diferenca > 0 ? '+' : ''}{diferenca?.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {registers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-zinc-500">
                    Nenhum caixa registrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
