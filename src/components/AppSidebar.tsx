import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, FileText, LogOut, Menu, X, Building2, ChevronDown, Brain } from "lucide-react";
import { useState } from "react";
import { useClient } from "@/contexts/ClientContext";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/insights", label: "Inteligência IA", icon: Brain },
  { to: "/transactions", label: "Movimentação", icon: ArrowLeftRight },
  { to: "/reports", label: "Relatórios", icon: FileText },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { selectedClient, clearClient } = useClient();

  const handleSwitchClient = () => {
    clearClient();
    navigate("/select-client");
  };

  const sidebarContent = (
    <>
      <div className="p-5 pb-4 flex justify-center">
        <img src={logo} alt="Clarté" className="h-32 object-contain brightness-0 invert opacity-90" />
      </div>

      {/* Selected Client */}
      {selectedClient && (
        <div className="px-3 pb-4">
          <button
            onClick={handleSwitchClient}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/60 border border-sidebar-border hover:bg-sidebar-accent transition-colors text-left group"
          >
            <Building2 size={16} className="text-gold shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">{selectedClient.name}</p>
              <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">{selectedClient.cnpj}</p>
            </div>
            <ChevronDown size={14} className="text-sidebar-foreground/40 group-hover:text-gold transition-colors" />
          </button>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-gold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-sidebar-foreground/70 hover:text-destructive transition-colors"
        >
          <LogOut size={18} />
          Sair
        </Link>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card shadow-md border border-border text-foreground"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AppSidebar;
