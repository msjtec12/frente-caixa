"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingCart, Plus, Minus, Trash2, Image as ImageIcon, Store, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import Link from "next/link";

interface CartItem {
  product: any;
  quantity: number;
}

export function CatalogClient({ products, categories }: { products: any[], categories: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filtro
  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory !== "all") {
      result = result.filter(p => p.categoryId === selectedCategory);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower));
    }
    return result;
  }, [searchTerm, selectedCategory, products]);

  // Carrinho
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.product.sellPrice * item.quantity), 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  // Pedido WhatsApp
  const handleWhatsAppOrder = () => {
    const phoneNumber = "5511999999999"; // TODO: Ideal seria pegar do cadastro da Company
    let text = `*Novo Pedido - Catálogo Virtual*\n\n`;
    
    cart.forEach(item => {
      text += `${item.quantity}x ${item.product.name} - R$ ${(item.product.sellPrice * item.quantity).toFixed(2)}\n`;
    });
    
    text += `\n*Total do Pedido: R$ ${total.toFixed(2)}*`;
    text += `\n\nPor favor, me informe o tempo de entrega e opções de pagamento.`;
    
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedText}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Header Público */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">Nosso Catálogo</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hidden sm:block">
              Área do Lojista
            </Link>
            
            <Button onClick={() => setIsCartOpen(true)} className="relative bg-primary text-primary-foreground hover:bg-primary/90">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Carrinho
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
            
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                  <SheetTitle>Seu Pedido</SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto py-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3">
                      <ShoppingCart className="h-12 w-12 text-zinc-300" />
                      <p>Seu carrinho está vazio.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {cart.map((item) => (
                        <div key={item.product.id} className="py-4 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm pr-2">{item.product.name}</span>
                            <span className="font-bold whitespace-nowrap">R$ {(item.product.sellPrice * item.quantity).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-500">R$ {item.product.sellPrice.toFixed(2)} cada</span>
                            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
                              <button onClick={() => item.quantity > 1 ? updateQuantity(item.product.id, -1) : removeFromCart(item.product.id)} className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-zinc-700 shadow-sm text-zinc-600">
                                {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                              </button>
                              <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-zinc-700 shadow-sm text-zinc-600">
                                <Plus className="h-3 w-3 text-primary" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="font-medium text-lg">Total</span>
                    <span className="font-black text-3xl text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                  <Button 
                    className="w-full h-14 text-lg font-bold bg-green-500 hover:bg-green-600 text-white" 
                    disabled={cart.length === 0}
                    onClick={handleWhatsAppOrder}
                  >
                    Fazer Pedido <ExternalLink className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        
        {/* Banner / Boas Vindas */}
        <div className="bg-zinc-900 dark:bg-black rounded-2xl p-6 md:p-10 text-white text-center sm:text-left relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Faça seu pedido online!</h1>
            <p className="text-zinc-300 text-sm md:text-base">Navegue pelos nossos produtos, adicione ao carrinho e nos envie diretamente pelo WhatsApp de forma rápida e prática.</p>
          </div>
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
             <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-primary blur-[100px] rounded-full mix-blend-screen" />
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <Input 
              className="pl-10 h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" 
              placeholder="Buscar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-hide w-full md:w-auto">
            <Button 
              variant={selectedCategory === "all" ? "default" : "outline"} 
              className="rounded-full whitespace-nowrap h-12 px-6"
              onClick={() => setSelectedCategory("all")}
            >
              Todos
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className="rounded-full whitespace-nowrap h-12 px-6 bg-white dark:bg-zinc-900"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 w-full flex items-center justify-center overflow-hidden relative">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-zinc-300" />
                )}
                {/* Tag de Sem Estoque se for o caso */}
                {p.stock <= 0 && (
                   <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                     Esgotado
                   </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{p.name}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2">{p.description || "Sem descrição"}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-lg text-primary">
                    R$ {p.sellPrice.toFixed(2)}
                  </span>
                  <Button 
                    className="w-full h-10 font-bold" 
                    disabled={p.stock <= 0}
                    onClick={() => addToCart(p)}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full h-40 flex items-center justify-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-xl border border-dashed">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
        
      </main>
    </div>
  );
}
