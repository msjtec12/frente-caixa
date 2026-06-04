"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, LayoutDashboard, Users, Package, Settings, FileText, ShoppingCart, Receipt, Tags } from "lucide-react";
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="h-full border-r bg-zinc-50 dark:bg-zinc-950 flex flex-col w-64 fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b">
        <Store className="h-6 w-6 text-primary mr-2" />
        <h1 className="font-bold text-xl tracking-tight">Konnexy PDV</h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
        {routes.map((route) => (
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
    </div>
  );
}
