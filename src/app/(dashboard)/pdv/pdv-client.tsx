"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, LockKeyhole, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { openCashRegister } from "@/app/actions/cash-register";
import { checkoutSale } from "@/app/actions/sales";

interface CartItem {
  product: any;
  quantity: number;
}

interface Payment {
  method: string;
  amount: number;
}

export function PDVClient({ products, customers, cashRegister, categories }: { products: any[], customers: any[], cashRegister: any, categories: any[] }) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(!!cashRegister);
  const [initialAmount, setInitialAmount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  
  // Modal de Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("DINHEIRO");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = products;
    
    if (selectedCategory !== "all") {
      result = result.filter(p => p.categoryId === selectedCategory);
    }
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.barcode?.includes(searchTerm) || 
        p.internalCode?.toLowerCase().includes(lower)
      );
    }
    
    return result;
  }, [searchTerm, selectedCategory, products]);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.product.sellPrice * item.quantity), 0), [cart]);
  const total = Math.max(0, subtotal - discount);
  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const remaining = Math.max(0, total - totalPaid);
  const change = totalPaid > total ? totalPaid - total : 0;

  useEffect(() => {
    if (remaining > 0 && isCheckoutOpen) {
      setPaymentAmount(remaining);
    }
  }, [remaining, isCheckoutOpen]);

  const handleOpenRegister = async () => {
    try {
      await openCashRegister(initialAmount);
      setIsRegisterOpen(true);
      toast.success("Caixa aberto com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao abrir caixa");
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchTerm("");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQtd = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQtd };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    if(confirm("Deseja cancelar esta venda e limpar o carrinho?")) {
      setCart([]);
      setDiscount(0);
    }
  };

  const addPayment = () => {
    if (paymentAmount <= 0) return;
    setPayments(prev => [...prev, { method: selectedMethod, amount: paymentAmount }]);
    setPaymentAmount(0);
  };

  const addQuickCash = (amount: number) => {
    setPayments(prev => [...prev, { method: "DINHEIRO", amount }]);
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (totalPaid < total) return toast.error("O valor pago é menor que o total da venda");

    setIsProcessing(true);
    try {
      await checkoutSale({
        cashRegisterId: cashRegister?.id || "",
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.sellPrice,
        })),
        payments: payments,
        discount: discount,
      });

      toast.success("Venda finalizada com sucesso!");
      setCart([]);
      setPayments([]);
      setDiscount(0);
      setIsCheckoutOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao finalizar venda");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isRegisterOpen) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-[400px] shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4"><LockKeyhole className="h-12 w-12 text-zinc-400" /></div>
            <CardTitle className="text-2xl">Caixa Fechado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-zinc-500">Para iniciar as vendas, você precisa abrir o caixa informando o valor inicial (fundo de troco).</p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Inicial (R$)</label>
              <Input type="number" step="0.01" value={initialAmount} onChange={(e) => setInitialAmount(parseFloat(e.target.value) || 0)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={handleOpenRegister}>Abrir Caixa</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
      {/* Esquerda: Busca e Produtos (65%) */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        
        {/* Barra de Busca */}
        <div className="relative shrink-0 shadow-sm rounded-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input 
            className="pl-12 text-lg h-14 bg-white dark:bg-zinc-900 border-none shadow-sm" 
            placeholder="Buscar produto ou código de barras..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        {/* Categorias Horizontal */}
        <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-hide">
          <Button 
            variant={selectedCategory === "all" ? "default" : "outline"} 
            className="rounded-full whitespace-nowrap"
            onClick={() => setSelectedCategory("all")}
          >
            Todos
          </Button>
          {categories?.map(cat => (
            <Button 
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className="rounded-full whitespace-nowrap bg-white dark:bg-zinc-900"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
        
        {/* Grid de Produtos */}
        <div className="flex-1 overflow-y-auto pr-2 pb-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(p => (
              <div 
                key={p.id} 
                onClick={() => addToCart(p)} 
                className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden cursor-pointer hover:border-primary hover:shadow-md transition-all active:scale-95 flex flex-col h-44"
              >
                {/* Imagem do Produto */}
                <div className="h-24 bg-zinc-100 dark:bg-zinc-800 w-full flex items-center justify-center shrink-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 text-zinc-400">
                      <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                      <span className="text-xs font-semibold opacity-50 uppercase">{p.name.substring(0, 2)}</span>
                    </div>
                  )}
                </div>
                {/* Info do Produto */}
                <div className="p-2 flex flex-col justify-between flex-1">
                  <span className="font-semibold text-sm leading-tight line-clamp-2">{p.name}</span>
                  <span className="font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.sellPrice)}
                  </span>
                </div>
              </div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full h-40 flex items-center justify-center text-zinc-400">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Direita: Carrinho Fixo (35%) */}
      <Card className="w-full lg:w-[400px] xl:w-[450px] flex flex-col h-full shadow-lg border-0 lg:border">
        <CardHeader className="py-4 border-b bg-zinc-50 dark:bg-zinc-900 rounded-t-lg">
          <CardTitle className="flex justify-between items-center text-lg">
            <div className="flex items-center"><ShoppingCart className="mr-2 h-5 w-5 text-primary" /> Pedido Atual</div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                Limpar
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-6 text-center space-y-3">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                <ShoppingCart className="h-10 w-10 text-zinc-300" />
              </div>
              <p>Adicione produtos ao carrinho<br/>para iniciar a venda</p>
            </div>
          ) : (
            <div className="divide-y">
              {cart.map((item, index) => (
                <div key={index} className="flex flex-col p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium pr-2">{item.product.name}</span>
                    <span className="font-bold whitespace-nowrap">
                      R$ {(item.product.sellPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">R$ {item.product.sellPrice.toFixed(2)} / {item.product.unit}</span>
                    
                    {/* Controles de Quantidade Arredondados */}
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
                      <button 
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-zinc-700 shadow-sm text-zinc-600 dark:text-zinc-300 hover:text-red-500 transition-colors"
                        onClick={() => item.quantity > 1 ? updateQuantity(item.product.id, -1) : removeFromCart(item.product.id)}
                      >
                        {item.quantity === 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-zinc-700 shadow-sm text-zinc-600 dark:text-zinc-300 hover:text-primary transition-colors"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <div className="border-t bg-zinc-50 dark:bg-zinc-900 p-4 space-y-3 rounded-b-lg">
          <div className="flex justify-between text-zinc-500 text-sm">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-500 text-sm">
            <span>Desconto</span>
            <div className="flex items-center gap-1 w-24">
              <span>R$</span>
              <Input className="h-7 text-right text-sm" type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="pt-2 border-t flex justify-between items-end">
            <span className="font-medium text-lg">Total</span>
            <span className="font-black text-3xl text-primary">R$ {total.toFixed(2)}</span>
          </div>
          
          <Button 
            className="w-full h-16 text-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg mt-2 transition-all hover:scale-[1.02]" 
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            Cobrar
          </Button>
        </div>
      </Card>

      {/* Modal de Pagamento */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Pagamento</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Formas de Pagamento e Entrada */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "DINHEIRO", icon: Banknote, label: "Dinheiro" },
                  { id: "PIX", icon: QrCode, label: "PIX" },
                  { id: "DEBITO", icon: CreditCard, label: "Débito" },
                  { id: "CREDITO", icon: CreditCard, label: "Crédito" },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      selectedMethod === method.id 
                        ? "bg-primary/10 border-primary text-primary shadow-sm" 
                        : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <method.icon className="h-6 w-6 mb-2" />
                    <span className="font-semibold text-sm">{method.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-zinc-500">Valor Recebido (R$)</label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    step="0.01" 
                    className="text-xl font-bold h-12" 
                    value={paymentAmount || ""} 
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)} 
                    onKeyDown={(e) => { if(e.key === 'Enter') addPayment(); }}
                  />
                  <Button className="h-12 w-12 shrink-0" onClick={addPayment} disabled={paymentAmount <= 0}>
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Notas Rápidas para Dinheiro */}
              {selectedMethod === "DINHEIRO" && (
                <div className="flex gap-2 justify-between">
                  {[10, 20, 50, 100].map(val => (
                    <Button key={val} variant="outline" className="flex-1" onClick={() => addQuickCash(val)}>
                      R$ {val}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo do Pagamento */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col border">
              <div className="text-center mb-4">
                <p className="text-sm text-zinc-500 font-medium">Total a Pagar</p>
                <p className="text-4xl font-black text-primary mt-1">R$ {total.toFixed(2)}</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px]">
                {payments.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-white dark:bg-zinc-800 rounded-lg text-sm border shadow-sm">
                    <span className="font-bold text-zinc-600 dark:text-zinc-300">{p.method}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">R$ {p.amount.toFixed(2)}</span>
                      <button className="text-red-500 hover:text-red-700 p-1" onClick={() => removePayment(i)}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="text-center text-sm text-zinc-400 pt-8">
                    Nenhum pagamento informado
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t space-y-2">
                {change > 0 ? (
                  <div className="flex justify-between items-center text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded-lg border border-green-200 dark:border-green-900">
                    <span className="font-bold text-lg">Troco</span>
                    <span className="font-black text-2xl">R$ {change.toFixed(2)}</span>
                  </div>
                ) : remaining > 0 ? (
                  <div className="flex justify-between items-center text-red-500">
                    <span className="font-medium">Falta Receber</span>
                    <span className="font-bold text-xl">R$ {remaining.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="font-medium">Pago</span>
                    <span className="font-bold text-xl">Completo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="border-t pt-4 sm:justify-between">
            <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)}>Voltar</Button>
            <Button 
              className="w-1/2 h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white" 
              disabled={totalPaid < total || isProcessing}
              onClick={handleCheckout}
            >
              {isProcessing ? "Processando..." : "Confirmar Venda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
