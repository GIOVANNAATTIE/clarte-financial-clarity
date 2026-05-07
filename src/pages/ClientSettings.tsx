import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClient } from "@/contexts/ClientContext";
import {
  Users, Shield, Brain, CreditCard, Plus, Trash2, Settings2,
  Eye, EyeOff, Edit, Lock, Upload, Building, Mail,
  RefreshCw, Pencil, CheckCircle2, UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

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

const defaultModules: ModuleConfig[] = [
  { id: "dashboard", nome: "Dashboard", ativo: true, permissoes: { ver: true, editar: true, admin: true } },
  { id: "insights", nome: "Inteligência IA", ativo: true, permissoes: { ver: true, editar: false, admin: false } },
  { id: "movimentacao", nome: "Movimentação", ativo: true, permissoes: { ver: true, editar: true, admin: false } },
  { id: "lancamentos", nome: "Lançamentos", ativo: true, permissoes: { ver: true, editar: true, admin: false } },
  { id: "relatorios", nome: "Relatórios", ativo: true, permissoes: { ver: true, editar: false, admin: false } },
];

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  operador: "Operacional",
  visualizador: "Visualizador",
};

const roleStyles: Record<UserRole, string> = {
  admin: "bg-gold/15 text-gold",
  operador: "bg-primary/15 text-primary",
  visualizador: "bg-muted text-muted-foreground",
};

const ClientSettings = () => {
  const { selectedClient, updateClient } = useClient();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Company data — pulled from Supabase by CNPJ/id
  const [companyData, setCompanyData] = useState({
    name: "",
    cnpj: "",
    segment: "",
    fantasy_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");

  // Users
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("operador");
  const [addingUser, setAddingUser] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<ClientUser | null>(null);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState<string | null>(null);

  // Modules
  const [modules, setModules] = useState(defaultModules);
  const [tokensPerMonth, setTokensPerMonth] = useState("50000");
  const [contasPagar, setContasPagar] = useState(true);
  const [contasReceber, setContasReceber] = useState(true);
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [aiApiKey, setAiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Load company data from Supabase when component mounts
  useEffect(() => {
    if (!selectedClient?.id) return;
    loadCompanyData();
    loadCurrentUser();
  }, [selectedClient?.id]);

  const loadCompanyData = async () => {
    if (!selectedClient?.id) return;
    setLoadingCompany(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", selectedClient.id)
      .single();

    if (data) {
      setCompanyData({
        name: data.name || "",
        cnpj: data.cnpj || "",
        segment: data.segment || "",
        fantasy_name: (data as any).fantasy_name || "",
        email: (data as any).email || "",
        phone: (data as any).phone || "",
        address: (data as any).address || "",
        city: (data as any).city || "",
        state: (data as any).state || "",
        zip_code: (data as any).zip_code || "",
      });
      setLogoPreview((data as any).logo_url || selectedClient.logoUrl || "");
    }
    setLoadingCompany(false);
  };

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUsers([{
        id: user.id,
        nome: user.user_metadata?.full_name || user.email?.split("@")[0] || "Administrador",
        email: user.email || "",
        role: "admin",
        ativo: true,
      }]);
    }
  };

  const handleSaveCompany = async () => {
    if (!selectedClient?.id) return;
    setSavingCompany(true);
    const { error } = await supabase
      .from("companies")
      .update({
        name: companyData.name,
        fantasy_name: companyData.fantasy_name || null,
        segment: companyData.segment || null,
        email: companyData.email || null,
        phone: companyData.phone || null,
        address: companyData.address || null,
        city: companyData.city || null,
        state: companyData.state || null,
        zip_code: companyData.zip_code || null,
      } as any)
      .eq("id", selectedClient.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      updateClient({ ...selectedClient, name: companyData.name, segment: companyData.segment });
      toast({ title: "Dados da empresa salvos!" });
    }
    setSavingCompany(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClient?.id) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Apenas imagens são aceitas", variant: "destructive" });
      return;
    }

    // Convert to base64 for preview and storage
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setLogoPreview(base64);

      // Save logo_url to companies table
      const { error } = await supabase
        .from("companies")
        .update({ logo_url: base64 } as any)
        .eq("id", selectedClient.id);

      if (error) {
        toast({ title: "Erro ao salvar logo", variant: "destructive" });
      } else {
        updateClient({ ...selectedClient, logoUrl: base64 });
        toast({ title: "Logo salvo com sucesso!" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (!selectedClient?.id) return;
    await supabase.from("companies").update({ logo_url: null } as any).eq("id", selectedClient.id);
    setLogoPreview("");
    updateClient({ ...selectedClient, logoUrl: "" });
    toast({ title: "Logo removido" });
  };

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail) return;
    setAddingUser(true);

    // Send password reset email so user can set their password
    const { error } = await supabase.auth.resetPasswordForEmail(newUserEmail, {
      redirectTo: `${window.location.origin}/`,
    });

    const newUser: ClientUser = {
      id: Date.now().toString(),
      nome: newUserName,
      email: newUserEmail,
      role: newUserRole,
      ativo: false,
    };
    setUsers(prev => [...prev, newUser]);
    toast({
      title: "Usuário adicionado!",
      description: error
        ? `Usuário criado. Envie o link de acesso manualmente para ${newUserEmail}.`
        : `E-mail com instruções de acesso enviado para ${newUserEmail}.`,
    });
    setNewUserName(""); setNewUserEmail(""); setNewUserRole("operador");
    setNewUserOpen(false);
    setAddingUser(false);
  };

  const handleSendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) {
      toast({ title: "Erro ao enviar e-mail", variant: "destructive" });
    } else {
      setResetEmailSent(email);
      toast({ title: "Link de acesso enviado!", description: `E-mail enviado para ${email}` });
    }
  };

  const handleSaveEditUser = () => {
    if (!editUser) return;
    setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u));
    setEditUserOpen(false);
    setEditUser(null);
    toast({ title: "Usuário atualizado" });
  };

  const handleDeleteUser = () => {
    if (!deleteUserId) return;
    setUsers(prev => prev.filter(u => u.id !== deleteUserId));
    setDeleteUserOpen(false);
    setDeleteUserId(null);
    toast({ title: "Usuário removido" });
  };

  const toggleModule = (id: string) =>
    setModules(modules.map(m => m.id === id ? { ...m, ativo: !m.ativo } : m));

  const togglePermission = (moduleId: string, perm: "ver" | "editar" | "admin") =>
    setModules(modules.map(m => m.id === moduleId
      ? { ...m, permissoes: { ...m.permissoes, [perm]: !m.permissoes[perm] } }
      : m
    ));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedClient?.name || "Nenhuma empresa selecionada"} — Perfil e permissões
        </p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="perfil" className="gap-2"><Building size={14} /> Empresa</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users size={14} /> Usuários</TabsTrigger>
          <TabsTrigger value="modules" className="gap-2"><Shield size={14} /> Módulos</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2"><Brain size={14} /> IA & Tokens</TabsTrigger>
          <TabsTrigger value="billing" className="gap-2"><CreditCard size={14} /> Financeiro</TabsTrigger>
        </TabsList>

        {/* ===== EMPRESA ===== */}
        <TabsContent value="perfil" className="space-y-4 mt-4">
          {/* Logo */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-semibold text-foreground mb-1">Logo da Empresa</h3>
            <p className="text-xs text-muted-foreground mb-4">Aparece nos relatórios e exportações gerados pelo sistema.</p>
            <div className="flex items-center gap-6">
              <div>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-24 h-24 rounded-xl object-contain border-2 border-border bg-muted/30" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <Upload size={28} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" className="gap-2" onClick={() => logoInputRef.current?.click()}>
                  <Upload size={14} /> {logoPreview ? "Trocar Logo" : "Enviar Logo"}
                </Button>
                {logoPreview && (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive block" onClick={handleRemoveLogo}>
                    Remover Logo
                  </Button>
                )}
                <p className="text-[10px] text-muted-foreground">PNG, JPG ou SVG. Recomendado: 512x512px</p>
              </div>
            </div>
          </div>

          {/* Company Data */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Dados da Empresa</h3>
              {loadingCompany && <RefreshCw size={14} className="animate-spin text-muted-foreground" />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Razão Social</Label>
                <Input value={companyData.name} onChange={e => setCompanyData({ ...companyData, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Nome Fantasia</Label>
                <Input value={companyData.fantasy_name} onChange={e => setCompanyData({ ...companyData, fantasy_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input value={companyData.cnpj} disabled className="bg-muted/50 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label>Segmento / Atividade</Label>
                <Input value={companyData.segment} onChange={e => setCompanyData({ ...companyData, segment: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={companyData.email} onChange={e => setCompanyData({ ...companyData, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={companyData.phone} onChange={e => setCompanyData({ ...companyData, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Endereço</Label>
                <Input value={companyData.address} onChange={e => setCompanyData({ ...companyData, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input value={companyData.city} onChange={e => setCompanyData({ ...companyData, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Input value={companyData.state} maxLength={2} placeholder="UF" onChange={e => setCompanyData({ ...companyData, state: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>CEP</Label>
                <Input value={companyData.zip_code} onChange={e => setCompanyData({ ...companyData, zip_code: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <Button onClick={handleSaveCompany} disabled={savingCompany} className="gap-2">
                {savingCompany ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Salvar Dados
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ===== USUÁRIOS ===== */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Membros da Equipe</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Gerencie quem tem acesso ao sistema e com qual nível de permissão.</p>
            </div>
            <Button className="gap-2" onClick={() => setNewUserOpen(true)}>
              <UserPlus size={16} /> Adicionar Usuário
            </Button>
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
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{u.nome}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">{u.email}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${roleStyles[u.role]}`}>
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${u.ativo ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {u.ativo ? "Ativo" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Enviar link de acesso"
                          onClick={() => handleSendPasswordReset(u.email)}>
                          {resetEmailSent === u.email
                            ? <CheckCircle2 size={14} className="text-success" />
                            : <Mail size={14} />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"
                          onClick={() => { setEditUser({ ...u }); setEditUserOpen(true); }}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Excluir"
                          onClick={() => { setDeleteUserId(u.id); setDeleteUserOpen(true); }}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum usuário cadastrado</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              {users.length} usuário(s) · Ícone <Mail size={11} className="inline" /> = envia link "Redefinir senha"
            </div>
          </div>
        </TabsContent>

        {/* ===== MÓDULOS ===== */}
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
                {modules.map(m => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground flex items-center gap-2">
                      <Settings2 size={14} className="text-muted-foreground" />{m.nome}
                    </td>
                    <td className="px-5 py-3.5 text-center"><Switch checked={m.ativo} onCheckedChange={() => toggleModule(m.id)} /></td>
                    <td className="px-5 py-3.5 text-center"><Switch checked={m.permissoes.ver} onCheckedChange={() => togglePermission(m.id, "ver")} disabled={!m.ativo} /></td>
                    <td className="px-5 py-3.5 text-center"><Switch checked={m.permissoes.editar} onCheckedChange={() => togglePermission(m.id, "editar")} disabled={!m.ativo} /></td>
                    <td className="px-5 py-3.5 text-center"><Switch checked={m.permissoes.admin} onCheckedChange={() => togglePermission(m.id, "admin")} disabled={!m.ativo} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ===== IA ===== */}
        <TabsContent value="ai" className="space-y-4 mt-4">
          <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gold/10"><Brain size={24} className="text-gold" /></div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Limite de Tokens por Mês</h3>
                  <p className="text-xs text-muted-foreground mt-1">Define quantos tokens de IA podem ser consumidos mensalmente</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input type="number" value={tokensPerMonth} onChange={e => setTokensPerMonth(e.target.value)} className="w-48" />
                  <span className="text-sm text-muted-foreground">tokens/mês</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["10000", "25000", "50000", "100000"].map(v => (
                    <Button key={v} variant={tokensPerMonth === v ? "default" : "outline"} size="sm" onClick={() => setTokensPerMonth(v)}>
                      {Number(v).toLocaleString("pt-BR")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10"><Lock size={24} className="text-primary" /></div>
              <div className="flex-1 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Chave de API — Inteligência Artificial</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Provedor</Label>
                    <Select value={aiProvider} onValueChange={setAiProvider}>
                      <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input type={showApiKey ? "text" : "password"} value={aiApiKey}
                        onChange={e => setAiApiKey(e.target.value)}
                        placeholder={aiProvider === "openai" ? "sk-..." : "sk-ant-..."}
                        className="flex-1 font-mono text-sm" />
                      <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={() => toast({ title: "API Key salva com sucesso" })} disabled={!aiApiKey} className="gap-2">
                    <Lock size={14} /> Salvar API Key
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ===== FINANCEIRO ===== */}
        <TabsContent value="billing" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Contas a Pagar</h3>
                  <p className="text-xs text-muted-foreground mt-1">Habilitar módulo de contas a pagar</p>
                </div>
                <Switch checked={contasPagar} onCheckedChange={setContasPagar} />
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Contas a Receber</h3>
                  <p className="text-xs text-muted-foreground mt-1">Habilitar módulo de contas a receber</p>
                </div>
                <Switch checked={contasReceber} onCheckedChange={setContasReceber} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== MODAL: NOVO USUÁRIO ===== */}
      <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus size={18} /> Adicionar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              O usuário receberá um e-mail para definir sua senha e acessar o sistema.
            </p>
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input placeholder="Ex: Maria Silva" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail de login</Label>
              <Input type="email" placeholder="maria@empresa.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nível de acesso</Label>
              <Select value={newUserRole} onValueChange={v => setNewUserRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div>
                      <p className="font-medium">Administrador</p>
                      <p className="text-xs text-muted-foreground">Acesso total — pode excluir, configurar e gerenciar</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="operador">
                    <div>
                      <p className="font-medium">Operacional</p>
                      <p className="text-xs text-muted-foreground">Pode lançar e editar, sem acesso a configurações</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="visualizador">
                    <div>
                      <p className="font-medium">Visualizador</p>
                      <p className="text-xs text-muted-foreground">Apenas leitura — não pode criar nem excluir</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setNewUserOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddUser} disabled={!newUserName || !newUserEmail || addingUser} className="gap-2">
                {addingUser ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Adicionar e Enviar Convite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL: EDITAR USUÁRIO ===== */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          {editUser && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5"><Label>Nome</Label><Input value={editUser.nome} onChange={e => setEditUser({ ...editUser, nome: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>E-mail</Label><Input value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Perfil</Label>
                <Select value={editUser.role} onValueChange={v => setEditUser({ ...editUser, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="operador">Operacional</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editUser.ativo} onCheckedChange={v => setEditUser({ ...editUser, ativo: v })} />
                <Label>Usuário ativo</Label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditUserOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveEditUser}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== MODAL: EXCLUIR USUÁRIO ===== */}
      <Dialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Remover Usuário</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover este usuário? Ele perderá o acesso ao sistema.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteUserOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientSettings;
