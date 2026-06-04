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
  if (!session?.user?.id) throw new Error("Não autenticado");

  const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const total = subtotal - data.discount;
  
  const paymentTotal = data.payments.reduce((acc, p) => acc + p.amount, 0);
  if (Math.abs(paymentTotal - total) > 0.01) {
     throw new Error("Total de pagamentos não confere com o total da venda");
  }

  // Transaction to ensure atomicity
  const sale = await prisma.$transaction(async (tx) => {
    // 1. Fetch products to get costPrice
    const productIds = data.items.map(i => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map(p => [p.id, p]));

    // 2. Create Sale
    const newSale = await tx.sale.create({
      data: {
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
          create: data.payments.map(payment => ({
            method: payment.method,
            amount: payment.amount,
          }))
        }
      }
    });

    // 2. Decrement stock and register movements
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity }
        }
      });

      await tx.inventoryMovement.create({
        data: {
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
