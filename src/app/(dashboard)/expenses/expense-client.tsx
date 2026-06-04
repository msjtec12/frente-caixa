"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { createExpense, deleteExpense } from "@/app/actions/expenses";

export function ExpenseClient({ initialExpenses }: { initialExpenses: any[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Geral");

  const handleCreate = async () => {
    if (!description || !amount) return toast.error("Preencha descrição e valor");
    setLoading(true);
    try {
      const newExpense = await createExpense({
        description,
        amount: parseFloat(amount),
        category,
        date: new Date()
      });
      setExpenses([newExpense, ...expenses]);
      setIsOpen(false);
      setDescription("");
      setAmount("");
      toast.success("Despesa registrada com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao registrar despesa");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success("Despesa excluída!");
    } catch (e) {
      toast.error("Erro ao excluir");
    }
  };

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-xl border">
        <div>
          <p className="text-sm text-zinc-500 font-medium">Total de Despesas (Registradas)</p>
          <h3 className="text-2xl font-black text-red-500">
            R$ {totalExpenses.toFixed(2)}
          </h3>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Despesa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Despesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição (Ex: Conta de Luz, Aluguel)</label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="O que foi pago?" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Fixas, Variáveis, Fornecedores" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor (R$)</label>
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Salvando..." : "Salvar Despesa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">Nenhuma despesa registrada.</TableCell>
              </TableRow>
            )}
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>{expense.category || '-'}</TableCell>
                <TableCell className="text-right font-bold text-red-500">
                  R$ {expense.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                    <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
