import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Logs de Auditoria",
};

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role || "CASHIER";
  if (userRole !== "ADMIN" && userRole !== "MANAGER") {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Acesso Negado</h2>
          <p className="text-zinc-500 mt-2">Você não tem permissão para visualizar a trilha de auditoria.</p>
        </div>
      </div>
    );
  }

  const companyId = (session.user as any).companyId;

  const logs = await prisma.auditLog.findMany({
    where: { companyId },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200, // Últimos 200 para evitar sobrecarga inicial
  });

  const getActionColor = (action: string) => {
    if (action.includes("DELETE") || action.includes("CANCEL")) return "destructive";
    if (action.includes("CREATE") || action.includes("OPEN")) return "default";
    if (action.includes("UPDATE") || action.includes("CLOSE")) return "secondary";
    return "outline";
  };

  const formatActionName = (action: string) => {
    const names: Record<string, string> = {
      CREATE_PRODUCT: "Criou Produto",
      UPDATE_PRODUCT: "Editou Produto",
      DELETE_PRODUCT: "Excluiu Produto",
      OPEN_REGISTER: "Abriu Caixa",
      CLOSE_REGISTER: "Fechou Caixa",
      CASH_MOVEMENT: "Movimentação Caixa",
      CREATE_SALE: "Criou Venda",
      CANCEL_SALE: "Cancelou Venda",
    };
    return names[action] || action;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trilha de Auditoria</h1>
        <p className="text-muted-foreground">Monitoramento de segurança das ações realizadas no sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
          <CardDescription>Últimas 200 ações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Detalhes Técnicos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-zinc-500">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.user.name || log.user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(log.action) as any}>
                          {formatActionName(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-zinc-500 max-w-[300px] truncate">
                        {log.details ? (
                          <pre title={log.details} className="truncate">
                            {log.details}
                          </pre>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
