import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full relative">
      <Sidebar />
      <main className="md:pl-64 h-full">
        <Header />
        <div className="p-6 h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
