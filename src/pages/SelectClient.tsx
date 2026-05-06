import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Building2, ChevronRight, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const cleanCnpj = (value: string) => value.replace(/\D/g, "");

type CompanyForm = {
  cnpj: string;
  name: string;
  fantasy_name: string;
  segment: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  email: string;
  phone: string;
};

const emptyForm = (): CompanyForm => ({
  cnpj: "", name: "", fantasy_name: "", segment: "",
  address: "", city: "", state: "", zip_code: "",
  email: "", phone: "",
});

const SelectClient = () => {
  const { clients, selectClient, fetchClients, addClient, deleteClient, loading } = useClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [newOpen, setNewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState("");
  const [situacao, setSituacao] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");

  useEffect(() => { fetchClients(); }, [fetchClients]);

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

  const handleCnpjChange = (value: string) => {
    const masked = formatCnpj(value);
    setForm(prev => ({ ...prev, cnpj: masked }));
    setCnpjError("");
    setDuplicateWarning("");
    setSituacao("");
  };

  const lookupCnpj = async () => {
    const digits = cleanCnpj(form.cnpj);
    if (digits.length !== 14) {
      setCnpjError("CNPJ deve ter 14 dígitos");
      return;
    }

    // Check duplicate in DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existing } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .eq("cnpj", formatCnpj(digits))
        .maybeSingle();
      if (existing) {
        setDuplicateWarning("Esta empresa já está cadastrada");
        return;
      }
    }

    setCnpjLoading(true);
    setCnpjError("");
    setDuplicateWarning("");
    setSituacao("");

    try {
      const res = await fetch(`https://publica.cnpj.ws/cnpj/${digits}`);
      if (res.status === 429) {
        setCnpjError("Muitas consultas. Aguarde um momento e tente novamente.");
        setCnpjLoading(false);
        return;
      }
      if (!res.ok) {
        setCnpjError("CNPJ não encontrado ou serviço indisponível");
        setCnpjLoading(false);
        return;
      }
      const data = await res.json();
      const est = data.estabelecimento || {};

      const razao = data.razao_social || "";
      const fantasia = est.nome_fantasia || razao;
      const atividade = est.atividade_principal?.descricao || "";
      const logradouro = [est.tipo_logradouro, est.logradouro, est.numero, est.complemento]
        .filter(Boolean).join(", ");
      const bairro = est.bairro || "";
      const fullAddress = [logradouro, bairro].filter(Boolean).join(" - ");
      const cidade = est.cidade?.nome || "";
      const estado = est.estado?.sigla || "";
      const cep = est.cep || "";
      const email = est.email || "";
      const phone = est.ddd1 && est.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : "";
      const sit = est.situacao_cadastral || "";

      setForm(prev => ({
        ...prev,
        name: razao,
        fantasy_name: fantasia,
        segment: atividade,
        address: fullAddress,
        city: cidade,
        state: estado,
        zip_code: cep,
        email,
        phone,
      }));

      if (sit && sit.toLowerCase() !== "ativa") {
        setSituacao(sit);
      }

      toast({ title: "Dados preenchidos automaticamente" });
    } catch {
      setCnpjError("Erro ao consultar CNPJ. Tente novamente.");
    }
    setCnpjLoading(false);
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    if (duplicateWarning) return;
    setSaving(true);
    await addClient({
      name: form.name,
      fantasy_name: form.fantasy_name,
      cnpj: form.cnpj || undefined,
      segment: form.segment,
      address: form.address,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code,
      email: form.email,
      phone: form.phone,
    });
    setForm(emptyForm());
    setCnpjError("");
    setDuplicateWarning("");
    setSituacao("");
    setNewOpen(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    await deleteClient(deleteId);
    setDeleteOpen(false);
    setDeleteId(null);
    setSaving(false);
  };

  const openNewModal = () => {
    setForm(emptyForm());
    setCnpjError("");
    setDuplicateWarning("");
    setSituacao("");
    setNewOpen(true);
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
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por nome, CNPJ ou segmento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-background/50"
              />
            </div>
            <Button variant="hero" size="default" className="gap-2" onClick={openNewModal}>
              <Plus size={16} /> Nova Empresa
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filtered.map((client) => (
                <div
                  key={client.id}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-gold/50 hover:bg-gold/5 transition-all duration-200 text-left group"
                >
                  <button
                    onClick={() => handleSelect(client)}
                    className="flex items-center gap-4 flex-1 min-w-0 text-left"
                  >
                    <div className="p-2.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                      <Building2 className="text-primary" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm text-foreground truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client.cnpj ? `${client.cnpj} · ` : ""}{client.segment || "Sem segmento"}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-gold transition-colors" />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    onClick={(e) => { e.stopPropagation(); setDeleteId(client.id); setDeleteOpen(true); }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {filtered.length === 0 && !loading && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {clients.length === 0 ? "Nenhuma empresa cadastrada. Crie uma para começar." : "Nenhum resultado encontrado"}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Clarté · Todos os direitos reservados
        </p>
      </div>

      {/* New Company Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* CNPJ with lookup */}
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <div className="flex gap-2">
                <Input
                  value={form.cnpj}
                  onChange={e => handleCnpjChange(e.target.value)}
                  onBlur={() => { if (cleanCnpj(form.cnpj).length === 14) lookupCnpj(); }}
                  placeholder="00.000.000/0001-00"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="default"
                  onClick={lookupCnpj}
                  disabled={cnpjLoading || cleanCnpj(form.cnpj).length !== 14}
                >
                  {cnpjLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  <span className="ml-1.5">Consultar</span>
                </Button>
              </div>
              {cnpjError && <p className="text-xs text-destructive">{cnpjError}</p>}
              {duplicateWarning && (
                <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 px-3 py-2 rounded-lg">
                  <AlertTriangle size={14} /> {duplicateWarning}
                </div>
              )}
              {situacao && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  <AlertTriangle size={14} /> Situação cadastral: {situacao}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Razão Social</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Razão Social" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nome Fantasia</Label>
                <Input value={form.fantasy_name} onChange={e => setForm({ ...form, fantasy_name: e.target.value })} placeholder="Nome Fantasia" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Segmento / Atividade Principal</Label>
                <Input value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })} placeholder="Ex: Tecnologia, Saúde..." />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Endereço</Label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Logradouro, número, bairro" />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} placeholder="UF" />
              </div>
              <div className="space-y-1.5">
                <Label>CEP</Label>
                <Input value={form.zip_code} onChange={e => setForm({ ...form, zip_code: e.target.value })} placeholder="00000-000" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd} disabled={saving || !form.name.trim() || !!duplicateWarning}>
                {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Criar Empresa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Company Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Empresa</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza? Isso apagará todos os dados da empresa (transações, clientes, categorias e centros de custo). Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelectClient;
