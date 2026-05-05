import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClient } from "@/contexts/ClientContext";
import { Users, Shield, Brain, CreditCard, Plus, Trash2, Settings2, Eye, Edit, Lock } from "lucide-react";

type UserRole = "admin" | "operador" | "visualizador";

type ClientUser = {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
};

type ModuleConfig = {
  id: string;
  nome: string;
  ativo: boolean;
  permissoes: { ver: boolean; editar: boolean; admin: boolean };
};

const mockUsers: ClientUser[] = [
  { id: "1", nome: "João Silva", email: "joao@empresa.com", role: "admin", ativo: true },
  { id: "2", nome: "Maria Santos", email: "maria@empresa.com", role: "operador", ativo: true },
  { id: "3", nome: "Pedro Souza", email: "pedro@empresa.com", role: "visualizador", ativo: false },
];

const defaultModules: ModuleConfig[] = [
  { id: "dashboard", nome: "Dashboard", ativo: true, permissoes: { ver: true, editar: true, admin: true } },
  { id: "insights", nome: "Inteligência IA", ativo: true, permissoes: { ver: true, editar: false, admin: false } },
  { id: "movimentacao", nome: "Movimentação", ativo: true, permissoes: { ver: true, editar: true, admin: false } },
  { id: "lancamentos", nome: "Lançamentos", ativo: true, permissoes: { ver: true, editar: true, admin: false } },
  { id: "relatorios", nome: "Relatórios", ativo: true, permissoes: { ver: true, editar: false, admin: false } },
  { id: "contas_pagar", nome: "Contas a Pagar", ativo: true, permissoes: { ver: true, editar: true, admin: false } },
  { id: "contas_receber", nome: "Contas a Receber", ativo: true, permissoes: { ver: true, editar: true, admin: false } },
];

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  operador: "Operador",
  visualizador: "Visualizador",
};

const roleStyles: Record<UserRole, string> = {
  admin: "bg-gold/15 text-gold",
  operador: "bg-primary/15 text-primary",
  visualizador: "bg-muted text-muted-foreground",
};

const ClientSettings = () => {
  const { selectedClient } = useClient();
  const [users, setUsers] = useState(mockUsers);
  const [modules, setModules] = useState(defaultModules);
  const [tokensPerMonth, setTokensPerMonth] = useState("50000");
  const [contasPagar, setContasPagar] = useState(true);
  const [contasReceber, setContasReceber] = useState(true);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("operador");

  const handleAddUser = () => {
    if (!newUserName || !newUserEmail) return;
    setUsers([...users, { id: Date.now().toString(), nome: newUserName, email: newUserEmail, role: newUserRole, ativo: true }]);
    setNewUserName(""); setNewUserEmail("");
  };

  const handleRemoveUser = (id: string) => setUsers(users.filter(u => u.id !== id));

  const toggleModule = (id: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, ativo: !m.ativo } : m));
  };

  const togglePermission = (moduleId: string, perm: "ver" | "editar" | "admin") => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, permissoes: { ...m.permissoes, [perm]: !m.permissoes[perm] } } : m));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Configurações do Cliente</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedClient ? selectedClient.name : "Nenhum cliente selecionado"} — Perfil e permissões
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="users" className="gap-2"><Users size={14} /> Usuários</TabsTrigger>
          <TabsTrigger value="modules" className="gap-2"><Shield size={14} /> Módulos</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2"><Brain size={14} /> IA & Tokens</TabsTrigger>
          <TabsTrigger value="billing" className="gap-2"><CreditCard size={14} /> Financeiro</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-semibold text-foreground mb-4">Adicionar Usuário</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="Nome" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="flex-1" />
              <Input placeholder="E-mail" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="flex-1" />
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="visualizador">Visualizador</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddUser} disabled={!newUserName || !newUserEmail} className="gap-2">
                <Plus size={16} /> Adicionar
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Usuário</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden sm:table-cell">E-mail</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Perfil</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{u.nome}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">{u.email}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${roleStyles[u.role]}`}>
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${u.ativo ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveUser(u.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4 mt-4">
          <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Módulo</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Ativo</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    <span className="inline-flex items-center gap-1"><Eye size={12} /> Ver</span>
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    <span className="inline-flex items-center gap-1"><Edit size={12} /> Editar</span>
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    <span className="inline-flex items-center gap-1"><Lock size={12} /> Admin</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground flex items-center gap-2">
                      <Settings2 size={14} className="text-muted-foreground" />
                      {m.nome}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Switch checked={m.ativo} onCheckedChange={() => toggleModule(m.id)} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Switch checked={m.permissoes.ver} onCheckedChange={() => togglePermission(m.id, "ver")} disabled={!m.ativo} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Switch checked={m.permissoes.editar} onCheckedChange={() => togglePermission(m.id, "editar")} disabled={!m.ativo} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Switch checked={m.permissoes.admin} onCheckedChange={() => togglePermission(m.id, "admin")} disabled={!m.ativo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* AI & Tokens Tab */}
        <TabsContent value="ai" className="space-y-4 mt-4">
          <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gold/10">
                <Brain size={24} className="text-gold" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Limite de Tokens por Mês</h3>
                  <p className="text-xs text-muted-foreground mt-1">Define quantos tokens de IA este cliente pode consumir mensalmente</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input type="number" value={tokensPerMonth} onChange={(e) => setTokensPerMonth(e.target.value)} className="w-48" />
                  <span className="text-sm text-muted-foreground">tokens/mês</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["10000", "25000", "50000", "100000"].map((v) => (
                    <Button key={v} variant={tokensPerMonth === v ? "default" : "outline"} size="sm" onClick={() => setTokensPerMonth(v)}>
                      {Number(v).toLocaleString("pt-BR")}
                    </Button>
                  ))}
                </div>
                <div className="bg-muted/30 rounded-lg p-4 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uso atual</span>
                    <span className="font-medium text-foreground">12.450 / {Number(tokensPerMonth).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="bg-gold h-2 rounded-full transition-all" style={{ width: `${Math.min((12450 / Number(tokensPerMonth)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Contas a Pagar</h3>
                  <p className="text-xs text-muted-foreground mt-1">Habilitar módulo de contas a pagar para este cliente</p>
                </div>
                <Switch checked={contasPagar} onCheckedChange={setContasPagar} />
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Contas a Receber</h3>
                  <p className="text-xs text-muted-foreground mt-1">Habilitar módulo de contas a receber para este cliente</p>
                </div>
                <Switch checked={contasReceber} onCheckedChange={setContasReceber} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientSettings;
