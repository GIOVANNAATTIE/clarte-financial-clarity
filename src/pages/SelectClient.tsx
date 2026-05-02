import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { Input } from "@/components/ui/input";
import { Search, Building2, ChevronRight } from "lucide-react";
import logo from "@/assets/logo.png";

const SelectClient = () => {
  const { clients, selectClient } = useClient();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj.includes(search) ||
      c.segment.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (client: typeof clients[0]) => {
    selectClient(client);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <img src={logo} alt="Clarté Consultoria" className="h-32 mx-auto mb-4" />
          <h2 className="font-heading text-xl text-foreground">Olá, <span className="font-bold">Administrador</span></h2>
          <p className="text-sm text-muted-foreground mt-1">Selecione a empresa que deseja acessar</p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-elevated)] border border-border/50">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Buscar por nome, CNPJ ou segmento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 bg-background/50"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filtered.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelect(client)}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-gold/50 hover:bg-gold/5 transition-all duration-200 text-left group"
              >
                <div className="p-2.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <Building2 className="text-primary" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm text-foreground truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {client.cnpj} · {client.segment}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-gold transition-colors" />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum cliente encontrado</p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Clarté · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default SelectClient;
