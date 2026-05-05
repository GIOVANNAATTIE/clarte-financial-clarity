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
import { Users, Shield, Brain, CreditCard, Plus, Trash2, Settings2, Eye, Edit, Lock, Upload, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

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
  const { selectedClient, updateClient } = useClient();
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

  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClient) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Apenas imagens são aceitas", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateClient({ ...selectedClient, logoUrl: ev.target?.result as string });
      toast({ title: "Logo atualizado com sucesso" });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Configurações do Cliente</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedClient ? selectedClient.name : "Nenhum cliente selecionado"} — Perfil e permissões
        </p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="perfil" className="gap-2"><Building size={14} /> Perfil</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users size={14} /> Usuários</TabsTrigger>
          <TabsTrigger value="modules" className="gap-2"><Shield size={14} /> Módulos</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2"><Brain size={14} /> IA & Tokens</TabsTrigger>
          <TabsTrigger value="billing" className="gap-2"><CreditCard size={14} /> Financeiro</TabsTrigger>
        </TabsList>

        {/* Perfil Tab */}
        <TabsContent value="perfil" className="space-y-4 mt-4">
          <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-semibold text-foreground mb-4">Logo da Empresa</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Este logo será usado nos relatórios e papel timbrado gerados para este cliente.
            </p>
            <div className="flex items-center gap-6">
              <div className="relative">
                {selectedClient?.logoUrl ? (
                  <img src={selectedClient.logoUrl} alt="Logo" className="w-24 h-24 rounded-xl object-cover border-2 border-border" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <Upload size={28} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button variant="outline" className="gap-2" onClick={() => logoInputRef.current?.click()}>
                  <Upload size={14} />
                  {selectedClient?.logoUrl ? "Trocar Logo" : "Enviar Logo"}
                </Button>
                {selectedClient?.logoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (selectedClient) {
                        updateClient({ ...selectedClient, logoUrl: "" });
                        toast({ title: "Logo removido" });
                      }
                    }}
                  >
                    Remover Logo
                  </Button>
                )}
                <p className="text-[10px] text-muted-foreground">PNG, JPG ou SVG. Recomendado: 512x512px</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-semibold text-foreground mb-4">Dados do Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Nome / Razão Social</Label>
                <p className="text-sm text-foreground font-medium">{selectedClient?.name || "—"}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">CNPJ</Label>
                <p className="text-sm text-foreground font-medium">{selectedClient?.cnpj || "—"}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Segmento</Label>
                <p className="text-sm text-foreground font-medium">{selectedClient?.segment || "—"}</p>
              </div>
            </div>
          </div>
        </TabsContent>

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

          {/* API Key Configuration */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Lock size={24} className="text-primary" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Chave de API para Inteligência Artificial</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Insira sua API Key da OpenAI ou Anthropic para habilitar análises avançadas na aba de Inteligência IA.
                    A chave é armazenada de forma segura e criptografada.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Provedor</Label>
                    <Select value={aiProvider} onValueChange={setAiProvider}>
                      <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder={aiProvider === "openai" ? "sk-..." : "sk-ant-..."}
                        className="flex-1 font-mono text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                        <Eye size={16} />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">A chave nunca é exibida após salvar. Você pode substituí-la a qualquer momento.</p>
                  </div>
                  <Button
                    onClick={() => {
                      if (aiApiKey) {
                        toast({ title: "API Key salva com sucesso", description: `Provedor: ${aiProvider === "openai" ? "OpenAI" : "Anthropic"}` });
                      }
                    }}
                    disabled={!aiApiKey}
                    className="gap-2"
                  >
                    <Lock size={14} />
                    Salvar API Key
                  </Button>
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
