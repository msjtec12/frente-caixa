"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Menu, Store, LayoutDashboard, Users, Package, Settings, FileText, ShoppingCart, Receipt, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Frente de Caixa", icon: ShoppingCart, href: "/pdv" },
  { label: "Controle de Caixa", icon: Receipt, href: "/cash-register" },
  { label: "Produtos", icon: Package, href: "/products" },
  { label: "Categorias", icon: Tags, href: "/categories" },
  { label: "Clientes", icon: Users, href: "/customers" },
  { label: "Despesas", icon: FileText, href: "/expenses" },
  { label: "Relatórios", icon: FileText, href: "/reports" },
  { label: "Configurações", icon: Settings, href: "/settings" },
];

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role || "CASHIER";

  const [isOpen, setIsOpen] = useState(false);

  const filteredRoutes = routes.filter(route => {
    if (role === "CASHIER") return route.href === "/pdv";
    return true;
  });

  return (
    <header className="h-16 border-b bg-white dark:bg-zinc-950 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center">
        {/* Mobile Menu Trigger */}
        <div className="md:hidden mr-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <SheetContent side="left" className="p-0 w-64">
              <SheetHeader className="p-0 text-left border-b">
                 <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                 <div className="h-16 flex items-center px-6">
                   <Store className="h-6 w-6 text-primary mr-2" />
                   <h1 className="font-bold text-xl tracking-tight">Konnexy PDV</h1>
                 </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
                {filteredRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                      pathname === route.href || pathname.startsWith(route.href + '/') ? "text-primary bg-primary/10" : "text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    <div className="flex items-center flex-1">
                      <route.icon className="h-5 w-5 mr-3" />
                      {route.label}
                    </div>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <span className="text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Olá, {session?.user?.name || "Usuário"}
        </span>
        <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </Button>
      </div>
    </header>
  );
}
