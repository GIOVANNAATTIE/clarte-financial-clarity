import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, FileText, LogOut } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/upload", label: "Extratos", icon: Upload },
  { to: "/reports", label: "Relatórios", icon: FileText },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-secondary flex flex-col" style={{ background: "var(--gradient-dark)" }}>
      <div className="p-6">
        <h1 className="font-heading text-2xl font-bold text-primary">Clarté</h1>
        <p className="text-xs text-sidebar-foreground mt-1">Sistema Financeiro</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} className="relative block">
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "text-primary" : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-sidebar-foreground hover:text-destructive transition-colors"
        >
          <LogOut size={18} />
          Sair
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
