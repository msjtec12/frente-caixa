"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const checkoutSchema = z.object({
  cashRegisterId: z.string().min(1, "Caixa inválido"),
  customerId: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(0.001, "Quantidade inválida"),
    unitPrice: z.number().min(0, "Preço inválido")
  })).min(1, "A venda deve ter pelo menos um item"),
  payments: z.array(z.object({
    method: z.string(),
    amount: z.number().min(0.01, "Valor inválido")
  })).min(1, "A venda deve ter pelo menos um pagamento"),
  discount: z.number().min(0).default(0)
});

export async function checkoutSale(data: unknown) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId || !session?.user?.id) throw new Error("Não autenticado");

  const parsed = checkoutSchema.parse(data);

  const subtotal = parsed.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const total = subtotal - parsed.discount;
  
  const paymentTotal = parsed.payments.reduce((acc, p) => acc + p.amount, 0);
  let change = paymentTotal - total;
  
  if (change < -0.01) {
     throw new Error("Total pago é menor que o valor da venda");
  }

  // Agrupa os pagamentos por método
  const paymentsMap = new Map<string, number>();
  for (const p of parsed.payments) {
    paymentsMap.set(p.method, (paymentsMap.get(p.method) || 0) + p.amount);
  }

  // Se houver troco, desconta do Dinheiro
  if (change > 0.01) {
    const cashAmount = paymentsMap.get("DINHEIRO") || 0;
    if (cashAmount >= change) {
      paymentsMap.set("DINHEIRO", cashAmount - change);
    } else {
      throw new Error("O valor de troco excede o valor pago em Dinheiro");
    }
  }

  const processedPayments = Array.from(paymentsMap.entries())
    .filter(([_, amount]) => amount > 0)
    .map(([method, amount]) => ({ method, amount }));

  // Transaction to ensure atomicity
  const sale = await prisma.$transaction(async (tx) => {
    // 1. Fetch products to get costPrice
    const productIds = parsed.items.map(i => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds }, companyId } });
    const productMap = new Map(products.map(p => [p.id, p]));

    // Check stock if needed. Later we will implement stock block.

    // 2. Create Sale
    const newSale = await tx.sale.create({
      data: {
        companyId,
        userId: session.user.id,
        cashRegisterId: parsed.cashRegisterId,
        customerId: parsed.customerId,
        subtotal,
        discount: parsed.discount,
        total,
        status: "COMPLETED",
        items: {
          create: parsed.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: productMap.get(item.productId)?.costPrice || 0,
            subtotal: item.quantity * item.unitPrice,
          }))
        },
        payments: {
          create: processedPayments.map(payment => ({
            method: payment.method,
            amount: payment.amount,
          }))
        }
      }
    });

    // 3. Decrement stock and register movements
    for (const item of parsed.items) {
      await tx.product.update({
        where: { id: item.productId, companyId },
        data: {
          stock: { decrement: item.quantity }
        }
      });

      await tx.inventoryMovement.create({
        data: {
          companyId,
          productId: item.productId,
          type: "OUT",
          quantity: item.quantity,
          reason: `Venda #${newSale.id}`
        }
      });
    }

    return newSale;
  });

  revalidatePath("/pdv");
  return sale;
}
