import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Home, CreditCard, TrendingUp, DollarSign, FileText, BarChart3, Settings } from "lucide-react";
import { useState } from "react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";

interface FinanceDashboardLayoutProps {
  children: React.ReactNode;
}

export default function FinanceDashboardLayout({ children }: FinanceDashboardLayoutProps) {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{APP_TITLE}</h1>
          <p className="text-muted-foreground mb-6">Faça login para acessar o sistema</p>
          <Button onClick={() => window.location.href = getLoginUrl()} size="lg">
            Entrar com Manus
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: Home, href: "/" },
    { label: "Contas", icon: CreditCard, href: "/accounts" },
    { label: "Contas a Pagar", icon: DollarSign, href: "/payables" },
    { label: "Contas a Receber", icon: TrendingUp, href: "/receivables" },
    { label: "Fluxo de Caixa", icon: BarChart3, href: "/cash-flow" },
    { label: "Relatórios", icon: FileText, href: "/reports" },
    { label: "Configurações", icon: Settings, href: "/settings" },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="w-8 h-8" />}
              <span className="font-bold text-sm truncate">{APP_TITLE}</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-accent rounded-md transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-foreground"
                }`}
                title={item.label}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          {sidebarOpen && (
            <div className="mb-3 p-2 bg-accent rounded-md">
              <p className="text-xs font-medium truncate">{user?.name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={logout}
          >
            <LogOut size={16} />
            {sidebarOpen && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            {navItems.find((item) => isActive(item.href))?.label || "Dashboard"}
          </h1>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
