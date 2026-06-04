import { getExpenses } from "@/app/actions/expenses";
import { ExpenseClient } from "./expense-client";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const expenses = await getExpenses();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Despesas</h2>
      </div>
      <ExpenseClient initialExpenses={expenses} />
    </div>
  );
}
