"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type CheckoutData = {
  cashRegisterId: string;
  customerId?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  payments: { method: string; amount: number }[];
  discount: number;
};

export async function checkoutSale(data: CheckoutData) {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  if (!companyId || !session?.user?.id) throw new Error("Não autenticado");

  const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const total = subtotal - data.discount;
  
  const paymentTotal = data.payments.reduce((acc, p) => acc + p.amount, 0);
  let change = paymentTotal - total;
  
  if (change < -0.01) {
     throw new Error("Total pago é menor que o valor da venda");
  }

  // Agrupa os pagamentos por método
  const paymentsMap = new Map<string, number>();
  for (const p of data.payments) {
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
    const productIds = data.items.map(i => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds }, companyId } });
    const productMap = new Map(products.map(p => [p.id, p]));

    // Check stock if needed. Later we will implement stock block.

    // 2. Create Sale
    const newSale = await tx.sale.create({
      data: {
        companyId,
        userId: session.user.id,
        cashRegisterId: data.cashRegisterId,
        customerId: data.customerId,
        subtotal,
        discount: data.discount,
        total,
        status: "COMPLETED",
        items: {
          create: data.items.map(item => ({
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
    for (const item of data.items) {
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
